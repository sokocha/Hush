import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/storageService', () => ({
  storageService: {
    getPhotoUrl: vi.fn((path) => `https://storage.test/${path}`),
  },
}));

import { transformDbCreatorToConfig } from '../utils/transformDbCreator';

beforeEach(() => {
  vi.clearAllMocks();
});

const makeDbCreator = (creatorOverrides = {}, userOverrides = {}) => ({
  id: 'user-1',
  name: 'Test Creator',
  username: 'testcreator',
  phone: '08012345678',
  last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  creators: {
    id: 'creator-1',
    tagline: 'Your favorite girl',
    bio: 'Hello world',
    is_verified: true,
    is_video_verified: true,
    is_studio_verified: false,
    is_available: true,
    location: 'Abuja',
    body_type: 'Slim',
    skin_tone: 'Caramel',
    age: 24,
    height: '5\'6"',
    services: ['GFE', 'Duo'],
    rating: '4.7',
    reviews_count: 15,
    verified_meetups: 10,
    meetup_success_rate: '96.0',
    profile_views: 500,
    favorite_count: 42,
    pricing: {
      unlockContact: 7000,
      unlockPhotos: 4000,
      meetupIncall: { 1: 60000, 2: 100000, overnight: 200000 },
      meetupOutcall: { 1: 80000, 2: 130000, overnight: 250000 },
    },
    schedule: {
      monday: { active: true, start: '10:00', end: '22:00' },
      tuesday: { active: false, start: '10:00', end: '22:00' },
    },
    creator_areas: [{ area: 'Wuse' }, { area: 'Maitama' }],
    creator_photos: [
      { id: 'p1', storage_path: 'photos/p1.jpg', is_preview: true },
      { id: 'p2', storage_path: 'photos/p2.jpg', is_preview: true },
      { id: 'p3', storage_path: 'photos/p3.jpg', is_preview: false },
    ],
    creator_extras: [
      { id: 'e1', name: 'Massage', price: '10000' },
    ],
    creator_boundaries: [{ boundary: 'No kissing' }],
    ...creatorOverrides,
  },
  ...userOverrides,
});

describe('transformDbCreatorToConfig', () => {
  it('returns null for null input', () => {
    expect(transformDbCreatorToConfig(null)).toBeNull();
  });

  it('returns null when creators field is missing', () => {
    expect(transformDbCreatorToConfig({ id: 'user-1', name: 'Test' })).toBeNull();
  });

  it('includes PLATFORM_CONFIG', () => {
    const result = transformDbCreatorToConfig(makeDbCreator());
    expect(result.platform).toBeDefined();
    expect(result.platform.name).toBe('Hush');
  });

  it('sets creatorId correctly', () => {
    const result = transformDbCreatorToConfig(makeDbCreator());
    expect(result.creatorId).toBe('creator-1');
  });

  describe('profile', () => {
    it('maps name, username, tagline, bio from DB', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.profile.name).toBe('Test Creator');
      expect(result.profile.username).toBe('testcreator');
      expect(result.profile.tagline).toBe('Your favorite girl');
      expect(result.profile.bio).toBe('Hello world');
    });

    it('maps verification flags correctly', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      // isVerified should be true if either is_verified OR is_video_verified
      expect(result.profile.isVerified).toBe(true);
      expect(result.profile.isStudioVerified).toBe(false);
    });

    it('sets isVerified true when only is_video_verified is true', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ is_verified: false, is_video_verified: true }));
      expect(result.profile.isVerified).toBe(true);
    });

    it('sets isVerified false when both are false', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ is_verified: false, is_video_verified: false }));
      expect(result.profile.isVerified).toBe(false);
    });

    it('computes isOnline from last_seen_at within 15 minutes', () => {
      // 5 minutes ago = online
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.profile.isOnline).toBe(true);
    });

    it('computes isOnline false when last_seen_at > 15 minutes ago', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({}, {
        last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      }));
      expect(result.profile.isOnline).toBe(false);
    });

    it('computes isOnline false when last_seen_at is null', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({}, { last_seen_at: null }));
      expect(result.profile.isOnline).toBe(false);
    });

    it('sets isAvailable true by default (is_available !== false)', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ is_available: undefined }));
      expect(result.profile.isAvailable).toBe(true);
    });

    it('sets isAvailable false when explicitly set', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ is_available: false }));
      expect(result.profile.isAvailable).toBe(false);
    });

    it('defaults location to Lagos', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ location: null }));
      expect(result.profile.location).toBe('Lagos');
    });

    it('maps areas from creator_areas', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.profile.areas).toEqual(['Wuse', 'Maitama']);
    });

    it('defaults areas to empty array', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ creator_areas: null }));
      expect(result.profile.areas).toEqual([]);
    });

    it('maps physical attributes', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.profile.bodyType).toBe('Slim');
      expect(result.profile.skinTone).toBe('Caramel');
      expect(result.profile.age).toBe(24);
      expect(result.profile.height).toBe('5\'6"');
      expect(result.profile.services).toEqual(['GFE', 'Duo']);
    });

    it('defaults physical attributes to null', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({
        body_type: null, skin_tone: null, age: null, height: null, services: null,
      }));
      expect(result.profile.bodyType).toBeNull();
      expect(result.profile.skinTone).toBeNull();
      expect(result.profile.age).toBeNull();
      expect(result.profile.height).toBeNull();
      expect(result.profile.services).toEqual([]);
    });

    it('defaults tagline and bio to empty string', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ tagline: null, bio: null }));
      expect(result.profile.tagline).toBe('');
      expect(result.profile.bio).toBe('');
    });
  });

  describe('stats', () => {
    it('parses numeric stats from strings', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.stats.rating).toBe(4.7);
      expect(result.stats.reviews).toBe(15);
      expect(result.stats.verifiedMeetups).toBe(10);
      expect(result.stats.meetupSuccessRate).toBe(96);
      expect(result.stats.profileViews).toBe(500);
      expect(result.stats.favoriteCount).toBe(42);
    });

    it('uses sensible defaults when stats are null', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({
        rating: null,
        reviews_count: null,
        verified_meetups: null,
        meetup_success_rate: null,
        profile_views: null,
        favorite_count: null,
      }));
      expect(result.stats.rating).toBe(4.8); // default fallback
      expect(result.stats.reviews).toBe(0);
      expect(result.stats.verifiedMeetups).toBe(0);
      expect(result.stats.meetupSuccessRate).toBe(98); // default fallback
      expect(result.stats.profileViews).toBe(0);
      expect(result.stats.favoriteCount).toBe(0);
    });
  });

  describe('contact', () => {
    it('maps phone and converts to WhatsApp format', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.contact.phone).toBe('08012345678');
      // /^0/ replaces leading 0 with 234, so 0801... → 2348012345678
      expect(result.contact.whatsapp).toBe('2348012345678');
    });

    it('handles phone without leading zero', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({}, { phone: '2348012345678' }));
      // No leading 0 to replace, phone stays as-is
      expect(result.contact.whatsapp).toBe('2348012345678');
    });
  });

  describe('pricing', () => {
    it('uses creator pricing when available', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.pricing.unlockContact).toBe(7000);
      expect(result.pricing.meetupIncall[1]).toBe(60000);
      expect(result.pricing.meetupOutcall[1]).toBe(80000);
    });

    it('uses default pricing when null', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ pricing: null }));
      expect(result.pricing.unlockContact).toBe(5000);
      expect(result.pricing.unlockPhotos).toBe(3000);
      expect(result.pricing.meetupIncall[1]).toBe(50000);
      expect(result.pricing.meetupOutcall).toBeNull();
    });
  });

  describe('extras', () => {
    it('maps extras with parsed prices', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.extras).toEqual([
        { id: 'e1', name: 'Massage', price: 10000 },
      ]);
    });

    it('defaults to empty array', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ creator_extras: null }));
      expect(result.extras).toEqual([]);
    });
  });

  describe('boundaries', () => {
    it('extracts boundary strings', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.boundaries).toEqual(['No kissing']);
    });

    it('defaults to empty array', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ creator_boundaries: null }));
      expect(result.boundaries).toEqual([]);
    });
  });

  describe('photos', () => {
    it('counts total and preview photos correctly', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.photos.total).toBe(3);
      expect(result.photos.previewCount).toBe(2);
    });

    it('generates storage URLs for preview and locked photos', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.photos.previewImages).toEqual([
        'https://storage.test/photos/p1.jpg',
        'https://storage.test/photos/p2.jpg',
      ]);
      expect(result.photos.lockedImages).toEqual([
        'https://storage.test/photos/p3.jpg',
      ]);
    });

    it('handles empty photos', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ creator_photos: [] }));
      expect(result.photos.total).toBe(0);
      expect(result.photos.previewCount).toBe(0);
      expect(result.photos.previewImages).toEqual([]);
      expect(result.photos.lockedImages).toEqual([]);
    });

    it('handles null photos', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ creator_photos: null }));
      expect(result.photos.total).toBe(0);
    });
  });

  describe('schedule', () => {
    it('passes schedule through directly', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.schedule.monday.active).toBe(true);
      expect(result.schedule.tuesday.active).toBe(false);
    });

    it('passes null schedule as undefined', () => {
      const result = transformDbCreatorToConfig(makeDbCreator({ schedule: null }));
      expect(result.schedule).toBeNull();
    });
  });

  describe('static defaults', () => {
    it('always has empty reviews array', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.reviews).toEqual([]);
    });

    it('always has empty blacklistedClients array', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.blacklistedClients).toEqual([]);
    });

    it('always has 3 free messages', () => {
      const result = transformDbCreatorToConfig(makeDbCreator());
      expect(result.freeMessages).toBe(3);
    });
  });
});
