import { describe, it, expect } from 'vitest';

/**
 * Filter and sort logic from ExplorePage.jsx.
 * Extracted as pure functions matching the inline implementation to
 * test without rendering the full component.
 */

// ─── Constants (mirroring ExplorePage) ───────────────────────

const AGE_RANGES = [
  { label: '18-22', min: 18, max: 22 },
  { label: '23-27', min: 23, max: 27 },
  { label: '28-32', min: 28, max: 32 },
  { label: '33-40', min: 33, max: 40 },
  { label: '40+', min: 40, max: 99 },
];

const PRICE_RANGES = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under ₦50k", min: 0, max: 50000 },
  { label: "₦50k - ₦75k", min: 50000, max: 75000 },
  { label: "₦75k - ₦100k", min: 75000, max: 100000 },
  { label: "Over ₦100k", min: 100000, max: Infinity },
];

// ─── Filter functions (mirroring ExplorePage useMemo) ────────

const filterByLocation = (models, location) => {
  if (location === 'all') return models;
  return models.filter(m =>
    m.location.toLowerCase().replace(' ', '-') === location
  );
};

const filterBySearch = (models, query) => {
  if (!query) return models;
  const q = query.toLowerCase();
  return models.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.username.toLowerCase().includes(q) ||
    m.areas.some(a => a.toLowerCase().includes(q))
  );
};

const filterByOnline = (models) => models.filter(m => m.isOnline);
const filterByAvailable = (models) => models.filter(m => m.isAvailable);

const filterByExtras = (models, extras) => {
  if (extras.length === 0) return models;
  return models.filter(m =>
    extras.every(extra => m.extras.some(e => e.name === extra || e === extra))
  );
};

const filterByPriceRange = (models, range) => {
  if (range.label === 'Any price') return models;
  return models.filter(m =>
    m.startingPrice >= range.min && m.startingPrice < range.max
  );
};

const filterByFavorites = (models, favorites) => {
  return models.filter(m => favorites.includes(m.username));
};

const filterByBodyType = (models, bodyTypes) => {
  if (bodyTypes.length === 0) return models;
  return models.filter(m =>
    m.bodyType && bodyTypes.some(bt => bt.toLowerCase() === m.bodyType.toLowerCase())
  );
};

const filterBySkinTone = (models, skinTones) => {
  if (skinTones.length === 0) return models;
  return models.filter(m =>
    m.skinTone && skinTones.some(st => st.toLowerCase() === m.skinTone.toLowerCase())
  );
};

const filterByAgeRange = (models, selectedRanges) => {
  if (selectedRanges.length === 0) return models;
  return models.filter(m => {
    if (!m.age) return false;
    return selectedRanges.some(range => {
      const ageRange = AGE_RANGES.find(ar => ar.label === range);
      return ageRange && m.age >= ageRange.min && m.age <= ageRange.max;
    });
  });
};

const filterByServices = (models, selectedServices) => {
  if (selectedServices.length === 0) return models;
  return models.filter(m => {
    const modelServices = m.services || [];
    return selectedServices.some(service =>
      modelServices.some(ms => ms.toLowerCase().includes(service.toLowerCase()))
    );
  });
};

// ─── Sort functions ──────────────────────────────────────────

const sortModels = (models, sortBy) => {
  const sorted = [...models];
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'success':
      return sorted.sort((a, b) => b.meetupSuccessRate - a.meetupSuccessRate);
    case 'price-low':
      return sorted.sort((a, b) => a.startingPrice - b.startingPrice);
    case 'price-high':
      return sorted.sort((a, b) => b.startingPrice - a.startingPrice);
    case 'meetups':
      return sorted.sort((a, b) => b.verifiedMeetups - a.verifiedMeetups);
    case 'match':
      return sorted.sort((a, b) => {
        const matchDiff = (b.matchPercentage || 0) - (a.matchPercentage || 0);
        if (matchDiff !== 0) return matchDiff;
        return b.rating - a.rating;
      });
    default: // 'recommended'
      return sorted.sort((a, b) =>
        (b.meetupSuccessRate * b.verifiedMeetups) - (a.meetupSuccessRate * a.verifiedMeetups)
      );
  }
};

// ─── Test data ───────────────────────────────────────────────

const makeModel = (overrides = {}) => ({
  name: 'Model A',
  username: 'modela',
  location: 'Lagos',
  areas: ['Lekki', 'VI'],
  isOnline: false,
  isAvailable: true,
  extras: [{ name: 'Massage' }],
  startingPrice: 50000,
  bodyType: 'Slim',
  skinTone: 'Caramel',
  age: 24,
  services: ['GFE', 'Oral'],
  rating: 4.5,
  meetupSuccessRate: 95,
  verifiedMeetups: 10,
  matchPercentage: 80,
  hasOutcall: false,
  ...overrides,
});

const testModels = [
  makeModel({ name: 'Ada', username: 'ada', location: 'Lagos', areas: ['Lekki'], isOnline: true, isAvailable: true, startingPrice: 40000, rating: 4.9, meetupSuccessRate: 98, verifiedMeetups: 20, age: 22, bodyType: 'Slim', skinTone: 'Light', services: ['GFE', 'Massage'], extras: [{ name: 'Massage' }], matchPercentage: 90 }),
  makeModel({ name: 'Bimpe', username: 'bimpe', location: 'Abuja', areas: ['Wuse'], isOnline: false, isAvailable: true, startingPrice: 60000, rating: 4.7, meetupSuccessRate: 92, verifiedMeetups: 15, age: 27, bodyType: 'Curvy', skinTone: 'Caramel', services: ['GFE', 'Duo'], extras: [{ name: 'BDSM' }], matchPercentage: 75 }),
  makeModel({ name: 'Chioma', username: 'chioma', location: 'Lagos', areas: ['VI', 'Ikoyi'], isOnline: true, isAvailable: false, startingPrice: 80000, rating: 4.3, meetupSuccessRate: 88, verifiedMeetups: 8, age: 30, bodyType: 'Athletic', skinTone: 'Dark', services: ['Oral', 'BDSM'], extras: [{ name: 'Massage' }, { name: 'BDSM' }], matchPercentage: 60 }),
  makeModel({ name: 'Dami', username: 'dami', location: 'Port Harcourt', areas: ['GRA'], isOnline: false, isAvailable: false, startingPrice: 120000, rating: 4.8, meetupSuccessRate: 96, verifiedMeetups: 25, age: 35, bodyType: 'Thick', skinTone: 'Dark', services: ['Dinner date', 'Travel companion'], extras: [], matchPercentage: 50 }),
];

// ─── Tests ───────────────────────────────────────────────────

describe('filterByLocation', () => {
  it('returns all models for "all"', () => {
    expect(filterByLocation(testModels, 'all')).toHaveLength(4);
  });

  it('filters Lagos models', () => {
    const result = filterByLocation(testModels, 'lagos');
    expect(result).toHaveLength(2);
    expect(result.every(m => m.location === 'Lagos')).toBe(true);
  });

  it('filters Abuja models', () => {
    const result = filterByLocation(testModels, 'abuja');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bimpe');
  });

  it('filters Port Harcourt models (slug with hyphen)', () => {
    const result = filterByLocation(testModels, 'port-harcourt');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dami');
  });

  it('returns empty for unknown location', () => {
    expect(filterByLocation(testModels, 'ibadan')).toHaveLength(0);
  });
});

describe('filterBySearch', () => {
  it('returns all when query is empty', () => {
    expect(filterBySearch(testModels, '')).toHaveLength(4);
  });

  it('matches by name', () => {
    const result = filterBySearch(testModels, 'Ada');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada');
  });

  it('matches by username', () => {
    const result = filterBySearch(testModels, 'bimpe');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bimpe');
  });

  it('matches by area', () => {
    const result = filterBySearch(testModels, 'Lekki');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada');
  });

  it('case-insensitive search', () => {
    expect(filterBySearch(testModels, 'ADA')).toHaveLength(1);
    expect(filterBySearch(testModels, 'lekki')).toHaveLength(1);
  });

  it('partial match works', () => {
    const result = filterBySearch(testModels, 'chi');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('chioma');
  });

  it('returns empty when nothing matches', () => {
    expect(filterBySearch(testModels, 'zzzzz')).toHaveLength(0);
  });
});

describe('filterByOnline', () => {
  it('returns only online models', () => {
    const result = filterByOnline(testModels);
    expect(result).toHaveLength(2);
    expect(result.every(m => m.isOnline)).toBe(true);
  });
});

describe('filterByAvailable', () => {
  it('returns only available models', () => {
    const result = filterByAvailable(testModels);
    expect(result).toHaveLength(2);
    expect(result.every(m => m.isAvailable)).toBe(true);
  });
});

describe('filterByExtras', () => {
  it('returns all when no extras selected', () => {
    expect(filterByExtras(testModels, [])).toHaveLength(4);
  });

  it('filters by single extra', () => {
    const result = filterByExtras(testModels, ['Massage']);
    expect(result).toHaveLength(2); // Ada and Chioma
  });

  it('filters by multiple extras (AND logic)', () => {
    const result = filterByExtras(testModels, ['Massage', 'BDSM']);
    expect(result).toHaveLength(1); // Only Chioma has both
    expect(result[0].username).toBe('chioma');
  });

  it('returns empty when no model has all extras', () => {
    expect(filterByExtras(testModels, ['Massage', 'NonExistent'])).toHaveLength(0);
  });
});

describe('filterByPriceRange', () => {
  it('returns all for "Any price"', () => {
    expect(filterByPriceRange(testModels, PRICE_RANGES[0])).toHaveLength(4);
  });

  it('filters under 50k', () => {
    const result = filterByPriceRange(testModels, PRICE_RANGES[1]); // Under ₦50k
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada'); // 40000
  });

  it('filters 50k-75k range', () => {
    const result = filterByPriceRange(testModels, PRICE_RANGES[2]); // ₦50k - ₦75k
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('bimpe'); // 60000
  });

  it('filters 75k-100k range', () => {
    const result = filterByPriceRange(testModels, PRICE_RANGES[3]); // ₦75k - ₦100k
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('chioma'); // 80000
  });

  it('filters over 100k', () => {
    const result = filterByPriceRange(testModels, PRICE_RANGES[4]); // Over ₦100k
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('dami'); // 120000
  });

  it('boundary: price at range min is included', () => {
    const result = filterByPriceRange(
      [makeModel({ startingPrice: 50000 })],
      PRICE_RANGES[2] // ₦50k - ₦75k (min: 50000)
    );
    expect(result).toHaveLength(1);
  });

  it('boundary: price at range max is excluded', () => {
    const result = filterByPriceRange(
      [makeModel({ startingPrice: 75000 })],
      PRICE_RANGES[2] // ₦50k - ₦75k (max: 75000)
    );
    expect(result).toHaveLength(0);
  });
});

describe('filterByFavorites', () => {
  it('filters to only favorited models', () => {
    const result = filterByFavorites(testModels, ['ada', 'dami']);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.username)).toEqual(['ada', 'dami']);
  });

  it('returns empty when no favorites match', () => {
    expect(filterByFavorites(testModels, ['unknown'])).toHaveLength(0);
  });

  it('returns empty when favorites list is empty', () => {
    expect(filterByFavorites(testModels, [])).toHaveLength(0);
  });
});

describe('filterByBodyType', () => {
  it('returns all when no types selected', () => {
    expect(filterByBodyType(testModels, [])).toHaveLength(4);
  });

  it('filters by single body type', () => {
    const result = filterByBodyType(testModels, ['Slim']);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada');
  });

  it('filters by multiple body types (OR logic)', () => {
    const result = filterByBodyType(testModels, ['Slim', 'Curvy']);
    expect(result).toHaveLength(2);
  });

  it('case-insensitive matching', () => {
    expect(filterByBodyType(testModels, ['slim'])).toHaveLength(1);
    expect(filterByBodyType(testModels, ['CURVY'])).toHaveLength(1);
  });

  it('excludes models with null bodyType', () => {
    const models = [makeModel({ bodyType: null })];
    expect(filterByBodyType(models, ['Slim'])).toHaveLength(0);
  });
});

describe('filterBySkinTone', () => {
  it('returns all when none selected', () => {
    expect(filterBySkinTone(testModels, [])).toHaveLength(4);
  });

  it('filters by single skin tone', () => {
    const result = filterBySkinTone(testModels, ['Light']);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada');
  });

  it('filters by multiple (OR logic)', () => {
    const result = filterBySkinTone(testModels, ['Dark']);
    expect(result).toHaveLength(2); // Chioma and Dami
  });

  it('excludes models with null skinTone', () => {
    const models = [makeModel({ skinTone: null })];
    expect(filterBySkinTone(models, ['Light'])).toHaveLength(0);
  });
});

describe('filterByAgeRange', () => {
  it('returns all when none selected', () => {
    expect(filterByAgeRange(testModels, [])).toHaveLength(4);
  });

  it('filters 18-22 range', () => {
    const result = filterByAgeRange(testModels, ['18-22']);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada'); // age 22
  });

  it('filters 23-27 range', () => {
    const result = filterByAgeRange(testModels, ['23-27']);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('bimpe'); // age 27
  });

  it('filters multiple ranges (OR logic)', () => {
    const result = filterByAgeRange(testModels, ['18-22', '28-32']);
    expect(result).toHaveLength(2); // Ada (22) and Chioma (30)
  });

  it('boundary: age at range min is included', () => {
    const models = [makeModel({ age: 18 })];
    expect(filterByAgeRange(models, ['18-22'])).toHaveLength(1);
  });

  it('boundary: age at range max is included', () => {
    const models = [makeModel({ age: 22 })];
    expect(filterByAgeRange(models, ['18-22'])).toHaveLength(1);
  });

  it('excludes models with null age', () => {
    const models = [makeModel({ age: null })];
    expect(filterByAgeRange(models, ['18-22'])).toHaveLength(0);
  });
});

describe('filterByServices', () => {
  it('returns all when none selected', () => {
    expect(filterByServices(testModels, [])).toHaveLength(4);
  });

  it('filters by single service (OR within model)', () => {
    const result = filterByServices(testModels, ['GFE']);
    expect(result).toHaveLength(2); // Ada and Bimpe
  });

  it('filters by BDSM', () => {
    const result = filterByServices(testModels, ['BDSM']);
    expect(result).toHaveLength(1); // Chioma
  });

  it('multiple selected services use OR logic', () => {
    const result = filterByServices(testModels, ['GFE', 'Dinner date']);
    expect(result).toHaveLength(3); // Ada, Bimpe (GFE), Dami (Dinner date)
  });

  it('case-insensitive matching', () => {
    expect(filterByServices(testModels, ['gfe'])).toHaveLength(2);
  });

  it('partial match works (includes)', () => {
    const result = filterByServices(testModels, ['Dinner']);
    expect(result).toHaveLength(1); // Dami has "Dinner date"
  });

  it('handles models with no services', () => {
    const models = [makeModel({ services: [] })];
    expect(filterByServices(models, ['GFE'])).toHaveLength(0);
  });
});

describe('sortModels', () => {
  it('sorts by rating (highest first)', () => {
    const sorted = sortModels(testModels, 'rating');
    expect(sorted[0].rating).toBe(4.9);
    expect(sorted[sorted.length - 1].rating).toBe(4.3);
  });

  it('sorts by success rate (highest first)', () => {
    const sorted = sortModels(testModels, 'success');
    expect(sorted[0].meetupSuccessRate).toBe(98);
    expect(sorted[sorted.length - 1].meetupSuccessRate).toBe(88);
  });

  it('sorts by price low to high', () => {
    const sorted = sortModels(testModels, 'price-low');
    expect(sorted[0].startingPrice).toBe(40000);
    expect(sorted[sorted.length - 1].startingPrice).toBe(120000);
  });

  it('sorts by price high to low', () => {
    const sorted = sortModels(testModels, 'price-high');
    expect(sorted[0].startingPrice).toBe(120000);
    expect(sorted[sorted.length - 1].startingPrice).toBe(40000);
  });

  it('sorts by verified meetups (highest first)', () => {
    const sorted = sortModels(testModels, 'meetups');
    expect(sorted[0].verifiedMeetups).toBe(25);
    expect(sorted[sorted.length - 1].verifiedMeetups).toBe(8);
  });

  it('sorts by match percentage (highest first)', () => {
    const sorted = sortModels(testModels, 'match');
    expect(sorted[0].matchPercentage).toBe(90);
    expect(sorted[sorted.length - 1].matchPercentage).toBe(50);
  });

  it('match sort breaks ties by rating', () => {
    const tiedModels = [
      makeModel({ matchPercentage: 80, rating: 4.5 }),
      makeModel({ matchPercentage: 80, rating: 4.9 }),
    ];
    const sorted = sortModels(tiedModels, 'match');
    expect(sorted[0].rating).toBe(4.9);
  });

  it('default (recommended) sorts by success*meetups product', () => {
    const sorted = sortModels(testModels, 'recommended');
    // Dami: 96 * 25 = 2400 (highest product)
    expect(sorted[0].username).toBe('dami');
  });

  it('does not mutate original array', () => {
    const original = [...testModels];
    sortModels(testModels, 'rating');
    expect(testModels.map(m => m.username)).toEqual(original.map(m => m.username));
  });
});

describe('combined filters', () => {
  it('location + online narrows results correctly', () => {
    let result = filterByLocation(testModels, 'lagos');
    result = filterByOnline(result);
    // Lagos + Online: Ada (online, Lagos) and Chioma (online, Lagos)
    expect(result).toHaveLength(2);
  });

  it('location + online + available further narrows', () => {
    let result = filterByLocation(testModels, 'lagos');
    result = filterByOnline(result);
    result = filterByAvailable(result);
    // Ada is online + available + Lagos; Chioma is online but NOT available
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('ada');
  });

  it('filtering then sorting preserves filter', () => {
    let result = filterByLocation(testModels, 'lagos');
    result = sortModels(result, 'rating');
    expect(result).toHaveLength(2);
    expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
  });
});
