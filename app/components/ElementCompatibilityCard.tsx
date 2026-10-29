import type { ElementCompatibilityResult } from '../../js/totem-match.js';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';

type Props = {
  result: ElementCompatibilityResult;
};

function kindStyle(kind: string) {
  if (kind === 'generating') return styles.generating;
  if (kind === 'same') return styles.same;
  if (kind === 'controlling') return styles.controlling;
  return styles.unknown;
}

function kindLabel(
  kind: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
  fallback: string,
) {
  if (kind === 'generating') return t('element.flow.nourishing');
  if (kind === 'same') return t('element.flow.same');
  if (kind === 'controlling') return t('element.flow.controlling');
  return fallback;
}

export function ElementCompatibilityCard({ result }: Props) {
  const { t } = useLocale();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('element.flow.title')}</Text>
        <Text style={styles.score}>
          {t('element.flow.score', { score: `${result.generating}/${result.total}` })}
        </Text>
      </View>
      <Text style={styles.lead}>{t('element.flow.lead')}</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryChip}>
          <Text style={styles.generating}>{result.generating}</Text> {t('element.flow.nourishing')}
        </Text>
        <Text style={styles.summaryChip}>
          <Text style={styles.same}>{result.same}</Text> {t('element.flow.same')}
        </Text>
        <Text style={styles.summaryChip}>
          <Text style={styles.controlling}>{result.controlling}</Text>{' '}
          {t('element.flow.controlling')}
        </Text>
      </View>

      <View style={styles.list}>
        {result.pillars.map((pillar) => (
          <View key={pillar.pillar} style={styles.row}>
            <View style={styles.meta}>
              <Text style={styles.guide}>{t(`totem.guide.${pillar.pillar}`)}</Text>
              <Text style={styles.pair}>
                {pillar.elementA || '?'} ↔ {pillar.elementB || '?'}
              </Text>
              <Text style={[styles.detail, kindStyle(pillar.compatibility.kind)]}>
                {kindLabel(pillar.compatibility.kind, t, pillar.compatibility.label)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
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
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '700',
  },
  lead: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryChip: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  meta: {
    gap: 2,
  },
  guide: {
    color: COLORS.muted,
    fontSize: 12,
  },
  pair: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  generating: {
    color: COLORS.success,
  },
  same: {
    color: COLORS.gold,
  },
  controlling: {
    color: '#9a8fc4',
  },
  unknown: {
    color: COLORS.dim,
  },
});
