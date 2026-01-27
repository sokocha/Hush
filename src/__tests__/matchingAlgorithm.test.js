import { describe, it, expect } from 'vitest';
import {
  calculateMatchPercentage,
  getTopMatches,
  addMatchPercentages,
} from '../utils/matchingAlgorithm';

describe('calculateMatchPercentage', () => {
  it('returns 0 when preferences is null', () => {
    expect(calculateMatchPercentage(null, { location: 'Lagos' })).toBe(0);
  });

  it('returns 0 when creator is null', () => {
    expect(calculateMatchPercentage({ preferredLocation: 'Lagos' }, null)).toBe(0);
  });

  it('returns 0 when no preferences are set', () => {
    expect(calculateMatchPercentage({}, { location: 'Lagos' })).toBe(0);
  });

  it('returns 100 when location matches and is the only preference', () => {
    const preferences = { preferredLocation: 'Lagos' };
    const creator = { location: 'Lagos' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('returns 0 when location does not match and is the only preference', () => {
    const preferences = { preferredLocation: 'Lagos' };
    const creator = { location: 'Abuja' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('matches location case-insensitively', () => {
    const preferences = { preferredLocation: 'lagos' };
    const creator = { location: 'Lagos' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores body type match correctly', () => {
    const preferences = { bodyTypes: ['Slim', 'Athletic'] };
    const creator = { bodyType: 'Slim' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores body type mismatch correctly', () => {
    const preferences = { bodyTypes: ['Slim'] };
    const creator = { bodyType: 'Curvy' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('ignores "No preference" in body types', () => {
    const preferences = { bodyTypes: ['No preference'] };
    const creator = { bodyType: 'Slim' };
    // No meaningful preference → scores array is empty → returns 0
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('scores skin tone match correctly', () => {
    const preferences = { skinTones: ['Light', 'Medium'] };
    const creator = { skinTone: 'Medium' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores skin tone mismatch correctly', () => {
    const preferences = { skinTones: ['Light'] };
    const creator = { skinTone: 'Dark' };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('scores age range match for 18-22', () => {
    const preferences = { ageRanges: ['18-22'] };
    const creator = { age: 20 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores age range match for boundary value', () => {
    const preferences = { ageRanges: ['18-22'] };
    const creator = { age: 18 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores age range match for upper boundary', () => {
    const preferences = { ageRanges: ['18-22'] };
    const creator = { age: 22 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores age range mismatch correctly', () => {
    const preferences = { ageRanges: ['18-22'] };
    const creator = { age: 30 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('handles multiple age ranges', () => {
    const preferences = { ageRanges: ['18-22', '23-27'] };
    const creator = { age: 25 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores the 40+ age range correctly', () => {
    const preferences = { ageRanges: ['40+'] };
    const creator = { age: 45 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores full service match correctly', () => {
    const preferences = { services: ['Dinner', 'Companion'] };
    const creator = { services: ['Dinner', 'Companion', 'Travel'] };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('scores partial service match correctly', () => {
    const preferences = { services: ['Dinner', 'Companion'] };
    const creator = { services: ['Dinner'] };
    // 1 out of 2 services match → 50% of the services weight (15)
    // services score = 7.5, weight = 15, percentage = 50
    expect(calculateMatchPercentage(preferences, creator)).toBe(50);
  });

  it('scores no service match correctly', () => {
    const preferences = { services: ['Dinner'] };
    const creator = { services: ['Travel'] };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('handles service matching with partial string inclusion', () => {
    const preferences = { services: ['Dinner'] };
    const creator = { services: ['Dinner Date'] };
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('computes weighted average across multiple preference categories', () => {
    const preferences = {
      preferredLocation: 'Lagos',
      bodyTypes: ['Slim'],
      skinTones: ['Light'],
      ageRanges: ['23-27'],
      services: ['Dinner'],
    };
    const creator = {
      location: 'Lagos',
      bodyType: 'Slim',
      skinTone: 'Light',
      age: 25,
      services: ['Dinner'],
    };
    // All match → 100
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });

  it('computes weighted average with some mismatches', () => {
    const preferences = {
      preferredLocation: 'Lagos',
      bodyTypes: ['Slim'],
    };
    const creator = {
      location: 'Lagos',
      bodyType: 'Curvy',
    };
    // location: 25/25, bodyType: 0/20
    // total score = 25, total weight = 45
    // percentage = round(25/45 * 100) = 56
    expect(calculateMatchPercentage(preferences, creator)).toBe(56);
  });

  it('clamps result between 0 and 100', () => {
    const preferences = {
      preferredLocation: 'Lagos',
      bodyTypes: ['Slim'],
      skinTones: ['Light'],
      ageRanges: ['23-27'],
      services: ['Dinner'],
    };
    const creator = {
      location: 'Lagos',
      bodyType: 'Slim',
      skinTone: 'Light',
      age: 25,
      services: ['Dinner'],
    };
    const result = calculateMatchPercentage(preferences, creator);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('handles empty arrays in preferences', () => {
    const preferences = {
      bodyTypes: [],
      skinTones: [],
      ageRanges: [],
      services: [],
    };
    const creator = { bodyType: 'Slim', skinTone: 'Light', age: 25 };
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('handles creator with missing attributes', () => {
    const preferences = {
      bodyTypes: ['Slim'],
      skinTones: ['Light'],
    };
    const creator = {}; // no bodyType or skinTone
    // bodyType: no match (creator.bodyType is undefined), skinTone: no match
    expect(calculateMatchPercentage(preferences, creator)).toBe(0);
  });

  it('skips age scoring when creator has no age', () => {
    const preferences = {
      preferredLocation: 'Lagos',
      ageRanges: ['18-22'],
    };
    const creator = { location: 'Lagos' }; // no age
    // Only location is scored: 25/25 = 100
    expect(calculateMatchPercentage(preferences, creator)).toBe(100);
  });
});

describe('getTopMatches', () => {
  const creators = [
    { id: 1, location: 'Lagos', bodyType: 'Slim', age: 20, services: ['Dinner'] },
    { id: 2, location: 'Abuja', bodyType: 'Curvy', age: 30, services: ['Travel'] },
    { id: 3, location: 'Lagos', bodyType: 'Athletic', age: 25, services: ['Dinner', 'Companion'] },
    { id: 4, location: 'Lagos', bodyType: 'Slim', age: 22, services: ['Dinner'] },
  ];

  it('returns empty array when preferences is null', () => {
    expect(getTopMatches(null, creators)).toEqual([]);
  });

  it('returns empty array when creators is null', () => {
    expect(getTopMatches({ preferredLocation: 'Lagos' }, null)).toEqual([]);
  });

  it('returns empty array when creators is empty', () => {
    expect(getTopMatches({ preferredLocation: 'Lagos' }, [])).toEqual([]);
  });

  it('returns empty array when no meaningful preferences', () => {
    const prefs = { bodyTypes: ['No preference'], skinTones: [] };
    expect(getTopMatches(prefs, creators)).toEqual([]);
  });

  it('returns creators sorted by match percentage descending', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = getTopMatches(prefs, creators);
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].matchPercentage).toBeGreaterThanOrEqual(result[i].matchPercentage);
    }
  });

  it('filters out creators with 0% match', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = getTopMatches(prefs, creators);
    result.forEach((c) => {
      expect(c.matchPercentage).toBeGreaterThan(0);
    });
  });

  it('respects the limit parameter', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = getTopMatches(prefs, creators, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('defaults limit to 5', () => {
    const manyCreators = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      location: 'Lagos',
    }));
    const prefs = { preferredLocation: 'Lagos' };
    const result = getTopMatches(prefs, manyCreators);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('adds matchPercentage to each returned creator', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = getTopMatches(prefs, creators);
    result.forEach((c) => {
      expect(c).toHaveProperty('matchPercentage');
      expect(typeof c.matchPercentage).toBe('number');
    });
  });
});

describe('addMatchPercentages', () => {
  const creators = [
    { id: 1, location: 'Lagos', bodyType: 'Slim' },
    { id: 2, location: 'Abuja', bodyType: 'Curvy' },
  ];

  it('returns creators unchanged when preferences is null', () => {
    expect(addMatchPercentages(null, creators)).toEqual(creators);
  });

  it('returns creators unchanged when creators is null', () => {
    expect(addMatchPercentages({ preferredLocation: 'Lagos' }, null)).toBeNull();
  });

  it('adds matchPercentage to each creator', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = addMatchPercentages(prefs, creators);
    expect(result).toHaveLength(2);
    result.forEach((c) => {
      expect(c).toHaveProperty('matchPercentage');
      expect(typeof c.matchPercentage).toBe('number');
    });
  });

  it('preserves original creator properties', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = addMatchPercentages(prefs, creators);
    expect(result[0].id).toBe(1);
    expect(result[0].location).toBe('Lagos');
    expect(result[1].id).toBe(2);
  });

  it('returns correct match values', () => {
    const prefs = { preferredLocation: 'Lagos' };
    const result = addMatchPercentages(prefs, creators);
    expect(result[0].matchPercentage).toBe(100); // Lagos matches
    expect(result[1].matchPercentage).toBe(0);   // Abuja doesn't
  });
});
