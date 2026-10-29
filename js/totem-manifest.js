export const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

export const ANIMAL_POLARITY = {
  Squirrel: 'yang',
  Buffalo: 'yin',
  Tiger: 'yang',
  Cat: 'yin',
  Dragon: 'yang',
  Snake: 'yin',
  Horse: 'yang',
  Deer: 'yin',
  Monkey: 'yang',
  Phoenix: 'yin',
  Wolf: 'yang',
  Bear: 'yin',
};

export const ANIMAL_FILES = {
  Squirrel: 'squirrel',
  Buffalo: 'buffalo',
  Tiger: 'tiger',
  Cat: 'cat',
  Dragon: 'dragon',
  Snake: 'snake',
  Horse: 'horse',
  Deer: 'deer',
  Monkey: 'monkey',
  Phoenix: 'phoenix',
  Wolf: 'wolf',
  Bear: 'bear',
};

export const YANG_ANIMALS = Object.entries(ANIMAL_FILES)
  .filter(([name]) => ANIMAL_POLARITY[name] === 'yang')
  .map(([, file]) => file);

export const YIN_ANIMALS = Object.entries(ANIMAL_FILES)
  .filter(([name]) => ANIMAL_POLARITY[name] === 'yin')
  .map(([, file]) => file);

export const THEME_LABELS = {
  'yang-wood': 'Oak forest',
  'yin-wood': 'Vine forest',
  'yang-fire': 'Sun and flames',
  'yin-fire': 'Lantern light',
  'yang-earth': 'Mountain',
  'yin-earth': 'Valley of grain',
  'yang-metal': 'Sword',
  'yin-metal': 'Crystal',
  'yang-water': 'Ocean',
  'yin-water': 'Rain',
};

export function getAnimalThemeKey(animalName, element) {
  const polarity = ANIMAL_POLARITY[animalName];
  const animalKey = ANIMAL_FILES[animalName];
  if (!polarity || !animalKey) return null;
  const elementKey = element.toLowerCase();
  return {
    themeKey: `${polarity}-${elementKey}`,
    filename: `${polarity}-${elementKey}-${animalKey}.png`,
    animalKey,
  };
}

export function listRequiredTotemImages() {
  const items = [];
  for (const element of ELEMENTS) {
    const elementKey = element.toLowerCase();
    for (const animal of YANG_ANIMALS) {
      items.push({
        theme: `yang-${elementKey}`,
        animal,
        filename: `yang-${elementKey}-${animal}.png`,
      });
    }
    for (const animal of YIN_ANIMALS) {
      items.push({
        theme: `yin-${elementKey}`,
        animal,
        filename: `yin-${elementKey}-${animal}.png`,
      });
    }
  }
  return items;
}
