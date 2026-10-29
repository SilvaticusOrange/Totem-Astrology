import { MATCH_TYPES } from '../../js/totem-canon.js';
import type { MatchTypeResult } from '../../js/totem-match.js';
import { formatElementAnimal } from '../../js/totem-chart.js';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { getTotemImageMeta } from '../lib/totem-images';
import { COLORS } from '../theme';
import type { MatchTypeId, TotemProfile } from '../types';

type Props = {
  visible: boolean;
  type: MatchTypeId | null;
  result: MatchTypeResult | null;
  personName: string;
  meProfile: TotemProfile | null;
  personProfile: TotemProfile | null;
  onClose: () => void;
};

export function MatchDetailModal({
  visible,
  type,
  result,
  personName,
  meProfile,
  personProfile,
  onClose,
}: Props) {
  const { t } = useLocale();
  if (!type || !result) return null;
  const meta = MATCH_TYPES[type];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.kicker}>{t('match.connectionWith', { name: personName })}</Text>
          <Text style={styles.title}>{t(`match.${type}.label`)}</Text>
          <Text style={styles.score}>
            {t('match.guidesAlign', { count: result.count, total: result.total })}
          </Text>
          <Text style={styles.summary}>{t(`match.${type}.summary`)}</Text>
          <Text style={styles.description}>{meta.description}</Text>

          <Text style={styles.sectionTitle}>{t('match.guideByGuide')}</Text>
          {result.pillars.map((pillar) => {
            const meArt =
              meProfile && getTotemImageMeta(meProfile[pillar.pillar], meProfile.elements?.[pillar.pillar] ?? '');
            const personArt =
              personProfile &&
              getTotemImageMeta(personProfile[pillar.pillar], personProfile.elements?.[pillar.pillar] ?? '');

            return (
            <View key={pillar.pillar} style={styles.pillarRow}>
              <View style={styles.pillarMeta}>
                <Text style={styles.pillarGuide}>{t(`totem.guide.${pillar.pillar}`)}</Text>
                <View style={styles.pillarArtRow}>
                  {meArt ? (
                    <Image source={meArt.source} style={styles.pillarThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.pillarThumbPlaceholder} />
                  )}
                  <Text style={styles.pillarPair}>
                    {meProfile && personProfile
                      ? `${formatElementAnimal(meProfile, pillar.pillar)} ↔ ${formatElementAnimal(personProfile, pillar.pillar)}`
                      : `${pillar.animalA} ↔ ${pillar.animalB}`}
                  </Text>
                  {personArt ? (
                    <Image source={personArt.source} style={styles.pillarThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.pillarThumbPlaceholder} />
                  )}
                </View>
              </View>
              <Text style={[styles.pillarStatus, pillar.matches && styles.pillarMatch]}>
                {pillar.matches ? t('match.pillarMatch') : t('match.pillarNoMatch')}
              </Text>
            </View>
            );
          })}
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
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
  },
  score: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  description: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  pillarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pillarMeta: {
    flex: 1,
    paddingRight: 12,
  },
  pillarGuide: {
    color: COLORS.muted,
    fontSize: 13,
  },
  pillarPair: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  pillarArtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  pillarThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillarThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  pillarStatus: {
    color: COLORS.dim,
    fontSize: 14,
    fontWeight: '700',
  },
  pillarMatch: {
    color: COLORS.success,
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
