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

/**
 * Additional pricing and parseFloat coercion tests.
 * The base transformDbCreator.test.js covers happy paths;
 * these focus on edge-case inputs for numeric fields.
 */

const makeDbData = (creatorOverrides = {}, userOverrides = {}) => ({
  id: 'user-1',
  name: 'Test',
  username: 'test',
  phone: '08012345678',
  last_seen_at: null,
  creators: {
    id: 'c-1',
    tagline: '',
    bio: '',
    is_verified: false,
    is_video_verified: false,
    is_studio_verified: false,
    is_available: true,
    location: 'Lagos',
    body_type: null,
    skin_tone: null,
    age: null,
    height: null,
    services: [],
    rating: '4.5',
    reviews_count: 5,
    verified_meetups: 3,
    meetup_success_rate: '90',
    profile_views: 100,
    favorite_count: 10,
    pricing: null,
    schedule: null,
    creator_areas: [],
    creator_photos: [],
    creator_extras: [],
    creator_boundaries: [],
    ...creatorOverrides,
  },
  ...userOverrides,
});

describe('parseFloat coercions on rating', () => {
  it('parses numeric string "4.7" to 4.7', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: '4.7' }));
    expect(result.stats.rating).toBe(4.7);
  });

  it('parses integer string "5" to 5', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: '5' }));
    expect(result.stats.rating).toBe(5);
  });

  it('handles numeric 4.8 directly', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: 4.8 }));
    expect(result.stats.rating).toBe(4.8);
  });

  it('falls back to 4.8 for empty string (NaN)', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: '' }));
    // parseFloat('') => NaN, NaN || 4.8 => 4.8
    expect(result.stats.rating).toBe(4.8);
  });

  it('falls back to 4.8 for non-numeric string', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: 'abc' }));
    expect(result.stats.rating).toBe(4.8);
  });

  it('falls back to 4.8 for zero (falsy but parseFloat returns 0)', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: '0' }));
    // parseFloat('0') => 0, 0 || 4.8 => 4.8 (0 is falsy)
    expect(result.stats.rating).toBe(4.8);
  });

  it('falls back to 4.8 for null', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: null }));
    expect(result.stats.rating).toBe(4.8);
  });

  it('falls back to 4.8 for undefined', () => {
    const result = transformDbCreatorToConfig(makeDbData({ rating: undefined }));
    expect(result.stats.rating).toBe(4.8);
  });
});

describe('parseFloat coercions on meetup_success_rate', () => {
  it('parses "96.0" to 96', () => {
    const result = transformDbCreatorToConfig(makeDbData({ meetup_success_rate: '96.0' }));
    expect(result.stats.meetupSuccessRate).toBe(96);
  });

  it('parses "100" to 100', () => {
    const result = transformDbCreatorToConfig(makeDbData({ meetup_success_rate: '100' }));
    expect(result.stats.meetupSuccessRate).toBe(100);
  });

  it('falls back to 98 for null', () => {
    const result = transformDbCreatorToConfig(makeDbData({ meetup_success_rate: null }));
    expect(result.stats.meetupSuccessRate).toBe(98);
  });

  it('falls back to 98 for empty string', () => {
    const result = transformDbCreatorToConfig(makeDbData({ meetup_success_rate: '' }));
    expect(result.stats.meetupSuccessRate).toBe(98);
  });

  it('falls back to 98 for "0" (falsy)', () => {
    const result = transformDbCreatorToConfig(makeDbData({ meetup_success_rate: '0' }));
    expect(result.stats.meetupSuccessRate).toBe(98);
  });
});

describe('extras price parsing', () => {
  it('parses string price "10000" to number', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [{ id: 'e1', name: 'Massage', price: '10000' }],
    }));
    expect(result.extras[0].price).toBe(10000);
    expect(typeof result.extras[0].price).toBe('number');
  });

  it('parses decimal price "15000.50"', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [{ id: 'e1', name: 'Special', price: '15000.50' }],
    }));
    expect(result.extras[0].price).toBe(15000.5);
  });

  it('handles numeric price directly', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [{ id: 'e1', name: 'Quick', price: 5000 }],
    }));
    expect(result.extras[0].price).toBe(5000);
  });

  it('returns NaN for non-numeric price string', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [{ id: 'e1', name: 'Bad', price: 'free' }],
    }));
    expect(result.extras[0].price).toBeNaN();
  });

  it('handles multiple extras', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [
        { id: 'e1', name: 'A', price: '5000' },
        { id: 'e2', name: 'B', price: '10000' },
        { id: 'e3', name: 'C', price: '20000' },
      ],
    }));
    expect(result.extras).toHaveLength(3);
    expect(result.extras.map(e => e.price)).toEqual([5000, 10000, 20000]);
  });

  it('preserves extra id and name', () => {
    const result = transformDbCreatorToConfig(makeDbData({
      creator_extras: [{ id: 'ext-42', name: 'Premium Massage', price: '25000' }],
    }));
    expect(result.extras[0].id).toBe('ext-42');
    expect(result.extras[0].name).toBe('Premium Massage');
  });
});

describe('pricing fallback defaults', () => {
  it('uses full default pricing when creator pricing is null', () => {
    const result = transformDbCreatorToConfig(makeDbData({ pricing: null }));
    expect(result.pricing).toEqual({
      unlockContact: 5000,
      unlockPhotos: 3000,
      meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
      meetupOutcall: null,
    });
  });

  it('uses creator pricing when provided', () => {
    const customPricing = {
      unlockContact: 8000,
      unlockPhotos: 5000,
      meetupIncall: { 1: 70000, 2: 120000, overnight: 220000 },
      meetupOutcall: { 1: 90000, 2: 150000, overnight: 280000 },
    };
    const result = transformDbCreatorToConfig(makeDbData({ pricing: customPricing }));
    expect(result.pricing).toEqual(customPricing);
  });

  it('uses partial pricing (no outcall)', () => {
    const partialPricing = {
      unlockContact: 6000,
      unlockPhotos: 4000,
      meetupIncall: { 1: 55000 },
      meetupOutcall: null,
    };
    const result = transformDbCreatorToConfig(makeDbData({ pricing: partialPricing }));
    expect(result.pricing.meetupOutcall).toBeNull();
    expect(result.pricing.meetupIncall[1]).toBe(55000);
  });
});

describe('integer field defaults', () => {
  it('reviews_count defaults to 0', () => {
    const result = transformDbCreatorToConfig(makeDbData({ reviews_count: null }));
    expect(result.stats.reviews).toBe(0);
  });

  it('verified_meetups defaults to 0', () => {
    const result = transformDbCreatorToConfig(makeDbData({ verified_meetups: null }));
    expect(result.stats.verifiedMeetups).toBe(0);
  });

  it('profile_views defaults to 0', () => {
    const result = transformDbCreatorToConfig(makeDbData({ profile_views: null }));
    expect(result.stats.profileViews).toBe(0);
  });

  it('favorite_count defaults to 0', () => {
    const result = transformDbCreatorToConfig(makeDbData({ favorite_count: null }));
    expect(result.stats.favoriteCount).toBe(0);
  });
});

describe('WhatsApp number conversion', () => {
  it('replaces leading 0 with 234', () => {
    const result = transformDbCreatorToConfig(makeDbData({}, { phone: '08012345678' }));
    expect(result.contact.whatsapp).toBe('2348012345678');
  });

  it('does not double-prefix if already has 234', () => {
    const result = transformDbCreatorToConfig(makeDbData({}, { phone: '2348012345678' }));
    expect(result.contact.whatsapp).toBe('2348012345678');
  });

  it('handles null phone gracefully', () => {
    const result = transformDbCreatorToConfig(makeDbData({}, { phone: null }));
    expect(result.contact.phone).toBeNull();
    expect(result.contact.whatsapp).toBeUndefined();
  });
});
