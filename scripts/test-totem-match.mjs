import assert from 'node:assert/strict';
import {
  getElementCompatibility,
  getMirrorAnimal,
  isGeneratingElementPair,
  isRainbowPair,
  isShadowPair,
} from '../js/totem-canon.js';
import { compareProfiles, getFullMatches, scoreElementCompatibility, scoreMatchType } from '../js/totem-match.js';
import { profileFromBirth } from '../js/totem-chart.js';

const alice = {
  spirit: 'Squirrel',
  mental: 'Tiger',
  emotional: 'Cat',
  physical: 'Dragon',
  elements: {
    spirit: 'Fire',
    mental: 'Wood',
    emotional: 'Water',
    physical: 'Earth',
  },
};

const rainbowPartner = {
  spirit: 'Buffalo',
  mental: 'Bear',
  emotional: 'Wolf',
  physical: 'Phoenix',
};

const shadowPartner = {
  spirit: 'Deer',
  mental: 'Snake',
  emotional: 'Dragon',
  physical: 'Cat',
};

assert.equal(isRainbowPair('Squirrel', 'Buffalo'), true);
assert.equal(isRainbowPair('Buffalo', 'Squirrel'), true);
assert.equal(isShadowPair('Squirrel', 'Deer'), true);
assert.equal(getMirrorAnimal('Squirrel'), 'Horse');
assert.equal(getMirrorAnimal('Dragon'), 'Wolf');

assert.equal(getElementCompatibility('Fire', 'Fire').kind, 'same');
assert.equal(getElementCompatibility('Fire', 'Earth').kind, 'generating');
assert.equal(getElementCompatibility('Earth', 'Fire').kind, 'generating');
assert.equal(getElementCompatibility('Water', 'Fire').kind, 'controlling');
assert.equal(getElementCompatibility('Fire', 'Metal').kind, 'controlling');
assert.equal(isGeneratingElementPair('Wood', 'Water'), true);
assert.equal(isGeneratingElementPair('Fire', 'Fire'), false);
assert.equal(getElementCompatibility('Fire', 'Fire').kind, 'same');

const elementScore = scoreElementCompatibility(alice, {
  ...alice,
  elements: {
    spirit: 'Fire',
    mental: 'Metal',
    emotional: 'Wood',
    physical: 'Fire',
  },
});
assert.equal(elementScore.generating, 2);
assert.equal(elementScore.same, 1);
assert.equal(elementScore.controlling, 1);

const rainbowScore = scoreMatchType(alice, rainbowPartner, 'rainbow');
assert.equal(rainbowScore.count, 4);
assert.equal(rainbowScore.isFullMatch, true);

const shadowScore = scoreMatchType(alice, shadowPartner, 'shadow');
assert.equal(shadowScore.count, 4);
assert.equal(shadowScore.isFullMatch, true);

const trineSelf = scoreMatchType(alice, alice, 'trine');
assert.equal(trineSelf.count, 4);

const sameAsMeSelf = scoreMatchType(alice, alice, 'sameAsMe');
assert.equal(sameAsMeSelf.count, 4);
assert.equal(sameAsMeSelf.isFullMatch, true);

const sameAsMePartial = scoreMatchType(alice, { ...alice, physical: 'Squirrel' }, 'sameAsMe');
assert.equal(sameAsMePartial.count, 3);

const fullMatches = getFullMatches(alice, rainbowPartner);
assert.ok(fullMatches.some((match) => match.type === 'rainbow'));

const { profile } = profileFromBirth({
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  gender: 'female',
  sourceTimeZone: 'Asia/Kathmandu',
});

assert.ok(profile.spirit);
assert.ok(profile.mental);
assert.ok(profile.emotional);
assert.ok(profile.physical);

console.log('Sample profile:', profile);
console.log('Rainbow vs partner:', scoreMatchType(profile, rainbowPartner, 'rainbow').count, '/ 4');
console.log('All totem match tests passed.');
