import { MATCH_TYPE_ORDER } from '../../js/totem-canon.js';
import type { MatchTypeResult } from '../../js/totem-match.js';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';
import type { MatchTypeId } from '../types';

type Props = {
  results: MatchTypeResult[];
  onSelect?: (type: MatchTypeId) => void;
};

export function MatchResultsList({ results, onSelect }: Props) {
  const { t } = useLocale();
  const ordered = MATCH_TYPE_ORDER.map(
    (type) => results.find((entry) => entry.type === type)!,
  ).filter(Boolean);

  return (
    <View style={styles.list}>
      {ordered.map((result) => (
        <Pressable
          key={result.type}
          style={[styles.card, result.isFullMatch && styles.cardFull]}
          onPress={() => onSelect?.(result.type as MatchTypeId)}
          disabled={!onSelect}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t(`match.${result.type}.label`)}</Text>
            <Text style={[styles.score, result.isFullMatch && styles.scoreFull]}>
              {result.count}/{result.total}
            </Text>
          </View>
          <Text style={styles.summary} numberOfLines={2}>
            {t(`match.${result.type}.summary`)}
          </Text>
          {result.isFullMatch ? (
            <Text style={styles.badge}>{t('match.fullMatchBadge')}</Text>
          ) : null}
          {onSelect ? <Text style={styles.tapHint}>{t('match.tapForDescription')}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  cardFull: {
    borderColor: COLORS.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  score: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  scoreFull: {
    color: COLORS.success,
  },
  summary: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  tapHint: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
  },
});
