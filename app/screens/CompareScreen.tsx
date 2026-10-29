import { compareProfiles, scoreElementCompatibility } from '../../js/totem-match.js';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ElementCompatibilityCard } from '../components/ElementCompatibilityCard';
import type { TotemCardDetail } from '../components/TotemDetailModal';
import { ProfileSummary } from '../components/ProfileSummary';
import { MatchResultsList } from '../components/MatchResultsList';
import { useLocale } from '../lib/LocaleContext';
import type { MatchTypeId, MeProfile, TotemProfile } from '../types';
import { COLORS } from '../theme';

export type ComparePerson = {
  id: string;
  name: string;
  profile: TotemProfile;
  relationship?: string;
  locationLabel?: string;
};

type Props = {
  me: MeProfile;
  person: ComparePerson;
  backLabel?: string;
  onBack: () => void;
  onOpenMatch: (type: MatchTypeId) => void;
  onOpenTotem: (detail: TotemCardDetail) => void;
};

export function CompareScreen({
  me,
  person,
  backLabel,
  onBack,
  onOpenMatch,
  onOpenTotem,
}: Props) {
  const { t } = useLocale();
  const results = compareProfiles(me.profile, person.profile);
  const elementResult = scoreElementCompatibility(me.profile, person.profile);
  const best = results.reduce((top, entry) => (entry.count > top.count ? entry : top), results[0]);
  const bestLabel = t(`match.${best.type}.label`);
  const relationshipLabel = person.relationship
    ? t(`circle.relationship.${person.relationship.toLowerCase()}`)
    : null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>{backLabel ?? t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{person.name}</Text>
      {relationshipLabel ? <Text style={styles.tag}>{relationshipLabel}</Text> : null}
      {person.locationLabel ? <Text style={styles.tag}>{person.locationLabel}</Text> : null}
      <Text style={styles.lead}>
        {t('compare.strongestAlignment', { label: bestLabel, count: best.count })}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('compare.personGuides', { name: person.name })}</Text>
        <ProfileSummary
          profile={person.profile}
          onCardPress={({ animal, element, guideLabel }) =>
            onOpenTotem({ animal, element, guideLabel })
          }
        />
      </View>

      <ElementCompatibilityCard result={elementResult} />

      <Text style={styles.sectionTitle}>{t('compare.connectionTypes')}</Text>
      <MatchResultsList results={results} onSelect={onOpenMatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
  },
  tag: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    marginTop: -8,
  },
  lead: {
    color: COLORS.muted,
    fontSize: 15,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
