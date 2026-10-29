import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollScreen } from '../components/KeyboardAwareScrollScreen';
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  requestPasswordReset,
  saveBirthDetails,
  updateAccount,
  type AccountUser,
} from '../lib/auth-api';
import { updateDirectoryListing } from '../lib/connections-api';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';

function birthCopy(account: AccountUser, t: (key: string, vars?: Record<string, string>) => string) {
  const dateStatus = account.birthVerificationStatus || 'none';
  const timeStatus = account.birthTimeVerificationStatus || 'none';
  const parts: string[] = [];
  if (dateStatus === 'verified') parts.push(t('app.account.birthVerified'));
  else if (dateStatus === 'pending') parts.push(t('app.account.birthPending'));
  else if (dateStatus === 'rejected') parts.push(t('app.account.birthRejected'));
  else parts.push(t('app.account.birthNone'));

  if (timeStatus === 'verified') parts.push(t('app.account.birthTimeVerified'));
  else if (timeStatus === 'pending') parts.push(t('app.account.birthTimePending'));
  else if (dateStatus === 'verified') parts.push(t('app.account.birthTimeNone'));
  return parts.join(' · ');
}

function guideLine(listing: NonNullable<AccountUser['listing']>) {
  const fmt = (pillar: 'spirit' | 'mental' | 'emotional' | 'physical') => {
    const animal = listing[pillar] || '';
    const element = listing.elements?.[pillar] || '';
    return element ? `${element} ${animal}` : animal;
  };
  return `Spirit ${fmt('spirit')} · Mind ${fmt('mental')} · Heart ${fmt('emotional')} · Body ${fmt('physical')}`;
}

export function AccountScreen() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [listingIntro, setListingIntro] = useState('');
  const [listingContact, setListingContact] = useState('');
  const [birthName, setBirthName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listingMessage, setListingMessage] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  const [birthMessage, setBirthMessage] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((next) => {
        setUser(next);
        if (next) {
          setProfileEmail(next.email || '');
          setProfilePhone(next.phone || '');
          setListingIntro(next.listing?.intro || '');
          setListingContact(next.listing?.contactEmail || '');
          setBirthName(next.birthName || '');
          setBirthDate(next.birthDate || '');
          setBirthTime(next.birthTime || '');
        }
      })
      .finally(() => setReady(true));
  }, []);

  const listingCopy = (account: AccountUser) => {
    if (!account.listing) return t('app.account.notListed');
    if (account.listing.status === 'approved') return t('app.account.listedLive');
    if (account.listing.status === 'rejected') return t('app.account.listedRejected');
    return t('app.account.listedPending');
  };

  const birthLocked =
    user?.birthVerificationStatus === 'pending' ||
    user?.birthVerificationStatus === 'verified' ||
    user?.birthTimeVerificationStatus === 'pending' ||
    user?.birthTimeVerificationStatus === 'verified';

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  const showAuthResult = (nextError: string | null, nextMessage: string | null = null) => {
    setError(nextError);
    setMessage(nextMessage);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const submitAuth = async () => {
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'register') {
        const normalizedUsername = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
          throw new Error(
            'Usernames can use capital letters, lowercase letters, numbers, and underscores (3–32 characters). Spaces and other symbols are not part of a username. Your password is separate and can use capitals and numbers freely.',
          );
        }
        if (!email.trim() && !phone.trim()) {
          throw new Error(t('app.account.needEmailOrPhone'));
        }
        if (password.length < 6) {
          throw new Error(
            'Password must be at least 6 characters. Capital letters, lowercase letters, and numbers are all allowed.',
          );
        }
        if (password !== password2) {
          throw new Error('Passwords do not match.');
        }
      } else if (!identifier.trim() || !password) {
        throw new Error('Enter the email, phone, or username and the password.');
      }
      const data =
        mode === 'register'
          ? await registerAccount({
              username: username.trim().toLowerCase(),
              email: email.trim(),
              phone: phone.trim(),
              password,
              staySignedIn,
            })
          : await loginAccount({
              identifier: identifier.trim(),
              password,
              staySignedIn,
            });
      setUser(data.user ?? null);
      setProfileEmail(data.user?.email || '');
      setProfilePhone(data.user?.phone || '');
      setListingIntro(data.user?.listing?.intro || '');
      setListingContact(data.user?.listing?.contactEmail || '');
      setBirthName(data.user?.birthName || '');
      setBirthDate(data.user?.birthDate || '');
      setBirthTime(data.user?.birthTime || '');
      setPassword('');
      setPassword2('');
      showAuthResult(null, mode === 'register' ? 'Account created.' : 'Signed in.');
    } catch (err) {
      showAuthResult(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAwareScrollScreen scrollRef={scrollRef} contentContainerStyle={styles.scroll}>
      <Text style={styles.lead}>{t('app.account.lead')}</Text>

      {user ? (
        <>
          <View style={styles.card}>
            <Text style={styles.status}>
              {t('app.account.signedInAs', { username: user.username })}
            </Text>
            <Text style={styles.listing}>{listingCopy(user)}</Text>
            <Text style={styles.listing}>{birthCopy(user, t)}</Text>

            <Text style={styles.label}>{t('page.account.username')}</Text>
            <Text style={styles.listing}>@{user.username}</Text>
            <Text style={styles.label}>{t('page.account.email')}</Text>
            <TextInput
              style={styles.input}
              value={profileEmail}
              onChangeText={setProfileEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>{t('page.account.phone')}</Text>
            <TextInput
              style={styles.input}
              value={profilePhone}
              onChangeText={setProfilePhone}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                setError(null);
                setMessage(null);
                try {
                  const data = await updateAccount({
                    email: profileEmail.trim(),
                    phone: profilePhone.trim(),
                  });
                  setUser(data.user ?? null);
                  setMessage(t('page.account.save'));
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not save profile.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text style={styles.buttonText}>{t('page.account.save')}</Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={async () => {
                await logoutAccount();
                setUser(null);
                setPassword('');
                setMessage(null);
                setError(null);
                setListingMessage(null);
                setListingError(null);
              }}
            >
              <Text style={styles.secondaryText}>{t('page.account.signOut')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.status}>{t('page.account.listingTitle')}</Text>
            <Text style={styles.listing}>{listingCopy(user)}</Text>
            {user.listing ? (
              <>
                <Text style={styles.listing}>{guideLine(user.listing)}</Text>
                <Text style={styles.label}>{t('page.account.username')}</Text>
                <Text style={styles.listing}>@{user.username}</Text>
                <Text style={styles.label}>{t('page.account.listingIntro')}</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={listingIntro}
                  onChangeText={setListingIntro}
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                />
                <Text style={styles.label}>{t('page.account.listingContactEmail')}</Text>
                <TextInput
                  style={styles.input}
                  value={listingContact}
                  onChangeText={setListingContact}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {listingError ? <Text style={styles.error}>{listingError}</Text> : null}
                {listingMessage ? <Text style={styles.message}>{listingMessage}</Text> : null}
                <Pressable
                  style={[styles.button, busy && styles.buttonDisabled]}
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    setListingError(null);
                    setListingMessage(null);
                    try {
                      const data = await updateDirectoryListing({
                        intro: listingIntro.trim(),
                        contactEmail: listingContact.trim(),
                      });
                      if (data.user) {
                        setUser(data.user);
                        setListingIntro(data.user.listing?.intro || '');
                        setListingContact(data.user.listing?.contactEmail || '');
                      }
                      setListingMessage(data.message || t('page.account.listingSaved'));
                    } catch (err) {
                      setListingError(
                        err instanceof Error ? err.message : 'Could not save listing.'
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>{t('page.account.listingSave')}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.button}
                onPress={() => {
                  void Linking.openURL('https://totemastrology.com/connections.html');
                }}
              >
                <Text style={styles.buttonText}>{t('page.account.listingJoinLink')}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.status}>{t('page.account.birthDetailsTitle')}</Text>
            <Text style={styles.listing}>{t('page.account.birthDetailsLead')}</Text>
            <Text style={styles.label}>{t('page.account.birthName')}</Text>
            <TextInput
              style={styles.input}
              value={birthName}
              onChangeText={setBirthName}
              placeholder={t('page.account.birthNamePlaceholder')}
              placeholderTextColor={COLORS.dim}
              editable={!birthLocked}
              autoCapitalize="words"
            />
            <Text style={styles.label}>{t('page.account.birthDateClaimed')}</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.dim}
              editable={!birthLocked}
              autoCapitalize="none"
            />
            <Text style={styles.label}>{t('page.account.birthTimeClaimed')}</Text>
            <TextInput
              style={styles.input}
              value={birthTime}
              onChangeText={setBirthTime}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.dim}
              editable={!birthLocked}
              autoCapitalize="none"
            />
            {birthError ? <Text style={styles.error}>{birthError}</Text> : null}
            {birthMessage ? <Text style={styles.message}>{birthMessage}</Text> : null}
            <Pressable
              style={[styles.button, (busy || birthLocked) && styles.buttonDisabled]}
              disabled={busy || birthLocked}
              onPress={async () => {
                setBusy(true);
                setBirthError(null);
                setBirthMessage(null);
                try {
                  const data = await saveBirthDetails({
                    birthName: birthName.trim(),
                    birthDate: birthDate.trim(),
                    birthTime: birthTime.trim(),
                  });
                  if (data.user) {
                    setUser(data.user);
                    setBirthName(data.user.birthName || '');
                    setBirthDate(data.user.birthDate || '');
                    setBirthTime(data.user.birthTime || '');
                  }
                  setBirthMessage(data.message || t('page.account.birthDetailsSaved'));
                } catch (err) {
                  setBirthError(err instanceof Error ? err.message : 'Could not save birth details.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text style={styles.buttonText}>{t('page.account.birthDetailsSave')}</Text>
            </Pressable>

            <Text style={[styles.status, styles.sectionSpaced]}>{t('page.account.birthTitle')}</Text>
            <Text style={styles.listing}>{t('page.account.birthLead')}</Text>
            <Text style={styles.listing}>{birthCopy(user, t)}</Text>
            <Pressable
              style={styles.secondary}
              onPress={() => {
                void Linking.openURL('https://totemastrology.com/account.html');
              }}
            >
              <Text style={styles.secondaryText}>{t('app.account.submitBirth')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                {t('page.account.signIn')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                {t('page.account.create')}
              </Text>
            </Pressable>
          </View>

          {mode === 'login' ? (
            <>
              <Text style={styles.label}>{t('page.account.identifier')}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>{t('page.account.username')}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                value={username}
                onChangeText={setUsername}
              />
              <Text style={styles.hint}>{t('page.account.usernameHint')}</Text>
              <Text style={styles.label}>{t('page.account.email')}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.label}>{t('page.account.phone')}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </>
          )}

          <Text style={styles.label}>{t('page.account.password')}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.hint}>{t('page.account.passwordHint')}</Text>

          {mode === 'login' ? (
            <>
              <Pressable
                style={styles.secondary}
                onPress={() => {
                  setForgotOpen((open) => !open);
                  setForgotIdentifier((current) => current || identifier.trim());
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
                }}
              >
                <Text style={styles.secondaryText}>{t('page.account.forgot')}</Text>
              </Pressable>
              {forgotOpen ? (
                <>
                  <Text style={styles.hint}>{t('page.account.forgotLead')}</Text>
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={forgotIdentifier}
                    onChangeText={setForgotIdentifier}
                    placeholder={t('page.account.identifier')}
                    placeholderTextColor={COLORS.dim}
                  />
                  <Pressable
                    style={[styles.button, busy && styles.buttonDisabled]}
                    disabled={busy}
                    onPress={() => {
                      Keyboard.dismiss();
                      const identifierValue = (forgotIdentifier || identifier).trim();
                      if (!identifierValue) {
                        showAuthResult('Enter the email or phone on your account.');
                        return;
                      }
                      setBusy(true);
                      setError(null);
                      setMessage(null);
                      void requestPasswordReset(identifierValue)
                        .then((data) => {
                          showAuthResult(null, data.message || t('page.account.forgotSent'));
                        })
                        .catch((err) => {
                          showAuthResult(err instanceof Error ? err.message : 'Could not send a reset link.');
                        })
                        .finally(() => setBusy(false));
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator color="#1a1510" />
                    ) : (
                      <Text style={styles.buttonText}>{t('page.account.forgotSend')}</Text>
                    )}
                  </Pressable>
                </>
              ) : null}
            </>
          ) : null}

          {mode === 'register' ? (
            <>
              <Text style={styles.label}>{t('page.account.passwordConfirm')}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password2}
                onChangeText={setPassword2}
              />
            </>
          ) : null}

          <Pressable style={styles.checkRow} onPress={() => setStaySignedIn((value) => !value)}>
            <View style={[styles.checkBox, staySignedIn && styles.checkBoxOn]} />
            <Text style={styles.checkLabel}>{t('page.account.staySignedIn')}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => {
              void submitAuth();
            }}
          >
            {busy ? (
              <ActivityIndicator color="#1a1510" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'register' ? t('page.account.create') : t('page.account.signIn')}
              </Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      )}
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 160 },
  lead: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tab: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(201,169,98,0.12)' },
  tabText: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  tabTextActive: { color: COLORS.gold },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  textarea: {
    minHeight: 88,
  },
  button: {
    marginTop: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#1a1510',
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  secondary: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  secondaryText: { color: COLORS.gold, fontWeight: '600', textAlign: 'center' },
  status: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  sectionSpaced: { marginTop: 16 },
  listing: { color: COLORS.muted, marginBottom: 4 },
  hint: { color: COLORS.dim, fontSize: 13, lineHeight: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  checkBoxOn: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  checkLabel: { color: COLORS.text, fontSize: 15, flex: 1 },
  error: { color: '#e08a8a', fontSize: 15, lineHeight: 21 },
  message: { color: COLORS.gold, fontSize: 15, lineHeight: 21 },
});
