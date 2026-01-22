/**
 * Matching algorithm for calculating compatibility between clients and creators
 * Based on client preferences vs creator attributes
 */

// Age range mapping for matching
const AGE_RANGES = {
  '18-22': { min: 18, max: 22 },
  '23-27': { min: 23, max: 27 },
  '28-32': { min: 28, max: 32 },
  '33+': { min: 33, max: 99 },
};

/**
 * Calculate match percentage between a client's preferences and a creator's attributes
 * @param {Object} preferences - Client's preferences
 * @param {Object} creator - Creator with attributes
 * @returns {number} Match percentage (0-100)
 */
export function calculateMatchPercentage(preferences, creator) {
  if (!preferences || !creator) return 0;

  const scores = [];
  const weights = {
    location: 25,    // Location is important
    bodyType: 20,    // Body type preference
    skinTone: 20,    // Skin tone preference
    age: 20,         // Age preference
    services: 15,    // Services match
  };

  // Location match (25 points)
  if (preferences.preferredLocation) {
    const locationMatch = creator.location?.toLowerCase() === preferences.preferredLocation.toLowerCase();
    scores.push({ category: 'location', score: locationMatch ? weights.location : 0, weight: weights.location });
  }

  // Body type match (20 points)
  if (preferences.bodyTypes && preferences.bodyTypes.length > 0) {
    const bodyMatch = creator.bodyType && preferences.bodyTypes.some(
      bt => bt.toLowerCase() === creator.bodyType.toLowerCase()
    );
    scores.push({ category: 'bodyType', score: bodyMatch ? weights.bodyType : 0, weight: weights.bodyType });
  }

  // Skin tone match (20 points)
  if (preferences.skinTones && preferences.skinTones.length > 0) {
    const skinMatch = creator.skinTone && preferences.skinTones.some(
      st => st.toLowerCase() === creator.skinTone.toLowerCase()
    );
    scores.push({ category: 'skinTone', score: skinMatch ? weights.skinTone : 0, weight: weights.skinTone });
  }

  // Age range match (20 points)
  if (preferences.ageRanges && preferences.ageRanges.length > 0 && creator.age) {
    const ageMatch = preferences.ageRanges.some(range => {
      const ageRange = AGE_RANGES[range];
      return ageRange && creator.age >= ageRange.min && creator.age <= ageRange.max;
    });
    scores.push({ category: 'age', score: ageMatch ? weights.age : 0, weight: weights.age });
  }

  // Services match (15 points) - partial scoring based on how many services match
  if (preferences.services && preferences.services.length > 0) {
    const creatorServices = creator.services || [];
    const matchingServices = preferences.services.filter(service =>
      creatorServices.some(cs => cs.toLowerCase().includes(service.toLowerCase()) ||
                                 service.toLowerCase().includes(cs.toLowerCase()))
    );
    const serviceScore = (matchingServices.length / preferences.services.length) * weights.services;
    scores.push({ category: 'services', score: serviceScore, weight: weights.services });
  }

  // If no preferences were set, return 0 (no match data)
  if (scores.length === 0) return 0;

  // Calculate weighted average
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // Normalize to 100 and round
  const percentage = Math.round((totalScore / totalWeight) * 100);

  return Math.min(100, Math.max(0, percentage));
}

/**
 * Get top matches for a client from a list of creators
 * @param {Object} preferences - Client's preferences
 * @param {Array} creators - Array of creators
 * @param {number} limit - Maximum number of matches to return
 * @returns {Array} Sorted array of creators with match percentages
 */
export function getTopMatches(preferences, creators, limit = 5) {
  if (!preferences || !creators || creators.length === 0) return [];

  // Check if client has any meaningful preferences set
  const hasPreferences =
    preferences.preferredLocation ||
    (preferences.bodyTypes && preferences.bodyTypes.length > 0) ||
    (preferences.skinTones && preferences.skinTones.length > 0) ||
    (preferences.ageRanges && preferences.ageRanges.length > 0) ||
    (preferences.services && preferences.services.length > 0);

  if (!hasPreferences) return [];

  // Calculate match for each creator
  const creatorsWithMatch = creators.map(creator => ({
    ...creator,
    matchPercentage: calculateMatchPercentage(preferences, creator),
  }));

  // Filter to only creators with matches > 0 and sort by match percentage
  return creatorsWithMatch
    .filter(c => c.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);
}

/**
 * Add match percentages to all creators
 * @param {Object} preferences - Client's preferences
 * @param {Array} creators - Array of creators
 * @returns {Array} Creators with matchPercentage added
 */
export function addMatchPercentages(preferences, creators) {
  if (!preferences || !creators) return creators;

  return creators.map(creator => ({
    ...creator,
    matchPercentage: calculateMatchPercentage(preferences, creator),
  }));
}
