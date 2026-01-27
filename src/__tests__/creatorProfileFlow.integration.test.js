import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock variables so they're available when vi.mock factory runs
const { mockFrom, mockStorageFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    storage: {
      from: (...args) => mockStorageFrom(...args),
    },
  },
}));

import { creatorService } from '../services/creatorService';
import { storageService } from '../services/storageService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Creator Profile Flow Integration', () => {
  const creatorDbData = {
    id: 'user-1',
    phone: '+2348012345678',
    username: 'angel_lagos',
    name: 'Angel',
    user_type: 'creator',
    last_seen_at: new Date().toISOString(),
    creators: {
      id: 'user-1',
      location: 'Lagos',
      tagline: 'Premium companion in Lagos',
      bio: 'Professional and discreet',
      is_verified: true,
      is_video_verified: true,
      is_studio_verified: false,
      is_visible_in_explore: true,
      body_type: 'Slim',
      skin_tone: 'Caramel',
      age: 24,
      height: "5'6",
      services: ['Dinner', 'Nightlife'],
      rating: 4.9,
      reviews_count: 45,
      verified_meetups: 30,
      meetup_success_rate: 98,
      profile_views: 150,
      favorite_count: 12,
      pricing: {
        unlockContact: 5000,
        unlockPhotos: 3000,
        meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
        meetupOutcall: null,
        depositPercent: 0.5,
      },
      schedule: {
        monday: { active: true, start: '10:00', end: '22:00' },
        tuesday: { active: true, start: '10:00', end: '22:00' },
      },
      creator_areas: [{ id: 'a1', area: 'Victoria Island' }, { id: 'a2', area: 'Lekki' }],
      creator_photos: [
        { id: 'p1', storage_path: 'photos/angel1.jpg', is_preview: true, display_order: 0, captured_at: '2026-01-01' },
        { id: 'p2', storage_path: 'photos/angel2.jpg', is_preview: false, display_order: 1, captured_at: '2026-01-02' },
      ],
      creator_extras: [
        { id: 'e1', name: 'Dinner', price: 10000 },
        { id: 'e2', name: 'Transport', price: 5000 },
      ],
      creator_boundaries: [
        { id: 'b1', boundary: 'No overnight on first meetup' },
      ],
    },
  };

  describe('fetch creator profile by username', () => {
    it('loads full creator profile with all related data', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: creatorDbData, error: null });
      const mockEqType = vi.fn(() => ({ single: mockSingle }));
      const mockEqUsername = vi.fn(() => ({ eq: mockEqType }));
      const mockSelect = vi.fn(() => ({ eq: mockEqUsername }));

      // Also mock the profile view increment
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return { select: mockSelect };
        }
        if (table === 'creators') {
          return { update: mockUpdate };
        }
        return {};
      });

      const result = await creatorService.getCreatorByUsername('angel_lagos');

      expect(result.success).toBe(true);
      expect(result.creator.username).toBe('angel_lagos');
      expect(result.creator.creators.rating).toBe(4.9);
      expect(result.creator.creators.favorite_count).toBe(12);
      expect(result.creator.creators.creator_areas).toHaveLength(2);
      expect(result.creator.creators.creator_photos).toHaveLength(2);
      expect(result.creator.creators.creator_extras).toHaveLength(2);
      expect(result.creator.creators.creator_boundaries).toHaveLength(1);
    });

    it('increments profile_views on each visit', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: creatorDbData, error: null });
      const mockEqType = vi.fn(() => ({ single: mockSingle }));
      const mockEqUsername = vi.fn(() => ({ eq: mockEqType }));
      const mockSelect = vi.fn(() => ({ eq: mockEqUsername }));

      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return { select: mockSelect };
        }
        if (table === 'creators') {
          return { update: mockUpdate };
        }
        return {};
      });

      await creatorService.getCreatorByUsername('angel_lagos');

      // Verify profile_views was incremented
      expect(mockFrom).toHaveBeenCalledWith('creators');
      expect(mockUpdate).toHaveBeenCalledWith({ profile_views: 151 });
    });
  });

  describe('transform database data to UI config', () => {
    it('transforms stats including favorite_count', () => {
      const creator = creatorDbData.creators;

      const stats = {
        rating: parseFloat(creator.rating) || 4.8,
        reviews: creator.reviews_count || 0,
        verifiedMeetups: creator.verified_meetups || 0,
        meetupSuccessRate: parseFloat(creator.meetup_success_rate) || 98,
        profileViews: creator.profile_views || 0,
        favoriteCount: creator.favorite_count || 0,
      };

      expect(stats.rating).toBe(4.9);
      expect(stats.reviews).toBe(45);
      expect(stats.verifiedMeetups).toBe(30);
      expect(stats.favoriteCount).toBe(12);
      expect(stats.profileViews).toBe(150);
    });

    it('transforms profile data', () => {
      const profile = {
        name: creatorDbData.name,
        username: creatorDbData.username,
        tagline: creatorDbData.creators.tagline,
        bio: creatorDbData.creators.bio,
        isVerified: creatorDbData.creators.is_verified || creatorDbData.creators.is_video_verified,
        isStudioVerified: creatorDbData.creators.is_studio_verified,
        location: creatorDbData.creators.location,
        areas: creatorDbData.creators.creator_areas.map(a => a.area),
      };

      expect(profile.name).toBe('Angel');
      expect(profile.isVerified).toBe(true);
      expect(profile.areas).toEqual(['Victoria Island', 'Lekki']);
    });

    it('transforms photos with preview and locked separation', () => {
      const photos = creatorDbData.creators.creator_photos;
      const previewPhotos = photos.filter(p => p.is_preview);
      const lockedPhotos = photos.filter(p => !p.is_preview);

      expect(previewPhotos).toHaveLength(1);
      expect(lockedPhotos).toHaveLength(1);
      expect(previewPhotos[0].storage_path).toBe('photos/angel1.jpg');
    });

    it('transforms extras with correct pricing', () => {
      const extras = creatorDbData.creators.creator_extras.map(e => ({
        id: e.id,
        name: e.name,
        price: parseFloat(e.price),
      }));

      expect(extras).toHaveLength(2);
      expect(extras[0].name).toBe('Dinner');
      expect(extras[0].price).toBe(10000);
    });

    it('transforms boundaries', () => {
      const boundaries = creatorDbData.creators.creator_boundaries.map(b => b.boundary);
      expect(boundaries).toEqual(['No overnight on first meetup']);
    });

    it('handles missing optional data gracefully', () => {
      const minimalCreator = {
        ...creatorDbData,
        creators: {
          ...creatorDbData.creators,
          creator_areas: undefined,
          creator_photos: undefined,
          creator_extras: undefined,
          creator_boundaries: undefined,
          favorite_count: undefined,
        },
      };

      const creator = minimalCreator.creators;
      const areas = creator.creator_areas?.map(a => a.area) || [];
      const photos = creator.creator_photos || [];
      const extras = creator.creator_extras?.map(e => ({ id: e.id, name: e.name, price: parseFloat(e.price) })) || [];
      const boundaries = creator.creator_boundaries?.map(b => b.boundary) || [];
      const favoriteCount = creator.favorite_count || 0;

      expect(areas).toEqual([]);
      expect(photos).toEqual([]);
      expect(extras).toEqual([]);
      expect(boundaries).toEqual([]);
      expect(favoriteCount).toBe(0);
    });
  });

  describe('creator profile updates', () => {
    it('updates creator profile fields', async () => {
      const updates = {
        tagline: 'Updated tagline',
        bio: 'Updated bio',
        location: 'Abuja',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...creatorDbData.creators, ...updates },
        error: null,
      });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) })),
      });

      const result = await creatorService.updateCreatorProfile('user-1', updates);
      expect(result.success).toBe(true);
    });

    it('updates pricing', async () => {
      const pricing = {
        unlockContact: 7000,
        unlockPhotos: 5000,
        meetupIncall: { 1: 60000, 2: 90000, overnight: 180000 },
        meetupOutcall: { 1: 70000, 2: 100000, overnight: 200000 },
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: { pricing }, error: null });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) })),
      });

      const result = await creatorService.updateCreatorPricing('user-1', pricing);
      expect(result.success).toBe(true);
    });

    it('updates schedule', async () => {
      const schedule = {
        monday: { active: true, start: '09:00', end: '21:00' },
        tuesday: { active: false, start: '10:00', end: '22:00' },
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: { schedule }, error: null });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) })),
      });

      const result = await creatorService.updateCreatorSchedule('user-1', schedule);
      expect(result.success).toBe(true);
    });

    it('toggles explore visibility', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_visible_in_explore: true },
        error: null,
      });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) })),
      });

      const result = await creatorService.toggleExploreVisibility('user-1', true);
      expect(result.success).toBe(true);
    });
  });

  describe('creator areas management', () => {
    it('replaces areas with new set', async () => {
      const deletedAreas = [];
      const insertedAreas = [];

      mockFrom.mockImplementation((table) => {
        if (table === 'creator_areas') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => {
                deletedAreas.push('deleted');
                return Promise.resolve({ error: null });
              }),
            })),
            insert: vi.fn((data) => {
              insertedAreas.push(...data);
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      });

      const result = await creatorService.updateCreatorAreas('user-1', ['Victoria Island', 'Lekki', 'Ikoyi']);
      expect(result.success).toBe(true);
      expect(insertedAreas).toHaveLength(3);
      expect(insertedAreas[2].area).toBe('Ikoyi');
    });
  });

  describe('creator extras management', () => {
    it('adds a new extra service', async () => {
      const newExtra = { id: 'e3', name: 'Shopping', price: 15000 };

      mockFrom.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: newExtra, error: null }),
          })),
        })),
      });

      const result = await creatorService.addCreatorExtra('user-1', 'Shopping', 15000);
      expect(result.success).toBe(true);
      expect(result.extra.name).toBe('Shopping');
    });

    it('removes an extra service', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const result = await creatorService.removeCreatorExtra('e1');
      expect(result.success).toBe(true);
    });
  });

  describe('creator photos flow', () => {
    it('uploads photo and creates database record', async () => {
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
      const storagePath = 'user-1/12345.jpg';
      const photoRecord = {
        id: 'p3',
        creator_id: 'user-1',
        storage_path: storagePath,
        is_preview: false,
        display_order: 2,
      };

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: storagePath },
          error: null,
        }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://storage.example.com/' + storagePath },
        })),
      });

      // uploadCreatorPhoto calls from('creator_photos') twice:
      // 1. select('id').eq('creator_id', ...) for count
      // 2. insert(...).select().single() for record
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'p1' }, { id: 'p2' }], error: null }),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: photoRecord, error: null }),
            })),
          })),
        };
      });

      const result = await storageService.uploadCreatorPhoto('user-1', file);
      expect(result.success).toBe(true);
      expect(result.photo.storage_path).toContain('user-1');
    });

    it('sets a photo as preview', async () => {
      const updatedPhoto = { id: 'p1', is_preview: true };

      // Chain: update → eq → select → single
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: updatedPhoto, error: null }),
            })),
          })),
        })),
      });

      const result = await storageService.setPhotoPreview('p1', true);
      expect(result.success).toBe(true);
    });

    it('deletes photo from storage and database', async () => {
      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        delete: vi.fn(() => ({ eq: mockEq })),
      });

      const result = await storageService.deleteCreatorPhoto('p1', 'photos/angel1.jpg');
      expect(result.success).toBe(true);
    });
  });

  describe('creator earnings query', () => {
    it('fetches total earnings for creator', async () => {
      const earnings = [
        { id: 'earn1', amount: 50000, type: 'meetup', created_at: '2026-01-20' },
        { id: 'earn2', amount: 5000, type: 'unlock_contact', created_at: '2026-01-22' },
        { id: 'earn3', amount: 3000, type: 'unlock_photos', created_at: '2026-01-25' },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: earnings, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await creatorService.getCreatorEarnings('user-1');
      expect(result.success).toBe(true);
      expect(result.earnings).toHaveLength(3);

      const total = result.earnings.reduce((sum, e) => sum + e.amount, 0);
      expect(total).toBe(58000);
    });
  });
});
