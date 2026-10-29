import { ImageBackground, StyleSheet, View, type ViewProps } from 'react-native';
import { COLORS } from '../theme';

const VILLAGE_BG = require('../assets/mythic-village-dusk-bg.png');

type MythicBackdropProps = ViewProps & {
  /** 0–1 darkness over the art so text stays readable. */
  dimOpacity?: number;
};

/**
 * Soft mythic village / lantern-lit square at dusk.
 * Stage backdrop behind the UI — not a busy wallpaper.
 */
export function MythicBackdrop({
  children,
  style,
  dimOpacity = 0.58,
  ...rest
}: MythicBackdropProps) {
  return (
    <ImageBackground
      source={VILLAGE_BG}
      style={[styles.root, style]}
      imageStyle={styles.image}
      resizeMode="cover"
      {...rest}
    >
      <View pointerEvents="none" style={[styles.dim, { opacity: dimOpacity }]} />
      <View pointerEvents="none" style={styles.lowerWash} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  image: {
    opacity: 1,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
  },
  lowerWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(10, 10, 15, 0.45)',
  },
  content: {
    flex: 1,
  },
});
