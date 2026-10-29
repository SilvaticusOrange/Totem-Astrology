import { THEME_LABELS, getAnimalThemeKey } from '../../js/totem-manifest.js';
import type { ImageSourcePropType } from 'react-native';
import { TOTEM_IMAGE_REGISTRY } from './totem-image-registry';

export type TotemThemeKey =
  | 'yang-wood'
  | 'yin-wood'
  | 'yang-fire'
  | 'yin-fire'
  | 'yang-earth'
  | 'yin-earth'
  | 'yang-metal'
  | 'yin-metal'
  | 'yang-water'
  | 'yin-water';

/** Glow colors aligned with website .bazi-totem-art-wrap themes. */
export const THEME_GLOW: Record<TotemThemeKey, string> = {
  'yang-wood': '#245f22',
  'yin-wood': '#5a9650',
  'yang-fire': '#c83c14',
  'yin-fire': '#dc8c3c',
  'yang-earth': '#6e4b2d',
  'yin-earth': '#b4963c',
  'yang-metal': '#3c6496',
  'yin-metal': '#8264b4',
  'yang-water': '#14468c',
  'yin-water': '#64a0d2',
};

export type TotemImageMeta = {
  source: ImageSourcePropType;
  themeKey: TotemThemeKey;
  themeLabel: string;
  glowColor: string;
};

export function getTotemImageMeta(animalName: string, element: string): TotemImageMeta | null {
  const theme = getAnimalThemeKey(animalName, element);
  if (!theme) return null;

  const key = theme.filename.replace(/\.png$/, '');
  const source = TOTEM_IMAGE_REGISTRY[key];
  if (!source) return null;

  const themeKey = theme.themeKey as TotemThemeKey;
  return {
    source,
    themeKey,
    themeLabel: THEME_LABELS[themeKey] ?? '',
    glowColor: THEME_GLOW[themeKey] ?? '#000000',
  };
}
