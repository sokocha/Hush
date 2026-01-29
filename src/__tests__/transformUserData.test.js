import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storageService before importing the module under test
vi.mock('../services/storageService', () => ({
  storageService: {
    getPhotoUrl: vi.fn((path) => `https://storage.test/${path}`),
  },
}));

// Mock other services that AuthContext imports
vi.mock('../services/authService', () => ({ authService: {} }));
vi.mock('../services/userService', () => ({ userService: {} }));
vi.mock('../services/creatorService', () => ({ creatorService: {} }));
vi.mock('../services/bookingService', () => ({ bookingService: {} }));

import { transformUserData } from '../context/AuthContext';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('transformUserData', () => {
  it('returns null for null input', () => {
    expect(transformUserData(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(transformUserData(undefined)).toBeNull();
  });

  it('returns base user for unknown user type', () => {
    const dbUser = {
      id: 'user-1',
      phone: '08012345678',
      username: 'testuser',
      name: 'Test User',
      user_type: 'unknown',
      is_superadmin: false,
      created_at: '2025-01-01T00:00:00Z',
      last_seen_at: '2025-06-01T00:00:00Z',
    };
    const result = transformUserData(dbUser);
    expect(result).toEqual({
      id: 'user-1',
      phone: '08012345678',
      username: 'testuser',
      name: 'Test User',
      userType: 'unknown',
      isSuperAdmin: false,
      isLoggedIn: true,
      registeredAt: '2025-01-01T00:00:00Z',
      lastSeenAt: '2025-06-01T00:00:00Z',
    });
  });

  describe('client user', () => {
    const makeClientDbUser = (overrides = {}) => ({
      id: 'client-1',
      phone: '08011111111',
      username: 'clientuser',
      name: 'Client User',
      user_type: 'client',
      is_superadmin: false,
      created_at: '2025-03-15T12:00:00Z',
      last_seen_at: '2025-06-10T08:00:00Z',
      clients: {
        is_new_member: false,
        has_paid_trust_deposit: true,
        tier: 'verified',
        deposit_balance: '25000.50',
        successful_meetups: 5,
        meetup_success_rate: 95.5,
        months_on_platform: 3,
        is_trusted_member: true,
        preferences: {
          preferredLocation: 'Lagos',
          bodyTypes: ['Slim', 'Athletic'],
          skinTones: ['Caramel'],
          ageRanges: ['23-27'],
          services: ['GFE'],
        },
        ...overrides,
      },
    });

    it('maps all client fields correctly', () => {
      const result = transformUserData(makeClientDbUser());
      expect(result.id).toBe('client-1');
      expect(result.phone).toBe('08011111111');
      expect(result.username).toBe('clientuser');
      expect(result.name).toBe('Client User');
      expect(result.userType).toBe('client');
      expect(result.isLoggedIn).toBe(true);
      expect(result.isNewMember).toBe(false);
      expect(result.hasPaidTrustDeposit).toBe(true);
      expect(result.tier).toBe('verified');
      expect(result.depositBalance).toBe(25000.5);
      expect(result.successfulMeetups).toBe(5);
      expect(result.meetupSuccessRate).toBe(95.5);
      expect(result.monthsOnPlatform).toBe(3);
      expect(result.isTrustedMember).toBe(true);
    });

    it('maps client preferences correctly', () => {
      const result = transformUserData(makeClientDbUser());
      expect(result.preferences).toEqual({
        preferredLocation: 'Lagos',
        bodyTypes: ['Slim', 'Athletic'],
        skinTones: ['Caramel'],
        ageRanges: ['23-27'],
        services: ['GFE'],
      });
    });

    it('provides default preferences when null', () => {
      const result = transformUserData(makeClientDbUser({ preferences: null }));
      expect(result.preferences).toEqual({
        preferredLocation: null,
        bodyTypes: [],
        skinTones: [],
        ageRanges: [],
        services: [],
      });
    });

    it('parses deposit_balance as float and defaults to 0', () => {
      expect(transformUserData(makeClientDbUser({ deposit_balance: '0' })).depositBalance).toBe(0);
      expect(transformUserData(makeClientDbUser({ deposit_balance: null })).depositBalance).toBe(0);
      expect(transformUserData(makeClientDbUser({ deposit_balance: '99999.99' })).depositBalance).toBe(99999.99);
    });

    it('defaults successful_meetups and months_on_platform to 0', () => {
      const result = transformUserData(makeClientDbUser({ successful_meetups: null, months_on_platform: null }));
      expect(result.successfulMeetups).toBe(0);
      expect(result.monthsOnPlatform).toBe(0);
    });

    it('includes DEFAULT_CLIENT_STATE fields', () => {
      const result = transformUserData(makeClientDbUser());
      // Should have meetups array from default state
      expect(result.meetups).toEqual([]);
    });
  });

  describe('creator user', () => {
    const makeCreatorDbUser = (creatorOverrides = {}) => ({
      id: 'creator-1',
      phone: '08022222222',
      username: 'creatoruser',
      name: 'Creator User',
      user_type: 'creator',
      is_superadmin: false,
      created_at: '2025-02-01T00:00:00Z',
      last_seen_at: '2025-06-01T00:00:00Z',
      creators: {
        location: 'Lagos',
        tagline: 'Your dream girl',
        bio: 'Hello world',
        is_verified: true,
        is_video_verified: true,
        is_studio_verified: false,
        pending_verification: false,
        is_visible_in_explore: true,
        verification_status: 'approved',
        verification_call_scheduled_at: '2025-03-01T14:00:00Z',
        verification_denied_reason: null,
        verification_notes: 'Looks good',
        dispute_message: null,
        dispute_submitted_at: null,
        pricing: {
          unlockContact: 5000,
          unlockPhotos: 3000,
          meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
          meetupOutcall: null,
        },
        schedule: { monday: { active: true, start: '10:00', end: '22:00' } },
        body_type: 'Slim',
        skin_tone: 'Caramel',
        age: 25,
        height: '5\'7"',
        services: ['GFE', 'Dinner date'],
        rating: '4.9',
        reviews_count: 12,
        verified_meetups: 8,
        meetup_success_rate: '97.5',
        profile_views: 320,
        creator_areas: [{ area: 'Victoria Island' }, { area: 'Lekki' }],
        creator_photos: [
          { id: 'p1', storage_path: 'photos/p1.jpg', is_preview: true, captured_at: '2025-04-01' },
          { id: 'p2', storage_path: 'photos/p2.jpg', is_preview: false, captured_at: '2025-04-02' },
        ],
        creator_extras: [
          { id: 'e1', name: 'Massage', price: '10000' },
          { id: 'e2', name: 'Roleplay', price: '15000' },
        ],
        creator_boundaries: [{ boundary: 'No overnight' }, { boundary: 'No anal' }],
        ...creatorOverrides,
      },
    });

    it('maps all core creator fields', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.id).toBe('creator-1');
      expect(result.phone).toBe('08022222222');
      expect(result.username).toBe('creatoruser');
      expect(result.name).toBe('Creator User');
      expect(result.userType).toBe('creator');
      expect(result.location).toBe('Lagos');
      expect(result.tagline).toBe('Your dream girl');
      expect(result.bio).toBe('Hello world');
    });

    it('maps verification fields correctly', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.isVerified).toBe(true);
      expect(result.isVideoVerified).toBe(true);
      expect(result.isStudioVerified).toBe(false);
      expect(result.pendingVerification).toBe(false);
      expect(result.isVisibleInExplore).toBe(true);
      expect(result.verificationStatus).toBe('approved');
      expect(result.verificationCallScheduledAt).toBe('2025-03-01T14:00:00Z');
      expect(result.verificationDeniedReason).toBeNull();
      expect(result.verificationNotes).toBe('Looks good');
    });

    it('maps dispute fields correctly', () => {
      const result = transformUserData(makeCreatorDbUser({
        dispute_message: 'I disagree',
        dispute_submitted_at: '2025-05-01T10:00:00Z',
      }));
      expect(result.disputeMessage).toBe('I disagree');
      expect(result.disputeSubmittedAt).toBe('2025-05-01T10:00:00Z');
    });

    it('maps physical attributes', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.bodyType).toBe('Slim');
      expect(result.skinTone).toBe('Caramel');
      expect(result.age).toBe(25);
      expect(result.height).toBe('5\'7"');
      expect(result.services).toEqual(['GFE', 'Dinner date']);
    });

    it('defaults physical attributes to null when missing', () => {
      const result = transformUserData(makeCreatorDbUser({
        body_type: null,
        skin_tone: null,
        age: null,
        height: null,
        services: null,
      }));
      expect(result.bodyType).toBeNull();
      expect(result.skinTone).toBeNull();
      expect(result.age).toBeNull();
      expect(result.height).toBeNull();
      expect(result.services).toEqual([]);
    });

    it('maps stats with parseFloat', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.stats.rating).toBe(4.9);
      expect(result.stats.reviews).toBe(12);
      expect(result.stats.verifiedMeetups).toBe(8);
      expect(result.stats.meetupSuccessRate).toBe(97.5);
      expect(result.stats.profileViews).toBe(320);
    });

    it('defaults stats to 0 when missing', () => {
      const result = transformUserData(makeCreatorDbUser({
        rating: null,
        reviews_count: null,
        verified_meetups: null,
        meetup_success_rate: null,
        profile_views: null,
      }));
      expect(result.stats.rating).toBe(0);
      expect(result.stats.reviews).toBe(0);
      expect(result.stats.verifiedMeetups).toBe(0);
      expect(result.stats.meetupSuccessRate).toBe(0);
      expect(result.stats.profileViews).toBe(0);
    });

    it('maps areas from creator_areas', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.areas).toEqual(['Victoria Island', 'Lekki']);
    });

    it('defaults areas to empty array when null', () => {
      const result = transformUserData(makeCreatorDbUser({ creator_areas: null }));
      expect(result.areas).toEqual([]);
    });

    it('maps photos with storage URLs', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.photos).toHaveLength(2);
      expect(result.photos[0]).toEqual({
        id: 'p1',
        url: 'https://storage.test/photos/p1.jpg',
        storagePath: 'photos/p1.jpg',
        isPreview: true,
        capturedAt: '2025-04-01',
      });
      expect(result.photos[1].isPreview).toBe(false);
    });

    it('defaults photos to empty array when null', () => {
      const result = transformUserData(makeCreatorDbUser({ creator_photos: null }));
      expect(result.photos).toEqual([]);
    });

    it('maps extras with parsed prices', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.extras).toEqual([
        { id: 'e1', name: 'Massage', price: 10000 },
        { id: 'e2', name: 'Roleplay', price: 15000 },
      ]);
    });

    it('defaults extras to empty array when null', () => {
      const result = transformUserData(makeCreatorDbUser({ creator_extras: null }));
      expect(result.extras).toEqual([]);
    });

    it('maps boundaries from creator_boundaries', () => {
      const result = transformUserData(makeCreatorDbUser());
      expect(result.boundaries).toEqual(['No overnight', 'No anal']);
    });

    it('defaults boundaries to empty array when null', () => {
      const result = transformUserData(makeCreatorDbUser({ creator_boundaries: null }));
      expect(result.boundaries).toEqual([]);
    });

    it('uses default pricing when creator pricing is null', () => {
      const result = transformUserData(makeCreatorDbUser({ pricing: null }));
      // Should use DEFAULT_CREATOR_STATE pricing
      expect(result.pricing.unlockContact).toBe(0);
      expect(result.pricing.meetupIncall).toEqual({ 1: 0, 2: 0, overnight: 0 });
    });

    it('uses default schedule when creator schedule is null', () => {
      const result = transformUserData(makeCreatorDbUser({ schedule: null }));
      // Should use DEFAULT_CREATOR_STATE schedule
      expect(result.schedule.monday.active).toBe(true);
      expect(result.schedule.sunday.active).toBe(false);
    });

    it('defaults verificationStatus to pending when null', () => {
      const result = transformUserData(makeCreatorDbUser({ verification_status: null }));
      expect(result.verificationStatus).toBe('pending');
    });

    it('preserves superadmin flag', () => {
      const dbUser = makeCreatorDbUser();
      dbUser.is_superadmin = true;
      const result = transformUserData(dbUser);
      expect(result.isSuperAdmin).toBe(true);
    });
  });
});
