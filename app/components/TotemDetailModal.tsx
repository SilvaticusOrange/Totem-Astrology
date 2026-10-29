import { lookupElementAnimalLore, formatElementAnimalTitle } from '../../js/totem-element-lore.js';
import { lookupTotemDetail } from '../../js/totem-details.js';
import { ANIMAL_POLARITY, THEME_LABELS } from '../../js/totem-manifest.js';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { getTotemImageMeta } from '../lib/totem-images';
import { COLORS } from '../theme';

export type TotemCardDetail = {
  animal: string;
  element?: string;
  guideLabel?: string;
};

type Props = {
  visible: boolean;
  detail: TotemCardDetail | null;
  onClose: () => void;
};

export function TotemDetailModal({ visible, detail, onClose }: Props) {
  const { t } = useLocale();
  if (!detail) return null;

  const { animal, element = '', guideLabel } = detail;
  const polarity = (ANIMAL_POLARITY as Record<string, string>)[animal] ?? 'yang';
  const polarityLabel =
    polarity === 'yang' ? t('totem.polarity.yang') : t('totem.polarity.yin');
  const themeKey = `${polarity}-${element.toLowerCase()}`;
  const themeLabel = element
    ? ((THEME_LABELS as Record<string, string>)[themeKey] ?? `${polarityLabel} ${element}`)
    : polarityLabel;
  const lore = lookupTotemDetail(animal, element, polarity);
  const elementLore = element ? lookupElementAnimalLore(animal, element) : null;
  const art = getTotemImageMeta(animal, element);
  const label = element ? `${element} ${animal}` : animal;

  const title = lore?.title ?? `The ${animal}`;
  const subtitle = element
    ? `${polarityLabel} ${element} · ${themeLabel}`
    : `${polarityLabel} · ${animal} totem`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {art ? (
            <View style={[styles.artWrap, { shadowColor: art.glowColor }]}>
              <Image source={art.source} style={styles.art} resizeMode="cover" accessibilityLabel={label} />
            </View>
          ) : null}

          <Text style={styles.kicker}>{guideLabel ?? t('totem.detail.kickerFallback')}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {lore?.paragraphs?.length ? (
            lore.paragraphs.map((paragraph: string) => (
              <Text key={paragraph.slice(0, 48)} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))
          ) : (
            <Text style={styles.paragraph}>{t('totem.detail.comingSoon')}</Text>
          )}

          {elementLore?.paragraph ? (
            <View style={styles.elementSection}>
              <Text style={styles.elementTitle}>
                {formatElementAnimalTitle(animal, element, '')}
              </Text>
              <Text style={styles.paragraph}>{elementLore.paragraph}</Text>
            </View>
          ) : null}
        </ScrollView>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    gap: 12,
    alignItems: 'center',
  },
  artWrap: {
    width: 128,
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#121829',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 4,
  },
  art: {
    width: '100%',
    height: '100%',
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  paragraph: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    alignSelf: 'stretch',
  },
  elementSection: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  elementTitle: {
    color: COLORS.gold,
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
