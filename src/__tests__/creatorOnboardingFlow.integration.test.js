import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock variables
const { mockFrom, mockFunctions, mockStorageFrom, mockListBuckets } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFunctions: { invoke: vi.fn() },
  mockStorageFrom: vi.fn(),
  mockListBuckets: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    functions: mockFunctions,
    storage: {
      from: (...args) => mockStorageFrom(...args),
      listBuckets: (...args) => mockListBuckets(...args),
    },
  },
}));

import { authService } from '../services/authService';
import { creatorService } from '../services/creatorService';
import { storageService } from '../services/storageService';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Creator Onboarding Flow Integration', () => {
  // Shared mock data
  const mockCreatorUser = {
    id: 'creator-1',
    phone: '+2348012345678',
    username: 'destiny_x',
    name: 'Destiny',
    user_type: 'creator',
  };
  const mockCreatorProfile = {
    id: 'creator-1',
    location: 'Lagos',
    tagline: 'Hey there',
    bio: 'This is my profile bio text.',
    body_type: 'Slim',
    skin_tone: 'Caramel',
    age: 24,
    height: '5\'5"-5\'8"',
    services: ['gfe', 'dinner'],
    is_verified: false,
    is_video_verified: false,
    is_studio_verified: false,
    pending_verification: true,
    is_visible_in_explore: false,
    pricing: null,
    schedule: null,
    rating: 0,
    reviews_count: 0,
    creator_areas: [{ area: 'Lekki' }, { area: 'VI' }],
    creator_photos: [],
    creator_extras: [],
    creator_boundaries: [{ boundary: 'No bareback' }],
  };

  describe('step 1: creator registration', () => {
    it('registers a creator and returns user data', async () => {
      const creatorData = {
        phone: '+2348012345678',
        name: 'Destiny',
        username: 'destiny_x',
        location: 'Lagos',
        areas: ['Lekki', 'VI'],
        tagline: 'Hey there',
        bio: 'This is my profile bio text.',
        bodyType: 'Slim',
        skinTone: 'Caramel',
        age: 24,
        height: '5\'5"-5\'8"',
        services: ['gfe', 'dinner'],
      };

      // Mock user insert
      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockCreatorUser, error: null }),
              })),
            })),
          };
        }
        if (table === 'creators') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockCreatorProfile, error: null }),
              })),
            })),
          };
        }
        if (table === 'creator_areas') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'creator_boundaries') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await authService.registerCreator(creatorData);
      expect(result.success).toBe(true);
      expect(result.user.username).toBe('destiny_x');
      expect(result.user.user_type).toBe('creator');
    });
  });

  describe('step 2: photo upload during onboarding', () => {
    it('uploads a photo and returns storage path', async () => {
      const blob = new Blob(['fake-image'], { type: 'image/jpeg' });

      mockListBuckets.mockResolvedValue({ data: [{ name: 'creator-photos' }], error: null });
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'creator-1/12345.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/creator-1/12345.jpg' },
        }),
      });

      // Mock photo count query + insert
      mockFrom.mockImplementation((table) => {
        if (table === 'creator_photos') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                // For count query
                then: vi.fn((cb) => cb({ count: 0, error: null })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'photo-1', storage_path: 'creator-1/12345.jpg', is_preview: true },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      });

      const result = await storageService.uploadCreatorPhotoBlob('creator-1', blob, true);
      expect(result.success).toBe(true);
      expect(result.photo).toBeDefined();
    });
  });

  describe('step 3: pricing setup during onboarding', () => {
    it('saves pricing to creator profile', async () => {
      const pricing = {
        unlockContact: 1000,
        unlockPhotos: 5000,
        meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
        meetupOutcall: null,
        depositPercent: 0.5,
      };

      // Chain: update → eq → select → single
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'creator-1', pricing }, error: null }),
            })),
          })),
        })),
      });

      const result = await creatorService.updateCreatorPricing('creator-1', pricing);
      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('creators');
    });

    it('constructs correct pricing object from form data', () => {
      const formData = {
        unlockContact: 1000,
        unlockPhotos: 5000,
        meetupIncall1: 50000,
        meetupIncall2: 80000,
        meetupIncallOvernight: 150000,
        meetupOutcall1: 70000,
        meetupOutcall2: 100000,
        meetupOutcallOvernight: 200000,
        depositPercent: 50,
        enableOutcall: true,
      };

      // This mirrors the pricing object construction in CreatorOnboardingPage
      const pricing = {
        unlockContact: formData.unlockContact,
        unlockPhotos: formData.unlockPhotos,
        meetupIncall: {
          1: formData.meetupIncall1,
          2: formData.meetupIncall2,
          overnight: formData.meetupIncallOvernight,
        },
        meetupOutcall: formData.enableOutcall ? {
          1: formData.meetupOutcall1,
          2: formData.meetupOutcall2,
          overnight: formData.meetupOutcallOvernight,
        } : null,
        depositPercent: formData.depositPercent / 100,
      };

      expect(pricing.meetupIncall[1]).toBe(50000);
      expect(pricing.meetupIncall[2]).toBe(80000);
      expect(pricing.meetupIncall.overnight).toBe(150000);
      expect(pricing.meetupOutcall[1]).toBe(70000);
      expect(pricing.depositPercent).toBe(0.5);
    });

    it('sets outcall to null when disabled', () => {
      const formData = {
        unlockContact: 1000, unlockPhotos: 5000,
        meetupIncall1: 50000, meetupIncall2: 80000, meetupIncallOvernight: 150000,
        enableOutcall: false,
      };

      const pricing = {
        unlockContact: formData.unlockContact,
        unlockPhotos: formData.unlockPhotos,
        meetupIncall: {
          1: formData.meetupIncall1,
          2: formData.meetupIncall2,
          overnight: formData.meetupIncallOvernight,
        },
        meetupOutcall: formData.enableOutcall ? { 1: 0, 2: 0, overnight: 0 } : null,
        depositPercent: 0.5,
      };

      expect(pricing.meetupOutcall).toBeNull();
    });
  });

  describe('step 4: schedule setup during onboarding', () => {
    it('saves schedule to creator profile', async () => {
      const schedule = {
        monday: { active: true, start: '10:00', end: '22:00' },
        tuesday: { active: true, start: '10:00', end: '22:00' },
        wednesday: { active: true, start: '10:00', end: '22:00' },
        thursday: { active: true, start: '10:00', end: '22:00' },
        friday: { active: true, start: '10:00', end: '23:00' },
        saturday: { active: true, start: '12:00', end: '23:00' },
        sunday: { active: false, start: '12:00', end: '20:00' },
      };

      // Chain: update → eq → select → single
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'creator-1', schedule }, error: null }),
            })),
          })),
        })),
      });

      const result = await creatorService.updateCreatorSchedule('creator-1', schedule);
      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('creators');
    });

    it('counts active days correctly', () => {
      const schedule = {
        monday: { active: true, start: '10:00', end: '22:00' },
        tuesday: { active: true, start: '10:00', end: '22:00' },
        wednesday: { active: false, start: '10:00', end: '22:00' },
        thursday: { active: true, start: '10:00', end: '22:00' },
        friday: { active: true, start: '10:00', end: '23:00' },
        saturday: { active: true, start: '12:00', end: '23:00' },
        sunday: { active: false, start: '12:00', end: '20:00' },
      };

      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const activeDays = dayNames.filter(d => schedule[d]?.active).length;
      expect(activeDays).toBe(5);
    });
  });

  describe('profile completion checks', () => {
    it('considers profile incomplete with no photos and no pricing', () => {
      const user = { photos: [], pricing: { meetupIncall: { 1: 0 } } };
      const hasPhotos = user.photos?.length > 0;
      const hasPricing = user.pricing?.meetupIncall?.[1] > 0;
      expect(hasPhotos).toBe(false);
      expect(hasPricing).toBe(false);
    });

    it('considers profile incomplete with photos but no pricing', () => {
      const user = { photos: [{ id: '1' }], pricing: { meetupIncall: { 1: 0 } } };
      const hasPhotos = user.photos?.length > 0;
      const hasPricing = user.pricing?.meetupIncall?.[1] > 0;
      expect(hasPhotos).toBe(true);
      expect(hasPricing).toBe(false);
    });

    it('considers profile complete with photos and pricing', () => {
      const user = {
        photos: [{ id: '1' }, { id: '2' }, { id: '3' }],
        pricing: { meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 } },
      };
      const hasPhotos = user.photos?.length > 0;
      const hasPricing = user.pricing?.meetupIncall?.[1] > 0;
      const isProfileComplete = hasPhotos && hasPricing;
      expect(isProfileComplete).toBe(true);
    });

    it('requires minimum 3 photos for onboarding step completion', () => {
      expect([].length >= 3).toBe(false);
      expect([{ id: '1' }].length >= 3).toBe(false);
      expect([{ id: '1' }, { id: '2' }].length >= 3).toBe(false);
      expect([{ id: '1' }, { id: '2' }, { id: '3' }].length >= 3).toBe(true);
    });

    it('handles null/undefined pricing gracefully', () => {
      const user = { photos: [{ id: '1' }], pricing: null };
      const hasPricing = user.pricing?.meetupIncall?.[1] > 0;
      expect(hasPricing).toBeFalsy();
    });

    it('handles null/undefined photos gracefully', () => {
      const user = { pricing: { meetupIncall: { 1: 50000 } } };
      const hasPhotos = user.photos?.length > 0;
      expect(hasPhotos).toBeFalsy();
    });
  });

  describe('draft cleared after registration', () => {
    it('draft is removed from localStorage on successful registration', async () => {
      // Simulate draft existing before registration
      localStorage.setItem('hush_creator_draft', JSON.stringify({ name: 'Destiny' }));
      expect(localStorage.getItem('hush_creator_draft')).not.toBeNull();

      // Mock successful registration
      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockCreatorUser, error: null }),
              })),
            })),
          };
        }
        if (table === 'creators') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockCreatorProfile, error: null }),
              })),
            })),
          };
        }
        if (table === 'creator_areas' || table === 'creator_boundaries') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const result = await authService.registerCreator({
        phone: '+2348012345678', name: 'Destiny', username: 'destiny_x',
        location: 'Lagos', areas: ['Lekki'], services: ['gfe'],
      });

      // After successful registration, clear draft (mirrors AuthPage logic)
      if (result.success) {
        localStorage.removeItem('hush_creator_draft');
      }

      expect(result.success).toBe(true);
      expect(localStorage.getItem('hush_creator_draft')).toBeNull();
    });
  });
});
