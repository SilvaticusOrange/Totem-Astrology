import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MATCH_TYPE_ORDER } from '../../js/totem-canon.js';
import { compareProfiles, scoreMatchType } from '../../js/totem-match.js';
import { KeyboardAwareScrollScreen } from '../components/KeyboardAwareScrollScreen';
import { TotemPoleStrip } from '../components/TotemPoleGrid';
import {
  fetchDirectoryProfiles,
  joinDirectory,
  removeDirectoryListing,
  type DirectoryProfile,
} from '../lib/connections-api';
import { fetchCurrentUser, getAuthToken } from '../lib/auth-api';
import {
  formatGeoPlaceLabel,
  searchGeoCities,
  type GeoPlace,
} from '../lib/geo';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';
import type { MatchTypeId, MeProfile } from '../types';

const RADIUS_OPTIONS = [25, 50, 80, 160, 400] as const;

type Props = {
  me: MeProfile | null;
  onSetupTotem: () => void;
  onOpenMatch: (person: DirectoryProfile, type: MatchTypeId) => void;
  onOpenTotem: (payload: { animal: string; element?: string; guideLabel?: string }) => void;
};

type RankedProfile = {
  profile: DirectoryProfile;
  bestType: MatchTypeId;
  bestCount: number;
  results: ReturnType<typeof compareProfiles>;
};

export function DiscoverScreen({ me, onSetupTotem, onOpenMatch, onOpenTotem }: Props) {
  const { t } = useLocale();
  const areaInputRef = useRef<TextInput>(null);
  const searchVersion = useRef(0);
  const chosenQuery = useRef<string | null>(null);
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<GeoPlace[]>([]);
  const [area, setArea] = useState<GeoPlace | null>(null);
  const [radiusKm, setRadiusKm] = useState<(typeof RADIUS_OPTIONS)[number]>(80);
  const [matchType, setMatchType] = useState<MatchTypeId | 'any'>('any');
  const [minCount, setMinCount] = useState(1);
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinIntro, setJoinIntro] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  const chooseArea = (place: GeoPlace) => {
    const label = formatGeoPlaceLabel(place);
    chosenQuery.current = label;
    searchVersion.current += 1;
    setArea(place);
    setAreaQuery(label);
    setAreaResults([]);
  };

  useEffect(() => {
    const query = areaQuery.trim();
    if (chosenQuery.current === query) return;
    if (query.length < 2) {
      searchVersion.current += 1;
      setAreaResults([]);
      return;
    }
    const version = searchVersion.current + 1;
    searchVersion.current = version;
    const timer = setTimeout(async () => {
      try {
        const places = await searchGeoCities(query);
        if (searchVersion.current !== version) return;
        setAreaResults(places);
      } catch {
        if (searchVersion.current !== version) return;
        setAreaResults([]);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [areaQuery]);

  const ranked = useMemo((): RankedProfile[] => {
    if (!me) return [];
    return profiles
      .map((profile) => {
        const results = compareProfiles(me.profile, profile);
        const scored =
          matchType === 'any'
            ? results
            : [scoreMatchType(me.profile, profile, matchType)];
        const best = scored.reduce(
          (acc, entry) => (entry.count > acc.count ? entry : acc),
          scored[0],
        );
        return {
          profile,
          bestType: best.type as MatchTypeId,
          bestCount: best.count,
          results,
        };
      })
      .filter((entry) => entry.bestCount >= minCount)
      .sort((a, b) => {
        if (b.bestCount !== a.bestCount) return b.bestCount - a.bestCount;
        const da = a.profile.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.profile.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
  }, [me, matchType, minCount, profiles]);

  const runSearch = async () => {
    if (!me) return;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const [{ profiles: next }, account] = await Promise.all([
        fetchDirectoryProfiles(
          area
            ? { lat: area.lat, lon: area.lon, radiusKm }
            : undefined,
        ),
        fetchCurrentUser(),
      ]);
      const selfName = account?.username || me.name;
      setProfiles(next.filter((entry) => entry.displayName !== selfName));
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : t('discover.error.search'),
      );
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!me || !area) {
      setJoinMessage(t('discover.error.areaRequired'));
      return;
    }
    if (!(await getAuthToken())) {
      setJoinMessage('Sign in on the Account tab before joining the directory.');
      return;
    }
    setJoinBusy(true);
    setJoinMessage(null);
    try {
      const result = await joinDirectory({
        profile: me.profile,
        intro: joinIntro.trim(),
        contactEmail: joinEmail.trim(),
        location: area,
      });
      setJoinMessage(result.message || t('discover.success.submitted'));
      setJoinOpen(false);
    } catch (joinError) {
      setJoinMessage(
        joinError instanceof Error ? joinError.message : t('discover.error.join'),
      );
    } finally {
      setJoinBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!me) return;
    if (!(await getAuthToken())) {
      setJoinMessage('Sign in on the Account tab before removing your listing.');
      return;
    }
    setJoinBusy(true);
    setJoinMessage(null);
    try {
      await removeDirectoryListing();
      setJoinMessage(t('discover.success.removed'));
    } catch (removeError) {
      setJoinMessage(
        removeError instanceof Error
          ? removeError.message
          : t('discover.error.remove'),
      );
    } finally {
      setJoinBusy(false);
    }
  };

  if (!me) {
    return (
      <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('discover.title')}</Text>
        <Text style={styles.lead}>{t('discover.lead')}</Text>
        <Pressable style={styles.primaryButton} onPress={onSetupTotem}>
          <Text style={styles.primaryButtonText}>{t('discover.setup')}</Text>
        </Pressable>
      </KeyboardAwareScrollScreen>
    );
  }

  return (
    <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{t('discover.title')}</Text>
      <Text style={styles.lead}>{t('discover.lead')}</Text>

      <View style={styles.panel}>
        <Text style={styles.label}>{t('discover.area')}</Text>
        <TextInput
          ref={areaInputRef}
          style={styles.input}
          value={areaQuery}
          onChangeText={(value) => {
            if (value === '' && areaQuery.trim().length > 1) {
              areaInputRef.current?.setNativeProps({ text: areaQuery });
              return;
            }
            if (value === areaQuery) return;
            chosenQuery.current = null;
            setAreaQuery(value);
            setArea(null);
          }}
          placeholder={t('discover.areaPlaceholder')}
          placeholderTextColor={COLORS.dim}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textContentType="none"
        />
        {areaResults.length > 0 ? (
          <View style={styles.suggestions}>
            {areaResults.map((place) => (
              <Pressable
                key={`${place.name}-${place.country}-${place.lat}-${place.lon}`}
                style={styles.suggestion}
                onPressIn={() => chooseArea(place)}
              >
                <Text style={styles.suggestionText}>{formatGeoPlaceLabel(place)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text style={styles.hint}>
          {area
            ? t('discover.radiusHint', {
                km: radiusKm,
                area: formatGeoPlaceLabel(area),
              })
            : t('discover.radiusHintGlobal')}
        </Text>

        {area ? (
          <View style={styles.chipRow}>
            {RADIUS_OPTIONS.map((km) => (
              <Pressable
                key={km}
                style={[styles.chip, radiusKm === km && styles.chipActive]}
                onPress={() => setRadiusKm(km)}
              >
                <Text style={[styles.chipText, radiusKm === km && styles.chipTextActive]}>
                  {km} km
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>{t('discover.connectionType')}</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, matchType === 'any' && styles.chipActive]}
            onPress={() => setMatchType('any')}
          >
            <Text style={[styles.chipText, matchType === 'any' && styles.chipTextActive]}>
              {t('common.any')}
            </Text>
          </Pressable>
          {MATCH_TYPE_ORDER.map((type) => (
            <Pressable
              key={type}
              style={[styles.chip, matchType === type && styles.chipActive]}
              onPress={() => setMatchType(type as MatchTypeId)}
            >
              <Text style={[styles.chipText, matchType === type && styles.chipTextActive]}>
                {t(`match.${type}.label`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>{t('discover.minGuides')}</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4].map((count) => (
            <Pressable
              key={count}
              style={[styles.chip, minCount === count && styles.chipActive]}
              onPress={() => setMinCount(count)}
            >
              <Text style={[styles.chipText, minCount === count && styles.chipTextActive]}>
                {count}+
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={runSearch} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.primaryButtonText}>{t('discover.search')}</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {searched && !loading ? (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>
            {ranked.length === 0
              ? t('discover.results.none')
              : ranked.length === 1
                ? t('discover.results.count', { count: ranked.length })
                : t('discover.results.countPlural', { count: ranked.length })}
          </Text>
          {ranked.length === 0 ? (
            <Text style={styles.hint}>
              {area ? t('discover.empty.withRadius') : t('discover.empty.global')}
            </Text>
          ) : (
            ranked.map(({ profile, bestType, bestCount, results }) => (
              <View key={profile.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{profile.displayName}</Text>
                    {profile.birthVerified ? (
                      <Text style={styles.verifiedBadge}>{t('discover.verified')}</Text>
                    ) : null}
                    {profile.birthTimeVerified ? (
                      <Text style={styles.timeVerifiedBadge}>{t('discover.timeVerified')}</Text>
                    ) : null}
                  </View>
                  {profile.distanceKm !== undefined ? (
                    <Text style={styles.distance}>{profile.distanceKm} km</Text>
                  ) : null}
                </View>
                {profile.location?.label ? (
                  <Text style={styles.cardMeta}>{profile.location.label}</Text>
                ) : (
                  <Text style={styles.cardMeta}>{t('discover.areaNotListed')}</Text>
                )}
                <TotemPoleStrip
                  profile={profile}
                  onCardPress={({ animal, element, guideLabel }) =>
                    onOpenTotem({ animal, element, guideLabel })
                  }
                />
                <View style={styles.badgeRow}>
                  {results
                    .filter((entry) => entry.count > 0)
                    .map((entry) => (
                      <Pressable
                        key={entry.type}
                        style={styles.badge}
                        onPress={() => onOpenMatch(profile, entry.type as MatchTypeId)}
                      >
                        <Text style={styles.badgeText}>
                          {t(`match.${entry.type}.label`)} {entry.count}/4
                        </Text>
                      </Pressable>
                    ))}
                </View>
                <Text style={styles.bestLine}>
                  {t('discover.strongestLine', {
                    label: t(`match.${bestType}.label`),
                    count: bestCount,
                  })}
                </Text>
                {profile.intro ? <Text style={styles.intro}>{profile.intro}</Text> : null}
                {profile.contactEmail ? (
                  <Text style={styles.email}>{profile.contactEmail}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.label}>{t('discover.listYourself')}</Text>
        <Text style={styles.hint}>{t('discover.listYourselfHint')}</Text>
        {!joinOpen ? (
          <View style={styles.rowButtons}>
            <Pressable style={styles.secondaryButton} onPress={() => setJoinOpen(true)}>
              <Text style={styles.secondaryButtonText}>{t('discover.join')}</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={handleRemove} disabled={joinBusy}>
              <Text style={styles.ghostButtonText}>{t('discover.remove')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.joinForm}>
            <Text style={styles.hint}>{t('discover.joinUsesSaved')}</Text>
            <TextInput
              style={styles.input}
              value={joinIntro}
              onChangeText={setJoinIntro}
              placeholder={t('discover.introPlaceholder')}
              placeholderTextColor={COLORS.dim}
              maxLength={280}
            />
            <TextInput
              style={styles.input}
              value={joinEmail}
              onChangeText={setJoinEmail}
              placeholder={t('discover.emailPlaceholder')}
              placeholderTextColor={COLORS.dim}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={styles.primaryButton}
              onPress={handleJoin}
              disabled={joinBusy}
            >
              {joinBusy ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('discover.submitListing')}</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setJoinOpen(false)}>
              <Text style={styles.ghostButtonText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        )}
        {joinMessage ? <Text style={styles.joinMessage}>{joinMessage}</Text> : null}
      </View>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  lead: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSpaced: {
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  hint: {
    color: COLORS.dim,
    fontSize: 13,
    lineHeight: 18,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#1f1a12',
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.gold,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.gold,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ghostButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  joinForm: {
    gap: 10,
  },
  joinMessage: {
    color: COLORS.gold,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: COLORS.danger,
    fontSize: 14,
  },
  results: {
    gap: 12,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  verifiedBadge: {
    color: '#1a1510',
    backgroundColor: 'rgba(201,169,98,0.45)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  timeVerifiedBadge: {
    color: '#2a2010',
    backgroundColor: '#c9a962',
    borderWidth: 1,
    borderColor: '#e8c56a',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  distance: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  cardMeta: {
    color: COLORS.muted,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.bg,
  },
  badgeText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  bestLine: {
    color: COLORS.dim,
    fontSize: 12,
  },
  intro: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  email: {
    color: COLORS.gold,
    fontSize: 13,
  },
});
