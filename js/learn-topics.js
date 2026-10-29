/**
 * Educational articles for Totem Connect and future reuse.
 * Prose mirrors the website learn pages (how-it-works, four-totem-guides, etc.).
 */

import { FAQ_ENTRIES, FAQ_ORDER, getFaqEntry } from './faq.js';
import { GENERATING_CYCLE, MATCH_TYPE_ORDER, MATCH_TYPES, VALUES_TRIANGLES } from './totem-canon.js';
import { YANG_ANIMALS, YIN_ANIMALS } from './totem-manifest.js';

/** @typedef {'paragraph' | 'heading' | 'list'} LearnBlockType */

/**
 * @typedef {Object} LearnBlock
 * @property {LearnBlockType} type
 * @property {string} [text]
 * @property {string[]} [items]
 */

/**
 * @typedef {Object} LearnTopic
 * @property {string} id
 * @property {string} kicker
 * @property {string} title
 * @property {string} summary
 * @property {LearnBlock[]} blocks
 */

/** @type {Record<string, LearnTopic>} */
export const LEARN_TOPICS = {
  philosophy: {
    id: 'philosophy',
    kicker: 'Why Totem Astrology',
    title: 'Hope, Understanding & Grace',
    summary: 'A shared language for understanding yourself and the people you love.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Totem Astrology is built on hope — hope for understanding yourself more clearly, hope for understanding the people you love, and hope that compatibility is real: that there are partners, friends, and family members who can meet you where you are. The four animal guides are a shared language for that hope. They give us something abstract to point to when inner life feels messy or hard to explain.',
      },
      {
        type: 'paragraph',
        text:
          'This system is not an excuse for bad behavior, and it is not permission to tolerate other people\'s bad behavior. It is a tool for comprehension — for seeing how different inner modes operate, appreciating those differences, and offering grace where understanding makes room for it. Accountability and compassion belong together.',
      },
    ],
  },

  fourGuides: {
    id: 'fourGuides',
    kicker: 'The Totem Pole',
    title: 'Your Four Totem Guides',
    summary: 'Spirit, Mind, Heart, and Body — four animal allies from the Four Pillars of your birth.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Totem Astrology builds on the Chinese Four Pillars of Destiny — birth year, month, day, and hour. Each pillar reveals one totem animal ally: your Spiritual, Mental, Emotional, and Physical guides.',
      },
      {
        type: 'paragraph',
        text:
          'The year pillar speaks to your spiritual orientation — the broad arc of who you are becoming across a lifetime. The month pillar shapes how you think and process the world. The day pillar reaches into the heart — how you feel, relate, and choose in the intimate theater of daily life. The hour pillar grounds the body — instinct, stamina, and the physical rhythm you move through the world with.',
      },
      {
        type: 'paragraph',
        text:
          'Picture them stacked like a totem pole — Body at the base, Heart above, Mind next, and Spirit crowned at the top. Together, these four animals are not four separate horoscopes pasted together. They are one totem pole — four facets of a single birth moment, each with its own element and that animal\'s fixed Yin or Yang polarity.',
      },
      { type: 'heading', text: 'Year · Spirit' },
      {
        type: 'paragraph',
        text:
          'The Spiritual Guide animal has the highest perspective on your life — your guiding light that sees the big picture of meaning, purpose, and inner direction. Listen to this animal most carefully for big life changes and decisions with long-lasting consequences. The Spirit Animal will steer you true even when your other three animals can\'t see through the fog of the present moment.',
      },
      { type: 'heading', text: 'Month · Mind' },
      {
        type: 'paragraph',
        text:
          'The Mental Guide shapes how you think, learn, and make sense of the world. It tends to be the face others see first when they meet you. The Spirit Animal is meant to help us see where we\'re going; the Mind Animal is only meant to help us figure out how exactly to get there. Listen to the Mind Animal on day-to-day matters, but trust the Spirit Animal for major life moves.',
      },
      { type: 'heading', text: 'Day · Heart' },
      {
        type: 'paragraph',
        text:
          'The Emotional Guide tugs your heart strings, stirs your passions, and helps you navigate feelings and empathic connection with others. Anywhere emotions hold sway, this animal is there, guiding your reactions with its unique skill set. This is the animal who has the clearest say in matters of the heart.',
      },
      { type: 'heading', text: 'Hour · Body' },
      {
        type: 'paragraph',
        text:
          'The Physical Guide helps you navigate the 3D world with instinct and innate know-how. It charges up your body\'s wisdom — how to handle what you can touch, reach, and move through. Tap any animal card on your totem pole to read how that guide plays out for you.',
      },
    ],
  },

  fiveElements: {
    id: 'fiveElements',
    kicker: 'Elements',
    title: 'The Five Elements',
    summary: 'Water, Wood, Fire, Earth, and Metal — five templates for how energy moves through your totem pole.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Each section of your totem pole pairs an animal with one of the Five Elements, adding a precise layer of texture to your Spirit, Mind, Heart, and Body guides. The Five Elements are five templates for the motion of energy — each with its own direction, logic, and Yin & Yang expressions.',
      },
      {
        type: 'paragraph',
        text:
          'In Chinese cosmology they move in a continuous circle: Water feeds Wood, Wood fuels Fire, Fire creates Earth, Earth bears Metal, and Metal condenses Water to begin the cycle anew.',
      },
      {
        type: 'paragraph',
        text: `Generating cycle: ${GENERATING_CYCLE.join(' → ')} → Water … Inside that circle, a pentagram forms the controlling cycle — each element keeps another in check (Water restrains Fire, Fire softens Metal, Metal prunes Wood, Wood holds Earth, Earth dams Water).`,
      },
      { type: 'heading', text: 'Water' },
      {
        type: 'paragraph',
        text:
          'Water channels energy inward and downward — like a watershed gathering rain into one river. Yin Water is gentle rain and patient seep; Yang Water is the ocean tide, reshaping the shoreline with relentless force.',
      },
      { type: 'heading', text: 'Wood' },
      {
        type: 'paragraph',
        text:
          'Wood branches outward from a center — roots down, shoots up, spiraling in every direction. Yin Wood is the flexible vine; Yang Wood is the mighty oak that shelters the forest.',
      },
      { type: 'heading', text: 'Fire' },
      {
        type: 'paragraph',
        text:
          'Fire sends energy outward and upward, transforming what Wood built. Yin Fire is the steady candle; Yang Fire is the sun or forest blaze that clears the old entirely.',
      },
      { type: 'heading', text: 'Earth' },
      {
        type: 'paragraph',
        text:
          'Earth brings everything to rest — ash settling, soil packing layer upon layer. Yin Earth is the welcoming valley; Yang Earth is the mountain that holds its ground against wind and weather.',
      },
      { type: 'heading', text: 'Metal' },
      {
        type: 'paragraph',
        text:
          'Metal condenses scattered matter inward to a refined core — ore to ingot, sand to crystal. Yin Metal is jewelry and clarity; Yang Metal is the blade that decisively separates what belongs from what does not.',
      },
    ],
  },

  yinYang: {
    id: 'yinYang',
    kicker: 'Polarity',
    title: 'Yin & Yang',
    summary: 'Two fundamental ways energy moves — baked into each totem animal from the start.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Before Rainbow companions, Shadow bonds, or any pairing logic enters the picture, Yin and Yang are two fundamental ways that energy moves. Polarity is baked into each totem animal from the start — an Squirrel is always Yang, a Buffalo always Yin, and so on through all twelve.',
      },
      {
        type: 'paragraph',
        text:
          'They are not "good" and "bad," and they are not strictly male and female. They are complementary modes — two halves of a whole that need each other to stay balanced.',
      },
      { type: 'heading', text: 'Yang animals' },
      {
        type: 'paragraph',
        text: `Squirrel, Tiger, Dragon, Horse, Monkey, and Wolf — six Yang animals, always outward in their essential nature.`,
      },
      { type: 'heading', text: 'Yin animals' },
      {
        type: 'paragraph',
        text: `Buffalo, Cat, Snake, Deer, Phoenix, and Bear — six Yin animals, always inward in their essential nature.`,
      },
      { type: 'heading', text: 'Yang — the outward current' },
      {
        type: 'paragraph',
        text:
          'Yang initiates, extends, and asserts — moving toward the visible world. At its best it is courage, clarity, and the willingness to be seen. Unchecked Yang can burn out or bulldoze.',
      },
      { type: 'heading', text: 'Yin — the inward current' },
      {
        type: 'paragraph',
        text:
          'Yin receives, deepens, and completes — gathering toward stillness and refinement. At its best it is wisdom, patience, and the power of completion. Unchecked Yin can stagnate or hide.',
      },
      {
        type: 'paragraph',
        text:
          'On your totem pole, each animal\'s polarity never changes — but the element on that pillar still varies, so a Yang Fire Squirrel and a Yang Water Squirrel read very differently.',
      },
    ],
  },

  valuesTriangles: {
    id: 'valuesTriangles',
    kicker: 'Core Values',
    title: 'Values Triangles',
    summary: 'Four triangles, each organized around a core value that shapes how animals decide.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'The twelve totem animals group into four triangles. Every animal prioritizes one of these lenses when making important decisions — not exclusively, but first.',
      },
      ...Object.values(VALUES_TRIANGLES).map((triangle) => ({
        type: 'list',
        items: [`${triangle.label}: ${triangle.animals.join(', ')}`],
      })),
      {
        type: 'paragraph',
        text:
          'Tap any animal in the Learn tab to read its full personality — including how it lives its triangle\'s value as Seeker, Mage, or Royal.',
      },
    ],
  },

  sacredRoles: {
    id: 'sacredRoles',
    kicker: 'Archetypes',
    title: 'Sacred Roles',
    summary: 'Seeker, Mage, and Royal — three ways every Values Triangle animal embodies its core value.',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Within each Values Triangle, the three animals play one of three Sacred Roles — three distinct ways of relating to that triangle\'s core value.',
      },
      {
        type: 'list',
        items: [
          'The Seeker pursues, acquires, and accumulates the core value — the driver who ensures things get done and empires get built.',
          'The Mage wields the core value subtly and strategically, often working behind the scenes with playful intelligence.',
          'The Royal embodies the core value at the center of their being — natural authority others follow, with great responsibility.',
        ],
      },
      { type: 'heading', text: 'The Four Royals' },
      {
        type: 'paragraph',
        text:
          'Dragon and Phoenix reign over the Celestial Realm (ideas, templates, standards). Tiger and Bear reign over the Earthly Realm (instinct, abundance, peace in daily life).',
      },
      {
        type: 'list',
        items: [
          'Dragon — Royal of Power & Prestige (Celestial King)',
          'Phoenix — Royal of Stability & Security (Celestial Queen)',
          'Tiger — Royal of Inspiration & Idealism (Earthly King)',
          'Bear — Royal of Peace & Harmony (Earthly Queen)',
        ],
      },
    ],
  },

  nepalTime: {
    id: 'nepalTime',
    kicker: 'Birth Time',
    title: 'Why We Shift to Nepal Time',
    summary: 'Before your animals are calculated, birth moments convert to Nepal Time (NPT).',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Before your animals are calculated, we convert your birth moment to Nepal Time (NPT, UTC+5:45) — rooted in the discovery that this system\'s myths trace to the Jade Emperor atop the Kun Lun mountains and the Buddha\'s birthplace in Nepal. Converting to NPT first helps day and hour animals line up with what people worldwide recognize in their Hearts and Bodies.',
      },
      {
        type: 'paragraph',
        text:
          'Enter your birth time as recorded locally — say, 3:15 PM in Denver or 9:00 AM in London. The calculator honors that time, then converts to Nepal Time before any pillar is drawn.',
      },
      {
        type: 'paragraph',
        text:
          'If you were born in Kathmandu, the shift may show no change — but for most births worldwide, the conversion matters.',
      },
    ],
  },
};

/** Topic ids for the Learn hub, in display order. */
export const LEARN_TOPIC_ORDER = [
  'philosophy',
  'fourGuides',
  'fiveElements',
  'yinYang',
  'valuesTriangles',
  'sacredRoles',
  'nepalTime',
];

/** Connection-type articles derived from canon. */
export const LEARN_CONNECTION_ORDER = MATCH_TYPE_ORDER;

/** FAQ article ids for the Learn hub. */
export const LEARN_FAQ_ORDER = FAQ_ORDER;

/**
 * @param {string} topicId
 * @returns {LearnTopic | null}
 */
export function getLearnTopic(topicId) {
  if (topicId in LEARN_TOPICS) return LEARN_TOPICS[topicId];
  if (topicId in MATCH_TYPES) {
    const meta = MATCH_TYPES[topicId];
    return {
      id: topicId,
      kicker: 'Connections',
      title: meta.label,
      summary: meta.summary,
      blocks: [{ type: 'paragraph', text: meta.description }],
    };
  }
  const faq = getFaqEntry(topicId);
  if (faq) {
    return {
      id: faq.id,
      kicker: 'FAQ',
      title: faq.question,
      summary: faq.summary,
      blocks: faq.paragraphs.map((text) => ({ type: 'paragraph', text })),
    };
  }
  return null;
}

export { FAQ_ENTRIES, FAQ_ORDER, YANG_ANIMALS, YIN_ANIMALS };
