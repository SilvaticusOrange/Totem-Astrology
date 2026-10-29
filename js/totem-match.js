import {
  MATCH_TYPES,
  PILLAR_GUIDES,
  PILLAR_KEYS,
  getElementCompatibility,
  getValuesTriangleInfo,
  isGeneratingElementPair,
  isMirrorPair,
  isRainbowPair,
  isSameAsMePair,
  isShadowPair,
  isTrinePair,
} from './totem-canon.js';

/**
 * @typedef {Object} TotemProfile
 * @property {string} spirit
 * @property {string} mental
 * @property {string} emotional
 * @property {string} physical
 * @property {Partial<Record<'spirit' | 'mental' | 'emotional' | 'physical', string>>} [elements]
 */

/**
 * @typedef {'rainbow' | 'shadow' | 'mirror' | 'trine' | 'sameAsMe'} MatchTypeId
 */

/**
 * @typedef {Object} PillarMatchResult
 * @property {'spirit' | 'mental' | 'emotional' | 'physical'} pillar
 * @property {string} guide
 * @property {string} animalA
 * @property {string} animalB
 * @property {boolean} matches
 * @property {string} [detail]
 */

/**
 * @typedef {Object} MatchTypeResult
 * @property {MatchTypeId} type
 * @property {string} label
 * @property {string} description
 * @property {number} count
 * @property {number} total
 * @property {boolean} isFullMatch
 * @property {PillarMatchResult[]} pillars
 */

const MATCH_CHECKS = {
  rainbow: isRainbowPair,
  shadow: isShadowPair,
  mirror: isMirrorPair,
  trine: isTrinePair,
  sameAsMe: isSameAsMePair,
};

function pillarDetail(type, animalA, animalB) {
  if (type === 'trine') {
    const triangle = getValuesTriangleInfo(animalA);
    return triangle.label;
  }
  if (type === 'sameAsMe') {
    return 'Same animal';
  }
  return undefined;
}

/**
 * Compare one pillar between two profiles for a given match type.
 * @param {TotemProfile} profileA
 * @param {TotemProfile} profileB
 * @param {MatchTypeId} type
 * @param {keyof TotemProfile} pillar
 * @returns {PillarMatchResult}
 */
export function comparePillar(profileA, profileB, type, pillar) {
  const animalA = profileA[pillar];
  const animalB = profileB[pillar];
  const matches = MATCH_CHECKS[type](animalA, animalB);

  return {
    pillar,
    guide: PILLAR_GUIDES[pillar],
    animalA,
    animalB,
    matches,
    detail: matches ? pillarDetail(type, animalA, animalB) : undefined,
  };
}

/**
 * Score one match type across all four pillars.
 * @param {TotemProfile} profileA
 * @param {TotemProfile} profileB
 * @param {MatchTypeId} type
 * @returns {MatchTypeResult}
 */
export function scoreMatchType(profileA, profileB, type) {
  const meta = MATCH_TYPES[type];
  const pillars = PILLAR_KEYS.map((pillar) => comparePillar(profileA, profileB, type, pillar));
  const count = pillars.filter((entry) => entry.matches).length;

  return {
    type,
    label: meta.label,
    description: meta.description,
    count,
    total: PILLAR_KEYS.length,
    isFullMatch: count === PILLAR_KEYS.length,
    pillars,
  };
}

/**
 * Compare two totem profiles across all match types.
 * @param {TotemProfile} profileA
 * @param {TotemProfile} profileB
 * @returns {MatchTypeResult[]}
 */
export function compareProfiles(profileA, profileB) {
  return Object.keys(MATCH_TYPES).map((type) => scoreMatchType(profileA, profileB, /** @type {MatchTypeId} */ (type)));
}

/**
 * Return match types where all four pillars align.
 * @param {TotemProfile} profileA
 * @param {TotemProfile} profileB
 * @returns {MatchTypeResult[]}
 */
export function getFullMatches(profileA, profileB) {
  return compareProfiles(profileA, profileB).filter((result) => result.isFullMatch);
}

/**
 * Rank profiles by best overall alignment (sum of pillar matches across all types).
 * Useful for discovery feeds once a candidate list exists.
 * @param {TotemProfile} profile
 * @param {TotemProfile[]} candidates
 * @returns {{ profile: TotemProfile, score: number, matches: MatchTypeResult[] }[]}
 */
export function rankCandidates(profile, candidates) {
  return candidates
    .map((candidate) => {
      const matches = compareProfiles(profile, candidate);
      const score = matches.reduce((sum, result) => sum + result.count, 0);
      return { profile: candidate, score, matches };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * @typedef {import('./totem-canon.js').ElementCompatibility} ElementCompatibility
 */

/**
 * @typedef {Object} ElementPillarResult
 * @property {'spirit' | 'mental' | 'emotional' | 'physical'} pillar
 * @property {string} guide
 * @property {string} elementA
 * @property {string} elementB
 * @property {ElementCompatibility} compatibility
 */

/**
 * @typedef {Object} ElementCompatibilityResult
 * @property {ElementPillarResult[]} pillars
 * @property {number} generating Neighbors on the generating circle (nourishing)
 * @property {number} same Same element at this pillar (neutral)
 * @property {number} controlling Pentagram restraining relationship
 * @property {number} unknown Missing element data
 * @property {number} total
 */

/**
 * Compare elements guide-by-guide between two profiles.
 * @param {TotemProfile} profileA
 * @param {TotemProfile} profileB
 * @returns {ElementCompatibilityResult}
 */
export function scoreElementCompatibility(profileA, profileB) {
  const pillars = PILLAR_KEYS.map((pillar) => {
    const elementA = profileA.elements?.[pillar] ?? '';
    const elementB = profileB.elements?.[pillar] ?? '';
    return {
      pillar,
      guide: PILLAR_GUIDES[pillar],
      elementA,
      elementB,
      compatibility: getElementCompatibility(elementA, elementB),
    };
  });

  const generating = pillars.filter((entry) => entry.compatibility.kind === 'generating').length;
  const same = pillars.filter((entry) => entry.compatibility.kind === 'same').length;
  const controlling = pillars.filter((entry) => entry.compatibility.kind === 'controlling').length;
  const unknown = pillars.filter((entry) => entry.compatibility.kind === 'unknown').length;

  return {
    pillars,
    generating,
    same,
    controlling,
    unknown,
    total: PILLAR_KEYS.length,
  };
}

/**
 * Summarize which values triangles appear on a profile.
 * @param {TotemProfile} profile
 */
export function summarizeProfileTriangles(profile) {
  return PILLAR_KEYS.map((pillar) => ({
    pillar,
    guide: PILLAR_GUIDES[pillar],
    animal: profile[pillar],
    triangle: getValuesTriangleInfo(profile[pillar]),
  }));
}
