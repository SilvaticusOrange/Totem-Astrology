import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

type Item = {
  key: string;
  label: string;
};

type Props = {
  items: Item[];
  onSelect: (index: number) => void;
};

/** Stays up until a row is tapped. It is not inside the scrolling form, so the keyboard cannot shove it away. */
export function CitySuggestionModal({ items, onSelect }: Props) {
  return (
    <Modal visible={items.length > 0} transparent animationType="none" onRequestClose={() => {}}>
      <View style={styles.screen} pointerEvents="box-none">
        <View style={styles.card}>
          {items.map((item, index) => (
            <Pressable key={item.key} style={styles.row} onPress={() => onSelect(index)}>
              <Text style={styles.label}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#14141c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    maxHeight: 360,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
  },
});
