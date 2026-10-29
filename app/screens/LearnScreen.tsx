import { ZODIAC_ANIMALS } from '../../js/totem-canon.js';
import {
  LEARN_CONNECTION_ORDER,
  LEARN_FAQ_ORDER,
  LEARN_TOPIC_ORDER,
  getLearnTopic,
} from '../../js/learn-topics.js';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollScreen } from '../components/KeyboardAwareScrollScreen';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';

type Props = {
  onOpenTopic: (topicId: string) => void;
  onOpenAnimal: (animal: string) => void;
};

const LEARN_TITLE_KEYS: Record<string, string> = {
  fourGuides: 'page.learn.fourGuides.title',
  fiveElements: 'page.learn.fiveElements.title',
  yinYang: 'page.learn.yinYang.title',
  valuesTriangles: 'page.learn.values.title',
  sacredRoles: 'page.learn.sacredRoles.title',
  nepalTime: 'page.learn.nepalTime.title',
};

function TopicCard({
  title,
  summary,
  onPress,
  tapHint,
}: {
  title: string;
  summary: string;
  onPress: () => void;
  tapHint: string;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSummary}>{summary}</Text>
      <Text style={styles.cardHint}>{tapHint}</Text>
    </Pressable>
  );
}

export function LearnScreen({ onOpenTopic, onOpenAnimal }: Props) {
  const { t } = useLocale();
  const tapHint = t('common.tapToRead');

  return (
    <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
      <Text style={styles.lead}>{t('learn.lead')}</Text>

      <Text style={styles.sectionTitle}>{t('learn.section.howItWorks')}</Text>
      {LEARN_TOPIC_ORDER.map((topicId) => {
        const topic = getLearnTopic(topicId);
        if (!topic) return null;
        const titleKey = LEARN_TITLE_KEYS[topicId];
        return (
          <TopicCard
            key={topicId}
            title={titleKey ? t(titleKey) : topic.title}
            summary={topic.summary}
            tapHint={tapHint}
            onPress={() => onOpenTopic(topicId)}
          />
        );
      })}

      <Text style={styles.sectionTitle}>{t('learn.section.connections')}</Text>
      {LEARN_CONNECTION_ORDER.map((typeId) => (
        <TopicCard
          key={typeId}
          title={t(`match.${typeId}.label`)}
          summary={t(`match.${typeId}.summary`)}
          tapHint={tapHint}
          onPress={() => onOpenTopic(typeId)}
        />
      ))}

      <Text style={styles.sectionTitle}>{t('learn.section.faq')}</Text>
      <Text style={styles.sectionLead}>{t('learn.section.faqLead')}</Text>
      {LEARN_FAQ_ORDER.map((faqId) => {
        const topic = getLearnTopic(faqId);
        if (!topic) return null;
        return (
          <TopicCard
            key={faqId}
            title={topic.summary}
            summary={topic.title}
            tapHint={tapHint}
            onPress={() => onOpenTopic(faqId)}
          />
        );
      })}

      <Text style={styles.sectionTitle}>{t('learn.section.animals')}</Text>
      <Text style={styles.sectionLead}>{t('learn.section.animalsLead')}</Text>
      <View style={styles.animalGrid}>
        {ZODIAC_ANIMALS.map((animal) => (
          <Pressable key={animal} style={styles.animalChip} onPress={() => onOpenAnimal(animal)}>
            <Text style={styles.animalChipText}>
              {t(`totem.animal.${String(animal).toLowerCase()}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 10,
    paddingBottom: 24,
  },
  lead: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionLead: {
    color: COLORS.dim,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSummary: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  cardHint: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  animalChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
  },
  animalChipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
