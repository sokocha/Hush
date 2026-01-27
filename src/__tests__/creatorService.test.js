import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creatorService } from '../services/creatorService';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('creatorService.getCreatorProfile', () => {
  it('returns creator profile with related data', async () => {
    const mockCreator = { id: 'creator-1', name: 'Test', creators: { location: 'Lagos' } };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.getCreatorProfile('creator-1');

    expect(result.success).toBe(true);
    expect(result.creator).toEqual(mockCreator);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          })),
        })),
      })),
    });

    const result = await creatorService.getCreatorProfile('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('creatorService.getCreatorByUsername', () => {
  it('returns creator and increments profile views', async () => {
    const mockCreator = {
      id: 'creator-1',
      username: 'testcreator',
      creators: { profile_views: 5 },
    };

    // First call: from('users') for the main query
    // Second call: from('creators') for the view increment
    let callIndex = 0;
    mockFrom.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
              })),
            })),
          })),
        };
      }
      if (table === 'creators') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
    });

    const result = await creatorService.getCreatorByUsername('testcreator');

    expect(result.success).toBe(true);
    expect(result.creator.username).toBe('testcreator');
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          })),
        })),
      })),
    });

    const result = await creatorService.getCreatorByUsername('nonexistent');

    expect(result.success).toBe(false);
  });
});

describe('creatorService.getExploreCreators', () => {
  it('returns visible creators without filters', async () => {
    const mockCreators = [{ id: '1' }, { id: '2' }];
    const mockEq = vi.fn().mockResolvedValue({ data: mockCreators, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: mockEq,
      })),
    });

    const result = await creatorService.getExploreCreators();

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(2);
  });

  it('applies location filter', async () => {
    const mockCreators = [{ id: '1', location: 'Lagos' }];
    const mockIlike = vi.fn().mockResolvedValue({ data: mockCreators, error: null });
    const mockEq = vi.fn(() => ({ ilike: mockIlike }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getExploreCreators({ location: 'Lagos' });

    expect(result.success).toBe(true);
  });

  it('applies verified filter', async () => {
    const mockCreators = [{ id: '1', is_verified: true }];
    const mockEq2 = vi.fn().mockResolvedValue({ data: mockCreators, error: null });
    const mockEq = vi.fn(() => ({ eq: mockEq2 }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getExploreCreators({ verified: true });

    expect(result.success).toBe(true);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })),
    });

    const result = await creatorService.getExploreCreators();

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

describe('creatorService.updateCreatorProfile', () => {
  it('updates and returns the creator profile', async () => {
    const mockCreator = { id: 'creator-1', tagline: 'Updated' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.updateCreatorProfile('creator-1', { tagline: 'Updated' });

    expect(result.success).toBe(true);
    expect(result.creator.tagline).toBe('Updated');
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          })),
        })),
      })),
    });

    const result = await creatorService.updateCreatorProfile('creator-1', {});

    expect(result.success).toBe(false);
  });
});

describe('creatorService.updateCreatorPricing', () => {
  it('updates pricing data', async () => {
    const pricing = { meetupIncall: [200, 300] };
    const mockCreator = { id: 'creator-1', pricing };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.updateCreatorPricing('creator-1', pricing);

    expect(result.success).toBe(true);
    expect(result.creator.pricing).toEqual(pricing);
  });
});

describe('creatorService.updateCreatorSchedule', () => {
  it('updates schedule data', async () => {
    const schedule = { monday: { start: '09:00', end: '17:00' } };
    const mockCreator = { id: 'creator-1', schedule };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.updateCreatorSchedule('creator-1', schedule);

    expect(result.success).toBe(true);
    expect(result.creator.schedule).toEqual(schedule);
  });
});

describe('creatorService.updateCreatorAreas', () => {
  it('deletes existing areas and inserts new ones', async () => {
    const mockDelete = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table) => {
      if (table === 'creator_areas') {
        return { delete: mockDelete, insert: mockInsert };
      }
    });

    const result = await creatorService.updateCreatorAreas('creator-1', ['Lekki', 'VI']);

    expect(result.success).toBe(true);
  });

  it('handles empty areas (just deletes)', async () => {
    const mockDelete = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    mockFrom.mockReturnValue({ delete: mockDelete });

    const result = await creatorService.updateCreatorAreas('creator-1', []);

    expect(result.success).toBe(true);
  });
});

describe('creatorService.addCreatorExtra', () => {
  it('adds an extra service and returns it', async () => {
    const mockExtra = { id: 'extra-1', name: 'VIP', price: 100 };
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockExtra, error: null }),
        })),
      })),
    });

    const result = await creatorService.addCreatorExtra('creator-1', 'VIP', 100);

    expect(result.success).toBe(true);
    expect(result.extra.name).toBe('VIP');
    expect(result.extra.price).toBe(100);
  });
});

describe('creatorService.removeCreatorExtra', () => {
  it('removes an extra service', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await creatorService.removeCreatorExtra('extra-1');

    expect(result.success).toBe(true);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      })),
    });

    const result = await creatorService.removeCreatorExtra('extra-1');

    expect(result.success).toBe(false);
  });
});

describe('creatorService.addCreatorBoundary', () => {
  it('adds a boundary and returns it', async () => {
    const mockBoundary = { id: 'boundary-1', boundary: 'No photography' };
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBoundary, error: null }),
        })),
      })),
    });

    const result = await creatorService.addCreatorBoundary('creator-1', 'No photography');

    expect(result.success).toBe(true);
    expect(result.boundary.boundary).toBe('No photography');
  });
});

describe('creatorService.removeCreatorBoundary', () => {
  it('removes a boundary', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await creatorService.removeCreatorBoundary('boundary-1');

    expect(result.success).toBe(true);
  });
});

describe('creatorService.addCreatorPhoto', () => {
  it('adds a photo record and returns it', async () => {
    const mockPhoto = {
      id: 'photo-1',
      storage_path: 'https://example.com/photo.jpg',
      is_preview: true,
    };
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockPhoto, error: null }),
        })),
      })),
    });

    const result = await creatorService.addCreatorPhoto('creator-1', {
      url: 'https://example.com/photo.jpg',
      isPreview: true,
      displayOrder: 0,
    });

    expect(result.success).toBe(true);
    expect(result.photo.is_preview).toBe(true);
  });
});

describe('creatorService.updateCreatorPhoto', () => {
  it('updates photo properties', async () => {
    const mockPhoto = { id: 'photo-1', is_preview: false, display_order: 2 };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockPhoto, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.updateCreatorPhoto('photo-1', {
      isPreview: false,
      displayOrder: 2,
    });

    expect(result.success).toBe(true);
  });
});

describe('creatorService.deleteCreatorPhoto', () => {
  it('deletes a photo record', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await creatorService.deleteCreatorPhoto('photo-1');

    expect(result.success).toBe(true);
  });
});

describe('creatorService.getCreatorPhotos', () => {
  it('returns photos ordered by display_order', async () => {
    const mockPhotos = [
      { id: '1', display_order: 0 },
      { id: '2', display_order: 1 },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPhotos, error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getCreatorPhotos('creator-1');

    expect(result.success).toBe(true);
    expect(result.photos).toHaveLength(2);
  });
});

describe('creatorService.getCreatorEarnings', () => {
  it('returns all earnings with total', async () => {
    const mockEarnings = [
      { amount: '100', type: 'meetup' },
      { amount: '50', type: 'unlock_contact' },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockEarnings, error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getCreatorEarnings('creator-1');

    expect(result.success).toBe(true);
    expect(result.total).toBe(150);
    expect(result.earnings).toHaveLength(2);
  });

  it('applies period filter for "today"', async () => {
    const mockEarnings = [{ amount: '100', type: 'meetup' }];
    const mockGte = vi.fn().mockResolvedValue({ data: mockEarnings, error: null });
    const mockOrder = vi.fn(() => ({ gte: mockGte }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getCreatorEarnings('creator-1', 'today');

    expect(result.success).toBe(true);
  });

  it('applies period filter for "week"', async () => {
    const mockEarnings = [{ amount: '200', type: 'meetup' }];
    const mockGte = vi.fn().mockResolvedValue({ data: mockEarnings, error: null });
    const mockOrder = vi.fn(() => ({ gte: mockGte }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getCreatorEarnings('creator-1', 'week');

    expect(result.success).toBe(true);
  });

  it('applies period filter for "month"', async () => {
    const mockEarnings = [{ amount: '500', type: 'meetup' }];
    const mockGte = vi.fn().mockResolvedValue({ data: mockEarnings, error: null });
    const mockOrder = vi.fn(() => ({ gte: mockGte }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await creatorService.getCreatorEarnings('creator-1', 'month');

    expect(result.success).toBe(true);
    expect(result.total).toBe(500);
  });
});

describe('creatorService.toggleExploreVisibility', () => {
  it('toggles visibility on', async () => {
    const mockCreator = { id: 'creator-1', is_visible_in_explore: true };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.toggleExploreVisibility('creator-1', true);

    expect(result.success).toBe(true);
    expect(result.creator.is_visible_in_explore).toBe(true);
  });

  it('toggles visibility off', async () => {
    const mockCreator = { id: 'creator-1', is_visible_in_explore: false };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
          })),
        })),
      })),
    });

    const result = await creatorService.toggleExploreVisibility('creator-1', false);

    expect(result.success).toBe(true);
    expect(result.creator.is_visible_in_explore).toBe(false);
  });
});
