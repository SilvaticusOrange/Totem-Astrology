import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { compareProfiles } from '../js/totem-match.js';
import { ArticleModal } from './components/ArticleModal';
import { MythicBackdrop } from './components/MythicBackdrop';
import { LanguageBar } from './components/LanguageBar';
import { MatchDetailModal } from './components/MatchDetailModal';
import { TotemDetailModal, type TotemCardDetail } from './components/TotemDetailModal';
import type { DirectoryProfile } from './lib/connections-api';
import { resolveInitialLocale, writeStoredLocale } from './lib/i18n';
import { LocaleProvider, useLocale } from './lib/LocaleContext';
import { AccountScreen } from './screens/AccountScreen';
import { CompareScreen, type ComparePerson } from './screens/CompareScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { LearnScreen } from './screens/LearnScreen';
import { MyCircleScreen } from './screens/MyCircleScreen';
import { MyTotemScreen } from './screens/MyTotemScreen';
import { loadAppData, saveAppData } from './storage';
import { COLORS } from './theme';
import type { AppData, CirclePerson, MatchTypeId, MeProfile } from './types';

type Tab = 'totem' | 'circle' | 'discover' | 'account' | 'learn';

function circleToCompare(person: CirclePerson): ComparePerson {
  return {
    id: person.id,
    name: person.name,
    profile: person.profile,
    relationship: person.relationship,
  };
}

function directoryToCompare(profile: DirectoryProfile): ComparePerson {
  return {
    id: profile.id,
    name: profile.displayName,
    profile: {
      spirit: profile.spirit,
      mental: profile.mental,
      emotional: profile.emotional,
      physical: profile.physical,
      elements: profile.elements,
    },
    locationLabel: profile.location?.label,
  };
}

function AppShell() {
  const { locale, setLocale, t } = useLocale();
  const [data, setData] = useState<AppData>({ me: null, circle: [] });
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('totem');
  const [comparePerson, setComparePerson] = useState<ComparePerson | null>(null);
  const [compareSource, setCompareSource] = useState<'circle' | 'discover'>('circle');
  const [matchDetail, setMatchDetail] = useState<MatchTypeId | null>(null);
  const [learnArticle, setLearnArticle] = useState<string | null>(null);
  const [totemDetail, setTotemDetail] = useState<TotemCardDetail | null>(null);

  useEffect(() => {
    loadAppData().then((loaded) => {
      setData(loaded);
      setReady(true);
      if (loaded.me) setTab('circle');
    });
  }, []);

  const persist = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      void saveAppData(next);
      return next;
    });
  }, []);

  const handleSaveMe = useCallback(
    (me: MeProfile) => {
      persist((prev) => ({ ...prev, me }));
      setTab('circle');
    },
    [persist],
  );

  const handleAddPerson = useCallback(
    (person: CirclePerson) => {
      persist((prev) => ({ ...prev, circle: [person, ...prev.circle] }));
    },
    [persist],
  );

  const handleRemovePerson = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, circle: prev.circle.filter((person) => person.id !== id) }));
      if (comparePerson?.id === id) setComparePerson(null);
    },
    [comparePerson, persist],
  );

  const handleLocaleChange = useCallback(
    (code: string) => {
      setLocale(code);
      void writeStoredLocale(code);
    },
    [setLocale],
  );

  const matchResult = useMemo(() => {
    if (!data.me || !comparePerson || !matchDetail) return null;
    return (
      compareProfiles(data.me.profile, comparePerson.profile).find(
        (entry) => entry.type === matchDetail,
      ) ?? null
    );
  }, [comparePerson, data.me, matchDetail]);

  const heading = comparePerson
    ? t('app.heading.compare')
    : tab === 'totem'
      ? t('app.heading.totem')
      : tab === 'circle'
        ? t('app.heading.circle')
        : tab === 'discover'
          ? t('app.heading.discover')
          : tab === 'account'
            ? t('app.heading.account')
            : t('app.heading.learn');

  if (!ready) {
    return (
      <MythicBackdrop>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.gold} size="large" />
          </View>
        </SafeAreaView>
      </MythicBackdrop>
    );
  }

  return (
    <MythicBackdrop>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{t('app.brand')}</Text>
            <Text style={styles.heading}>{heading}</Text>
          </View>
        </View>

        <LanguageBar locale={locale} onChange={handleLocaleChange} />

        <View style={styles.tabs}>
          {(
            [
              ['totem', 'app.tab.totem'],
              ['circle', 'app.tab.circle'],
              ['discover', 'app.tab.discover'],
              ['account', 'app.tab.account'],
              ['learn', 'app.tab.learn'],
            ] as const
          ).map(([id, key]) => (
            <Pressable
              key={id}
              style={[styles.tab, tab === id && styles.tabActive]}
              onPress={() => {
                setTab(id);
                setComparePerson(null);
                setMatchDetail(null);
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.tabText, tab === id && styles.tabTextActive]}
              >
                {t(key)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.body}>
          {comparePerson && data.me ? (
            <ScrollView contentContainerStyle={styles.scroll}>
              <CompareScreen
                me={data.me}
                person={comparePerson}
                backLabel={
                  compareSource === 'discover'
                    ? `← ${t('app.heading.discover')}`
                    : `← ${t('app.heading.circle')}`
                }
                onBack={() => setComparePerson(null)}
                onOpenMatch={setMatchDetail}
                onOpenTotem={setTotemDetail}
              />
            </ScrollView>
          ) : tab === 'totem' ? (
            <MyTotemScreen me={data.me} onSave={handleSaveMe} onOpenTotem={setTotemDetail} />
          ) : tab === 'circle' ? (
            <MyCircleScreen
              me={data.me}
              circle={data.circle}
              onAddPerson={handleAddPerson}
              onRemovePerson={handleRemovePerson}
              onCompare={(person) => {
                setCompareSource('circle');
                setComparePerson(circleToCompare(person));
              }}
              onSetupTotem={() => setTab('totem')}
              onOpenTotem={setTotemDetail}
            />
          ) : tab === 'discover' ? (
            <DiscoverScreen
              me={data.me}
              onSetupTotem={() => setTab('totem')}
              onOpenMatch={(profile, type) => {
                setCompareSource('discover');
                setComparePerson(directoryToCompare(profile));
                setMatchDetail(type);
              }}
              onOpenTotem={setTotemDetail}
            />
          ) : tab === 'account' ? (
            <AccountScreen />
          ) : (
            <LearnScreen
              onOpenTopic={setLearnArticle}
              onOpenAnimal={(animal) => setTotemDetail({ animal })}
            />
          )}
        </View>

        <MatchDetailModal
          visible={Boolean(matchDetail && matchResult && comparePerson)}
          type={matchDetail}
          result={matchResult}
          personName={comparePerson?.name ?? ''}
          meProfile={data.me?.profile ?? null}
          personProfile={comparePerson?.profile ?? null}
          onClose={() => setMatchDetail(null)}
        />

        <ArticleModal topicId={learnArticle} onClose={() => setLearnArticle(null)} />

        <TotemDetailModal
          visible={Boolean(totemDetail)}
          detail={totemDetail}
          onClose={() => setTotemDetail(null)}
        />
      </SafeAreaView>
    </MythicBackdrop>
  );
}

export default function App() {
  const [locale, setLocale] = useState('en');
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    resolveInitialLocale().then((code) => {
      setLocale(code);
      setLocaleReady(true);
    });
  }, []);

  if (!localeReady) {
    return (
      <MythicBackdrop>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.gold} size="large" />
          </View>
        </SafeAreaView>
      </MythicBackdrop>
    );
  }

  return (
    <LocaleProvider locale={locale} setLocale={setLocale}>
      <AppShell />
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 54, 0.9)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 20, 28, 0.82)',
  },
  tabActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(31, 26, 18, 0.92)',
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  body: {
    flex: 1,
  },
});
