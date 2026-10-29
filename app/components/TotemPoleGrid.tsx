import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { getTotemImageMeta } from '../lib/totem-images';
import { COLORS } from '../theme';

type Size = 'sm' | 'md' | 'lg';

type CardPressPayload = {
  pillar: 'spirit' | 'mental' | 'emotional' | 'physical';
  animal: string;
  element: string;
  guideLabel: string;
};

type Props = {
  animal: string;
  element: string;
  guideLabel: string;
  size?: Size;
  onPress?: () => void;
};

const SIZES: Record<Size, number> = {
  sm: 64,
  md: 96,
  lg: 128,
};

export function TotemAnimalCard({ animal, element, guideLabel, size = 'md', onPress }: Props) {
  const { t } = useLocale();
  const meta = getTotemImageMeta(animal, element);
  const dim = SIZES[size];
  const label = element ? `${element} ${animal}` : animal;

  const content = (
    <>
      <View
        style={[
          styles.artWrap,
          { width: dim, height: dim, shadowColor: meta?.glowColor ?? '#000' },
        ]}
      >
        {meta ? (
          <Image source={meta.source} style={styles.art} resizeMode="cover" accessibilityLabel={label} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}
      </View>
      <Text style={[styles.guide, size === 'sm' && styles.guideSm]} numberOfLines={1}>
        {guideLabel}
      </Text>
      <Text style={[styles.label, size === 'sm' && styles.labelSm]} numberOfLines={1}>
        {label}
      </Text>
      {onPress ? <Text style={styles.tapHint}>{t('common.tapToRead')}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.card, size === 'sm' && styles.cardSm]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Read about ${guideLabel}, ${label}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, size === 'sm' && styles.cardSm]}>{content}</View>;
}

type GridProps = {
  profile: {
    spirit: string;
    mental: string;
    emotional: string;
    physical: string;
    elements?: Partial<Record<'spirit' | 'mental' | 'emotional' | 'physical', string>>;
  };
  size?: Size;
  onCardPress?: (payload: CardPressPayload) => void;
};

export type { CardPressPayload };

const PILLAR_KEYS = ['spirit', 'mental', 'emotional', 'physical'] as const;

const PILLAR_ROWS: (typeof PILLAR_KEYS[number])[][] = [
  ['spirit', 'mental'],
  ['emotional', 'physical'],
];

function TotemPoleRows({
  profile,
  size,
  shortGuideLabels = false,
  onCardPress,
}: GridProps & { shortGuideLabels?: boolean }) {
  const { t } = useLocale();

  return (
    <View style={styles.grid}>
      {PILLAR_ROWS.map((row) => (
        <View key={row.join('-')} style={styles.gridRow}>
          {row.map((pillar) => {
            const fullGuide = t(`totem.guide.${pillar}`);
            const guideLabel = shortGuideLabels
              ? fullGuide.replace(/ Guide$/i, '')
              : fullGuide;
            return (
              <View key={pillar} style={styles.gridItem}>
                <TotemAnimalCard
                  animal={profile[pillar]}
                  element={profile.elements?.[pillar] ?? ''}
                  guideLabel={guideLabel}
                  size={size}
                  onPress={
                    onCardPress
                      ? () =>
                          onCardPress({
                            pillar,
                            animal: profile[pillar],
                            element: profile.elements?.[pillar] ?? '',
                            guideLabel: fullGuide,
                          })
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function TotemPoleGrid({ profile, size = 'md', onCardPress }: GridProps) {
  return <TotemPoleRows profile={profile} size={size} onCardPress={onCardPress} />;
}

type StripProps = GridProps;

export function TotemPoleStrip({ profile, onCardPress }: StripProps) {
  return <TotemPoleRows profile={profile} size="sm" shortGuideLabels onCardPress={onCardPress} />;
}

/** @deprecated Use TotemPoleGrid — kept as alias for existing imports. */
export function ProfileSummary({
  profile,
  onCardPress,
}: GridProps) {
  return <TotemPoleGrid profile={profile} size="md" onCardPress={onCardPress} />;
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  card: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
    maxWidth: 160,
  },
  cardSm: {
    gap: 4,
    maxWidth: 120,
  },
  artWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#121829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
  },
  placeholderText: {
    color: COLORS.dim,
    fontSize: 24,
    fontWeight: '700',
  },
  guide: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  guideSm: {
    fontSize: 10,
  },
  label: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelSm: {
    fontSize: 11,
  },
  tapHint: {
    color: COLORS.dim,
    fontSize: 10,
    textAlign: 'center',
  },
});
