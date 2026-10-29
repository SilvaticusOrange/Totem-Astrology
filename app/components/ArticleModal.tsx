import { getLearnTopic } from '../../js/learn-topics.js';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../lib/LocaleContext';
import { COLORS } from '../theme';

type Props = {
  topicId: string | null;
  onClose: () => void;
};

export function ArticleModal({ topicId, onClose }: Props) {
  const { t } = useLocale();
  if (!topicId) return null;
  const topic = getLearnTopic(topicId);
  if (!topic) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.kicker}>{topic.kicker}</Text>
          <Text style={styles.title}>{topic.title}</Text>
          <Text style={styles.summary}>{topic.summary}</Text>

          {topic.blocks.map((block, index) => {
            if (block.type === 'heading') {
              return (
                <Text key={`${block.type}-${index}`} style={styles.heading}>
                  {block.text}
                </Text>
              );
            }
            if (block.type === 'list' && block.items) {
              return (
                <View key={`${block.type}-${index}`} style={styles.list}>
                  {block.items.map((item) => (
                    <View key={item} style={styles.listRow}>
                      <Text style={styles.bullet}>✦</Text>
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            return (
              <Text key={`${block.type}-${index}`} style={styles.paragraph}>
                {block.text}
              </Text>
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
  summary: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  heading: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  paragraph: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    color: COLORS.gold,
    fontSize: 12,
    marginTop: 4,
  },
  listText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
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
