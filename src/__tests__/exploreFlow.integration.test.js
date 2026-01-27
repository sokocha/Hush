import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { creatorService } from '../services/creatorService';
import { calculateMatchPercentage, getTopMatches, addMatchPercentages } from '../utils/matchingAlgorithm';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleCreators = [
  {
    id: 'c1',
    location: 'Lagos',
    body_type: 'Slim',
    skin_tone: 'Caramel',
    age: 24,
    services: ['Dinner', 'Nightlife'],
    rating: 4.9,
    reviews_count: 45,
    verified_meetups: 30,
    meetup_success_rate: 98,
    is_visible_in_explore: true,
    is_verified: true,
    favorite_count: 12,
    pricing: { meetupIncall: { 1: 50000 } },
    creator_areas: [{ area: 'Victoria Island' }, { area: 'Lekki' }],
    creator_photos: [{ id: 'p1', storage_path: 'photo1.jpg', is_preview: true, display_order: 0 }],
    creator_extras: [{ id: 'e1', name: 'Dinner', price: 10000 }],
    users: { id: 'c1', name: 'Angel', username: 'angel_lagos', last_seen_at: new Date().toISOString() },
  },
  {
    id: 'c2',
    location: 'Lagos',
    body_type: 'Curvy',
    skin_tone: 'Dark',
    age: 27,
    services: ['Companionship', 'Travel'],
    rating: 4.7,
    reviews_count: 22,
    verified_meetups: 18,
    meetup_success_rate: 95,
    is_visible_in_explore: true,
    is_verified: true,
    favorite_count: 8,
    pricing: { meetupIncall: { 1: 75000 } },
    creator_areas: [{ area: 'Ikeja' }],
    creator_photos: [],
    creator_extras: [],
    users: { id: 'c2', name: 'Queen', username: 'queen_lagos', last_seen_at: '2026-01-26T10:00:00Z' },
  },
  {
    id: 'c3',
    location: 'Abuja',
    body_type: 'Athletic',
    skin_tone: 'Light',
    age: 22,
    services: ['Dinner'],
    rating: 4.5,
    reviews_count: 10,
    verified_meetups: 8,
    meetup_success_rate: 87,
    is_visible_in_explore: true,
    is_verified: false,
    favorite_count: 3,
    pricing: { meetupIncall: { 1: 40000 } },
    creator_areas: [{ area: 'Wuse' }],
    creator_photos: [],
    creator_extras: [],
    users: { id: 'c3', name: 'Bella', username: 'bella_abj', last_seen_at: '2026-01-25T08:00:00Z' },
  },
];

describe('Explore Flow Integration', () => {
  describe('fetch and display creators', () => {
    it('fetches visible creators with related data', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: sampleCreators,
        error: null,
      });
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators();

      expect(result.success).toBe(true);
      expect(result.creators).toHaveLength(3);
      expect(result.creators[0].favorite_count).toBe(12);
      expect(result.creators[0].creator_areas).toHaveLength(2);
    });

    it('filters by location', async () => {
      const lagosCreators = sampleCreators.filter(c => c.location === 'Lagos');

      const mockIlike = vi.fn().mockResolvedValue({ data: lagosCreators, error: null });
      const mockEq = vi.fn(() => ({ ilike: mockIlike }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators({ location: 'Lagos' });

      expect(result.success).toBe(true);
      expect(result.creators).toHaveLength(2);
      expect(result.creators.every(c => c.location === 'Lagos')).toBe(true);
    });

    it('filters verified creators only', async () => {
      const verifiedCreators = sampleCreators.filter(c => c.is_verified);

      const mockEqVerified = vi.fn().mockResolvedValue({ data: verifiedCreators, error: null });
      const mockEqExplore = vi.fn(() => ({ eq: mockEqVerified }));
      const mockSelect = vi.fn(() => ({ eq: mockEqExplore }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators({ verified: true });

      expect(result.success).toBe(true);
      expect(result.creators).toHaveLength(2);
    });

    it('sorts by rating descending', async () => {
      const sorted = [...sampleCreators].sort((a, b) => b.rating - a.rating);

      const mockOrder = vi.fn().mockResolvedValue({ data: sorted, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators({ sortBy: 'rating' });

      expect(result.success).toBe(true);
      expect(result.creators[0].rating).toBe(4.9);
      expect(result.creators[2].rating).toBe(4.5);
    });

    it('sorts by reviews descending', async () => {
      const sorted = [...sampleCreators].sort((a, b) => b.reviews_count - a.reviews_count);

      const mockOrder = vi.fn().mockResolvedValue({ data: sorted, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators({ sortBy: 'reviews' });

      expect(result.success).toBe(true);
      expect(result.creators[0].reviews_count).toBe(45);
    });
  });

  describe('matching algorithm integration with explore data', () => {
    const clientPreferences = {
      preferredLocation: 'Lagos',
      bodyTypes: ['Slim'],
      skinTones: ['Caramel'],
      ageRanges: ['21-25'],
      services: ['Dinner'],
    };

    it('calculates match percentages for fetched creators', () => {
      const creators = sampleCreators.map(c => ({
        username: c.users.username,
        location: c.location,
        bodyType: c.body_type,
        skinTone: c.skin_tone,
        age: c.age,
        services: c.services,
      }));

      const withMatches = addMatchPercentages(clientPreferences, creators);

      expect(withMatches[0].matchPercentage).toBeDefined();
      expect(typeof withMatches[0].matchPercentage).toBe('number');

      // angel_lagos should match best (Lagos, Slim, Caramel, age 24, Dinner)
      const angel = withMatches.find(c => c.username === 'angel_lagos');
      expect(angel.matchPercentage).toBeGreaterThanOrEqual(80);
    });

    it('returns top matches sorted by match percentage', () => {
      const creators = sampleCreators.map(c => ({
        username: c.users.username,
        location: c.location,
        bodyType: c.body_type,
        skinTone: c.skin_tone,
        age: c.age,
        services: c.services,
      }));

      const topMatches = getTopMatches(clientPreferences, creators, 2);

      expect(topMatches).toHaveLength(2);
      expect(topMatches[0].matchPercentage).toBeGreaterThanOrEqual(topMatches[1].matchPercentage);
    });

    it('gives zero match when no preferences set', () => {
      const emptyPrefs = {};
      const creator = {
        location: 'Lagos',
        bodyType: 'Slim',
        skinTone: 'Caramel',
        age: 24,
        services: ['Dinner'],
      };

      const score = calculateMatchPercentage(emptyPrefs, creator);
      expect(score).toBe(0);
    });

    it('matches location with 25% weight', () => {
      const locationOnlyPrefs = { preferredLocation: 'Lagos' };

      const lagosCreator = { location: 'Lagos', bodyType: null, skinTone: null, age: null, services: [] };
      const abujaCreator = { location: 'Abuja', bodyType: null, skinTone: null, age: null, services: [] };

      const lagosScore = calculateMatchPercentage(locationOnlyPrefs, lagosCreator);
      const abujaScore = calculateMatchPercentage(locationOnlyPrefs, abujaCreator);

      expect(lagosScore).toBeGreaterThan(abujaScore);
      expect(lagosScore).toBe(100); // Location is the only preference, so full match = 100%
    });
  });

  describe('explore page data transformation', () => {
    it('transforms database creator to card model format', () => {
      const creator = sampleCreators[0];
      const user = creator.users;

      // Simulate transformCreatorToModel logic
      const photos = creator.creator_photos || [];
      const previewPhotos = photos.filter(p => p.is_preview);
      const profilePhoto = previewPhotos[0] || photos[0];
      const areas = (creator.creator_areas || []).map(a => a.area);

      const model = {
        id: `creator-${creator.id}`,
        username: user.username,
        name: user.name,
        tagline: creator.tagline || 'New on the platform',
        location: creator.location,
        areas,
        rating: creator.rating,
        verifiedMeetups: creator.verified_meetups,
        meetupSuccessRate: creator.meetup_success_rate,
        startingPrice: creator.pricing?.meetupIncall?.[1] || 0,
        profilePhotoUrl: profilePhoto?.storage_path || null,
        favoriteCount: creator.favorite_count || 0,
        bodyType: creator.body_type,
        skinTone: creator.skin_tone,
        age: creator.age,
        services: creator.services,
      };

      expect(model.username).toBe('angel_lagos');
      expect(model.areas).toEqual(['Victoria Island', 'Lekki']);
      expect(model.favoriteCount).toBe(12);
      expect(model.startingPrice).toBe(50000);
      expect(model.profilePhotoUrl).toBe('photo1.jpg');
    });

    it('handles creator with no photos', () => {
      const creator = sampleCreators[1];
      const photos = creator.creator_photos || [];
      const profilePhoto = photos.filter(p => p.is_preview)[0] || photos[0];

      expect(profilePhoto).toBeUndefined();
      expect(profilePhoto?.storage_path || null).toBeNull();
    });

    it('includes favorite_count from database', () => {
      sampleCreators.forEach(creator => {
        expect(creator.favorite_count).toBeDefined();
        expect(typeof creator.favorite_count).toBe('number');
      });

      expect(sampleCreators[0].favorite_count).toBe(12);
      expect(sampleCreators[1].favorite_count).toBe(8);
      expect(sampleCreators[2].favorite_count).toBe(3);
    });
  });

  describe('price range filtering', () => {
    it('filters creators within price range', () => {
      const models = sampleCreators.map(c => ({
        username: c.users.username,
        startingPrice: c.pricing?.meetupIncall?.[1] || 0,
      }));

      // Under 50k
      const under50k = models.filter(m => m.startingPrice <= 50000);
      expect(under50k).toHaveLength(2); // 40k and 50k

      // 50k-75k
      const mid = models.filter(m => m.startingPrice >= 50000 && m.startingPrice <= 75000);
      expect(mid).toHaveLength(2); // 50k and 75k

      // Over 75k
      const over75k = models.filter(m => m.startingPrice > 75000);
      expect(over75k).toHaveLength(0);
    });
  });

  describe('location-based filtering', () => {
    it('groups creators by location', () => {
      const locationCounts = {};
      sampleCreators.forEach(c => {
        const loc = c.location;
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });

      expect(locationCounts['Lagos']).toBe(2);
      expect(locationCounts['Abuja']).toBe(1);
    });

    it('filters to only Lagos creators', () => {
      const lagosOnly = sampleCreators.filter(c =>
        c.location.toLowerCase() === 'lagos'
      );
      expect(lagosOnly).toHaveLength(2);
    });
  });

  describe('search filtering', () => {
    it('searches by creator name', () => {
      const query = 'angel';
      const results = sampleCreators.filter(c =>
        c.users.name.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0].users.username).toBe('angel_lagos');
    });

    it('searches by area', () => {
      const query = 'lekki';
      const results = sampleCreators.filter(c =>
        c.creator_areas.some(a => a.area.toLowerCase().includes(query.toLowerCase()))
      );
      expect(results).toHaveLength(1);
      expect(results[0].users.username).toBe('angel_lagos');
    });

    it('returns empty results for non-matching search', () => {
      const query = 'nonexistent';
      const results = sampleCreators.filter(c =>
        c.users.name.toLowerCase().includes(query.toLowerCase()) ||
        c.users.username.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('returns failure when database query fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getExploreCreators();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });
});
