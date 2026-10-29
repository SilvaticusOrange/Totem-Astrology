import {
  getAnimalThemeKey,
  THEME_LABELS,
} from './totem-manifest.js';

const COMPOSITED_IMAGE_BASE = 'assets/images/totems/composited';

export function renderTotemAnimalArt(animalName, element) {
  const theme = getAnimalThemeKey(animalName, element);
  if (!theme) return '';

  const themeLabel = THEME_LABELS[theme.themeKey] ?? '';
  const src = `${COMPOSITED_IMAGE_BASE}/${theme.filename}`;

  return `<div class="bazi-totem-art-wrap bazi-totem-art-wrap--${theme.themeKey}" title="${themeLabel}">
    <img
      class="bazi-totem-art"
      src="${src}"
      alt="${animalName} totem in ${themeLabel}"
      width="288"
      height="288"
      loading="lazy"
      decoding="async"
    />
  </div>`;
}
