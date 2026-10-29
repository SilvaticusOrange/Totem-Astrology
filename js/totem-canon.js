/**
 * Totem Astrology canon — single source of truth for animals, companions,
 * values triangles, and zodiac geometry. Shared by the website calculator,
 * matching engine, and mobile app.
 */

/** Zodiac order (1st → 12th animal). */
export const ZODIAC_ANIMALS = [
  'Squirrel',
  'Buffalo',
  'Tiger',
  'Cat',
  'Dragon',
  'Snake',
  'Horse',
  'Deer',
  'Monkey',
  'Phoenix',
  'Wolf',
  'Bear',
];

/** Four pillars on a totem pole, in display order. */
export const PILLAR_KEYS = ['spirit', 'mental', 'emotional', 'physical'];

/** Human-readable guide labels keyed by pillar. */
export const PILLAR_GUIDES = {
  spirit: 'Spiritual Guide',
  mental: 'Mental Guide',
  emotional: 'Emotional Guide',
  physical: 'Physical Guide',
};

/** BaZi chart pillar keys mapped to profile pillar keys. */
export const CHART_PILLAR_KEYS = {
  year: 'spirit',
  month: 'mental',
  day: 'emotional',
  hour: 'physical',
};

/** @type {Record<string, string>} Yang animal → Yin Rainbow companion */
export const RAINBOW_COMPANIONS = {
  Squirrel: 'Buffalo',
  Tiger: 'Bear',
  Cat: 'Wolf',
  Dragon: 'Phoenix',
  Snake: 'Monkey',
  Horse: 'Deer',
};

/** @type {Record<string, string>} animal → Shadow companion (Rainbow inverse) */
export const SHADOW_COMPANIONS = {
  Squirrel: 'Deer',
  Deer: 'Squirrel',
  Buffalo: 'Horse',
  Horse: 'Buffalo',
  Tiger: 'Snake',
  Snake: 'Tiger',
  Cat: 'Dragon',
  Dragon: 'Cat',
  Wolf: 'Phoenix',
  Phoenix: 'Wolf',
  Monkey: 'Bear',
  Bear: 'Monkey',
};

/** Values Triangles — three animals per core value. */
export const VALUES_TRIANGLES = {
  power: {
    label: 'Power & Prestige',
    animals: ['Squirrel', 'Dragon', 'Monkey'],
  },
  security: {
    label: 'Stability & Security',
    animals: ['Buffalo', 'Snake', 'Phoenix'],
  },
  inspiration: {
    label: 'Inspiration & Idealism',
    animals: ['Tiger', 'Horse', 'Wolf'],
  },
  harmony: {
    label: 'Peace & Harmony',
    animals: ['Cat', 'Deer', 'Bear'],
  },
};

/** Display order for connection mode cards and detail pages. */
export const MATCH_TYPE_ORDER = ['rainbow', 'shadow', 'mirror', 'trine', 'sameAsMe'];

/** Match types for social discovery. */
export const MATCH_TYPES = {
  rainbow: {
    id: 'rainbow',
    label: 'Rainbow',
    shortLabel: 'Rainbow',
    page: 'connection-rainbow.html',
    summary:
      'Yin and Yang companions — each one brings out the other animal\'s true colors like a prism, hence the term "Rainbow." A rare pairing worth cherishing whenever you come across it.',
    description:
      'Yin and Yang companions — Each one brings out the other animal\'s true colors like a prism, hence the term "Rainbow" — with this type of connection, you really get to see each other shine! It\'s a rare pairing, and should be cherished whenever you come across it! It takes a lot of self-work before most people are ready for this type of connection — after all, the full spectrum of your true colors will be on display the entire time, so you\'d better be sure you have all your facets polished and shiny!',
  },
  shadow: {
    id: 'shadow',
    label: 'Shadow',
    shortLabel: 'Shadow',
    page: 'connection-shadow.html',
    summary:
      'A darkly magnetic Yin-Yang pairing that shows each other\'s hidden underbellies — revealing what might otherwise stay hidden, whether you like it or not.',
    description:
      'This darkly magnetic Yin-Yang animal pairing shows each other\'s hidden underbellies — revealing what might otherwise stay hidden, whether you like it or not! It\'s a fantastic pairing for karmic work, helping you both to grow through staying committed to the bond and discovering what to work on together. I\'ve seen it in plenty of romantic couples, even husbands and wives who\'ve been happily married for years, but I\'ve also seen it most easily displayed in student-teacher or parent-child pairings, where the idea of working out your faults and improving yourself is already baked into the type of relationship.',
  },
  mirror: {
    id: 'mirror',
    label: 'Mirror Opposite',
    shortLabel: 'Mirror Opposite',
    page: 'connection-mirror-opposite.html',
    summary:
      'Opposites on the zodiac wheel — six signs apart, facing each other directly across the circle. Ideal for reflecting blindspots and learning from a radically different point of view.',
    description:
      'Opposites on the zodiac wheel — six signs apart, facing each other directly across the circle. These connections are perfect for reflecting ourselves and seeing each other\'s blindspots — as they are quite literally facing the opposite direction that you are! This can make for some heated arguments, but as long as you bring enough respect to the table, there\'s a lot to learn here from your mirrors — both of you can see things that the other cannot, so as long as you trust each other and act in good faith, this can be a very helpful and beautiful connection to have. It will most definitely keep things interesting, as they will no doubt have a different take on things than you, sometimes so radically different that you didn\'t even think it was possible!',
  },
  trine: {
    id: 'trine',
    label: 'Values Trine',
    shortLabel: 'Values Trine',
    page: 'connection-values-trine.html',
    summary:
      'Shared value — both animals belong to the same Values Triangle, so you often speak the same language when it comes to life\'s priorities.',
    description:
      'Shared value — both animals belong to the same Values Triangle: Power & Prestige, Security & Stability, Inspiration & Idealism, or Peace & Harmony. These connections are people who speak the same language as you, values-wise. They have similar priorities when it comes to how to go about dealing with life — whether that be the pursuit of power and craftsmanship in a trade, or the pursuit of peace and an easy-going lifestyle. These are people you don\'t have to explain yourself to very often, because they\'re already on the same page as you, so it can be great for any type of relationship: business or pleasure, family or friendship. Cool runnings :)',
  },
  sameAsMe: {
    id: 'sameAsMe',
    label: 'Same-As-Me',
    shortLabel: 'Same-As-Me',
    page: 'connection-same-as-me.html',
    summary:
      'The same totem animal at the same pillar — or the same Spirit animal in a different ring, any multiple of 12 years older or younger. Same guides; wonderfully different people.',
    description:
      'The same totem animal at the same level — someone who shares your Spirit, Mind, Heart, or Body guide exactly. It can also be people from different rings — anyone with your Spirit animal who was not born in your Spirit year. That is any multiple of 12 years older or younger: 12, 24, 36, 48, and onward. For example, I am a Fire Tiger born in 1986, but I have some wonderful Tiger family and friends who are born in different Tiger rings — one of my uncles is a Water Tiger born in 1962, my son is a Metal Tiger born in 2010, and several dear friends, students, and companions are Earth Tigers born in 1998. I\'ve also had coworkers who were born in the year of the Wood Tiger, 1974. It can be cool to see how your animals act when they\'ve got different elemental flavors charging their energy in other people. It can also be neat to find people born on the same exact birthdate as you, so they\'ve got all the same animal guides, or at least 3 out of 4 if the hour animal is different, and to see how they\'ve chosen to play their hand differently than the way you\'ve chosen to play yours — kind of like how \'identical\' twins are different in many respects, but share lots of things in other areas. Free will is a powerful thing, and this connection shows that most clearly. The birth animals guiding them are the same, but the people being guided still turn out completely and wonderfully different :)',
  },
};

const animalIndex = Object.fromEntries(ZODIAC_ANIMALS.map((name, index) => [name, index]));

const triangleByAnimal = {};
for (const [key, triangle] of Object.entries(VALUES_TRIANGLES)) {
  for (const animal of triangle.animals) {
    triangleByAnimal[animal] = key;
  }
}

/** Reverse lookup: Yin Rainbow companion → Yang partner. */
const rainbowPartnerOf = Object.fromEntries(
  Object.entries(RAINBOW_COMPANIONS).flatMap(([yang, yin]) => [
    [yang, yin],
    [yin, yang],
  ]),
);

export function getZodiacIndex(animal) {
  const index = animalIndex[animal];
  if (index === undefined) {
    throw new Error(`Unknown totem animal: ${animal}`);
  }
  return index;
}

export function getMirrorAnimal(animal) {
  const index = getZodiacIndex(animal);
  return ZODIAC_ANIMALS[(index + 6) % ZODIAC_ANIMALS.length];
}

export function getValuesTriangle(animal) {
  const key = triangleByAnimal[animal];
  if (!key) throw new Error(`Unknown totem animal: ${animal}`);
  return key;
}

export function getValuesTriangleInfo(animal) {
  const key = getValuesTriangle(animal);
  return { key, ...VALUES_TRIANGLES[key] };
}

export function isRainbowPair(a, b) {
  if (a === b) return false;
  return rainbowPartnerOf[a] === b;
}

export function isShadowPair(a, b) {
  if (a === b) return false;
  return SHADOW_COMPANIONS[a] === b;
}

export function isMirrorPair(a, b) {
  if (a === b) return false;
  return getMirrorAnimal(a) === b;
}

export function isTrinePair(a, b) {
  return getValuesTriangle(a) === getValuesTriangle(b);
}

export function isSameAsMePair(a, b) {
  return a === b;
}

export function isKnownAnimal(animal) {
  return animal in animalIndex;
}

/** Generating cycle order (matches five-elements.html diagram). */
export const GENERATING_CYCLE = ['Water', 'Wood', 'Fire', 'Earth', 'Metal'];

/** Each element restrains the next in the inner controlling pentagram. */
export const CONTROLLING_CYCLE = {
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
  Wood: 'Earth',
  Earth: 'Water',
};

/**
 * @typedef {'same' | 'generating' | 'controlling' | 'unknown'} ElementCompatibilityKind
 */

/**
 * @typedef {Object} ElementCompatibility
 * @property {ElementCompatibilityKind} kind
 * @property {string} label Short human-readable line
 * @property {string} [feeds] Element that nourishes the other (generating only)
 * @property {string} [fed] Element being nourished (generating only)
 * @property {string} [controller] Element keeping the other in check (controlling only)
 * @property {string} [controlled] Element being restrained (controlling only)
 */

/**
 * Classify how two elements relate on the generating circle and controlling pentagram.
 * @param {string} elementA
 * @param {string} elementB
 * @returns {ElementCompatibility}
 */
export function getElementCompatibility(elementA, elementB) {
  if (!elementA || !elementB) {
    return { kind: 'unknown', label: 'Element unknown' };
  }
  if (elementA === elementB) {
    return { kind: 'same', label: `Same element — ${elementA}` };
  }

  const indexA = GENERATING_CYCLE.indexOf(elementA);
  const indexB = GENERATING_CYCLE.indexOf(elementB);
  if (indexA === -1 || indexB === -1) {
    return { kind: 'unknown', label: 'Unknown element' };
  }

  const count = GENERATING_CYCLE.length;
  const stepsForward = (indexB - indexA + count) % count;
  const stepsBackward = (indexA - indexB + count) % count;

  if (stepsForward === 1 || stepsBackward === 1) {
    const feeds = stepsForward === 1 ? elementA : elementB;
    const fed = stepsForward === 1 ? elementB : elementA;
    return {
      kind: 'generating',
      label: `${feeds} nourishes ${fed}`,
      feeds,
      fed,
    };
  }

  if (CONTROLLING_CYCLE[elementA] === elementB) {
    return {
      kind: 'controlling',
      label: `${elementA} keeps ${elementB} in check`,
      controller: elementA,
      controlled: elementB,
    };
  }
  if (CONTROLLING_CYCLE[elementB] === elementA) {
    return {
      kind: 'controlling',
      label: `${elementB} keeps ${elementA} in check`,
      controller: elementB,
      controlled: elementA,
    };
  }

  return { kind: 'unknown', label: '—' };
}

export function isGeneratingElementPair(elementA, elementB) {
  return getElementCompatibility(elementA, elementB).kind === 'generating';
}

/** @deprecated Use isGeneratingElementPair — same element is neutral, not harmonious. */
export function isHarmoniousElementPair(elementA, elementB) {
  return isGeneratingElementPair(elementA, elementB);
}
