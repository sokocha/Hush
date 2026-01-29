import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../services/adminService';

// --- Supabase mock wiring ---------------------------------------------------
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, in: mockIn, eq: mockEq }));
const mockEq = vi.fn(() => ({ single: mockSingle, select: mockSelect }));
const mockIn = vi.fn(() => ({ single: mockSingle }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  eq: mockEq,
  in: mockIn,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCreator = (overrides = {}) => ({
  id: 'c1',
  verification_status: 'pending',
  dispute_message: null,
  verification_call_scheduled_at: null,
  ...overrides,
});

/**
 * Wire mockFrom so that fetchAllCreators returns the given creators list
 * together with associated users / areas / photos maps.
 */
function stubFetchAllCreators(creators, { users = [], areas = [], photos = [] } = {}) {
  mockFrom.mockImplementation((table) => {
    if (table === 'creators') {
      return {
        select: vi.fn().mockResolvedValue({ data: creators, error: null }),
      };
    }
    if (table === 'users') {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: users, error: null }),
        })),
      };
    }
    if (table === 'creator_areas') {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: areas, error: null }),
        })),
      };
    }
    if (table === 'creator_photos') {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: photos, error: null }),
        })),
      };
    }
  });
}

// ---------------------------------------------------------------------------
// getVerificationQueue
// ---------------------------------------------------------------------------

describe('adminService.getVerificationQueue', () => {
  it('returns all creators when status is "all"', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'pending' }),
      makeCreator({ id: 'c2', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('all');

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(2);
  });

  it('filters by pending status (default)', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'pending' }),
      makeCreator({ id: 'c2', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue();

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(1);
    expect(result.creators[0].id).toBe('c1');
  });

  it('treats null verification_status as pending', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: null }),
      makeCreator({ id: 'c2', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('pending');

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(1);
    expect(result.creators[0].id).toBe('c1');
  });

  it('filters by approved status', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'pending' }),
      makeCreator({ id: 'c2', verification_status: 'approved' }),
      makeCreator({ id: 'c3', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('approved');

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(2);
    expect(result.creators.every(c => c.verification_status === 'approved')).toBe(true);
  });

  it('filters by denied status', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'denied' }),
      makeCreator({ id: 'c2', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('denied');

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(1);
    expect(result.creators[0].id).toBe('c1');
  });

  it('filters disputed creators (denied + dispute_message)', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'denied', dispute_message: 'I disagree' }),
      makeCreator({ id: 'c2', verification_status: 'denied', dispute_message: null }),
      makeCreator({ id: 'c3', verification_status: 'approved' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('disputed');

    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(1);
    expect(result.creators[0].id).toBe('c1');
  });

  it('sorts scheduled creators by call time ascending', async () => {
    const creators = [
      makeCreator({ id: 'c1', verification_status: 'scheduled', verification_call_scheduled_at: '2025-03-15T14:00:00Z' }),
      makeCreator({ id: 'c2', verification_status: 'scheduled', verification_call_scheduled_at: '2025-03-10T10:00:00Z' }),
      makeCreator({ id: 'c3', verification_status: 'scheduled', verification_call_scheduled_at: '2025-03-20T08:00:00Z' }),
    ];
    stubFetchAllCreators(creators);

    const result = await adminService.getVerificationQueue('scheduled');

    expect(result.success).toBe(true);
    expect(result.creators.map(c => c.id)).toEqual(['c2', 'c1', 'c3']);
  });

  it('returns empty array when no creators exist', async () => {
    stubFetchAllCreators([]);

    const result = await adminService.getVerificationQueue('pending');

    expect(result.success).toBe(true);
    expect(result.creators).toEqual([]);
  });

  it('returns failure when fetchAllCreators throws', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } }),
    }));

    const result = await adminService.getVerificationQueue();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.creators).toEqual([]);
  });

  it('merges related user, area, and photo data into creators', async () => {
    const creators = [makeCreator({ id: 'c1', verification_status: 'pending' })];
    const users = [{ id: 'c1', name: 'Ada', username: 'ada', phone: '+234', created_at: '2025-01-01' }];
    const areas = [{ creator_id: 'c1', area: 'Lekki' }, { creator_id: 'c1', area: 'VI' }];
    const photos = [
      { id: 'p1', creator_id: 'c1', storage_path: '/a.jpg', is_preview: true, display_order: 2 },
      { id: 'p2', creator_id: 'c1', storage_path: '/b.jpg', is_preview: false, display_order: 1 },
    ];
    stubFetchAllCreators(creators, { users, areas, photos });

    const result = await adminService.getVerificationQueue('all');

    expect(result.success).toBe(true);
    const c = result.creators[0];
    expect(c.users).toEqual(users[0]);
    expect(c.creator_areas).toEqual([{ area: 'Lekki' }, { area: 'VI' }]);
    // Photos should be sorted by display_order
    expect(c.creator_photos[0].id).toBe('p2');
    expect(c.creator_photos[1].id).toBe('p1');
  });

  it('handles batch fetch failure gracefully (non-fatal)', async () => {
    // creators query succeeds but the Promise.all for related data rejects
    let callCount = 0;
    mockFrom.mockImplementation((table) => {
      if (table === 'creators') {
        return { select: vi.fn().mockResolvedValue({ data: [makeCreator({ id: 'c1' })], error: null }) };
      }
      // All related queries reject
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockRejectedValue(new Error('timeout')),
        })),
      };
    });

    const result = await adminService.getVerificationQueue('all');

    // Should still return the creator, just without related data
    expect(result.success).toBe(true);
    expect(result.creators).toHaveLength(1);
    expect(result.creators[0].users).toBeNull();
    expect(result.creators[0].creator_areas).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getCreatorDetail
// ---------------------------------------------------------------------------

describe('adminService.getCreatorDetail', () => {
  it('returns full creator details with all related data', async () => {
    const creator = makeCreator({ id: 'c1' });
    const user = { id: 'c1', name: 'Ada', username: 'ada', phone: '+234', created_at: '2025-01-01', last_seen_at: '2025-03-01' };
    const areas = [{ area: 'Lekki' }];
    const photos = [{ id: 'p1', storage_path: '/a.jpg', is_preview: true, display_order: 1, captured_at: null }];
    const extras = [{ id: 'e1', name: 'Duo', price: 50000 }];
    const boundaries = [{ boundary: 'No overnight' }];

    mockFrom.mockImplementation((table) => {
      if (table === 'creators') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: creator, error: null }),
            })),
          })),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: user, error: null }),
            })),
          })),
        };
      }
      if (table === 'creator_areas') {
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: areas, error: null }) })) };
      }
      if (table === 'creator_photos') {
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: photos, error: null }) })) };
      }
      if (table === 'creator_extras') {
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: extras, error: null }) })) };
      }
      if (table === 'creator_boundaries') {
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: boundaries, error: null }) })) };
      }
    });

    const result = await adminService.getCreatorDetail('c1');

    expect(result.success).toBe(true);
    expect(result.creator.users).toEqual(user);
    expect(result.creator.creator_areas).toEqual([{ area: 'Lekki' }]);
    expect(result.creator.creator_photos).toEqual(photos);
    expect(result.creator.creator_extras).toEqual(extras);
    expect(result.creator.creator_boundaries).toEqual(boundaries);
  });

  it('returns failure when creator is not found', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        })),
      })),
    }));

    const result = await adminService.getCreatorDetail('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// approveCreator
// ---------------------------------------------------------------------------

describe('adminService.approveCreator', () => {
  it('updates creator with approved status and visibility flags', async () => {
    const approved = makeCreator({ id: 'c1', verification_status: 'approved', is_verified: true });
    const mockUpdateFn = vi.fn();
    const mockEqFn = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: approved, error: null }) })) }));
    mockUpdateFn.mockReturnValue({ eq: mockEqFn });

    mockFrom.mockReturnValue({ update: mockUpdateFn });

    const result = await adminService.approveCreator('c1', 'Looks good');

    expect(result.success).toBe(true);
    expect(result.creator).toEqual(approved);
    expect(mockFrom).toHaveBeenCalledWith('creators');
    expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
      verification_status: 'approved',
      is_verified: true,
      is_video_verified: true,
      pending_verification: false,
      is_visible_in_explore: true,
      verification_notes: 'Looks good',
      verification_denied_reason: null,
      dispute_message: null,
      dispute_submitted_at: null,
    }));
  });

  it('passes null for notes when not provided', async () => {
    const approved = makeCreator({ id: 'c1', verification_status: 'approved' });
    const mockUpdateFn = vi.fn(() => ({
      eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: approved, error: null }) })) })),
    }));
    mockFrom.mockReturnValue({ update: mockUpdateFn });

    await adminService.approveCreator('c1');

    expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
      verification_notes: null,
    }));
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          })),
        })),
      })),
    });

    const result = await adminService.approveCreator('c1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

// ---------------------------------------------------------------------------
// denyCreator
// ---------------------------------------------------------------------------

describe('adminService.denyCreator', () => {
  it('updates creator with denied status and reason', async () => {
    const denied = makeCreator({ id: 'c1', verification_status: 'denied' });
    const mockUpdateFn = vi.fn(() => ({
      eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: denied, error: null }) })) })),
    }));
    mockFrom.mockReturnValue({ update: mockUpdateFn });

    const result = await adminService.denyCreator('c1', 'Blurry photos');

    expect(result.success).toBe(true);
    expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
      verification_status: 'denied',
      is_verified: false,
      is_video_verified: false,
      pending_verification: false,
      is_visible_in_explore: false,
      verification_denied_reason: 'Blurry photos',
      dispute_message: null,
      dispute_submitted_at: null,
    }));
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Oops' } }),
          })),
        })),
      })),
    });

    const result = await adminService.denyCreator('c1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Oops');
  });
});

// ---------------------------------------------------------------------------
// rescheduleCreator
// ---------------------------------------------------------------------------

describe('adminService.rescheduleCreator', () => {
  it('updates creator to scheduled status with call time', async () => {
    const scheduled = makeCreator({ id: 'c1', verification_status: 'scheduled' });
    const mockUpdateFn = vi.fn(() => ({
      eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: scheduled, error: null }) })) })),
    }));
    mockFrom.mockReturnValue({ update: mockUpdateFn });

    const callTime = '2025-04-01T10:00:00Z';
    const result = await adminService.rescheduleCreator('c1', callTime);

    expect(result.success).toBe(true);
    expect(mockUpdateFn).toHaveBeenCalledWith({
      verification_status: 'scheduled',
      verification_call_scheduled_at: callTime,
      verification_denied_reason: null,
    });
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
          })),
        })),
      })),
    });

    const result = await adminService.rescheduleCreator('c1', '2025-04-01T10:00:00Z');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error');
  });
});

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

describe('adminService.getDashboardStats', () => {
  it('calculates correct counts for each status', async () => {
    const data = [
      { verification_status: 'pending', dispute_message: null },
      { verification_status: 'pending', dispute_message: null },
      { verification_status: 'approved', dispute_message: null },
      { verification_status: 'scheduled', dispute_message: null },
      { verification_status: 'denied', dispute_message: null },
      { verification_status: 'denied', dispute_message: 'I dispute this' },
      { verification_status: 'under_review', dispute_message: null },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data, error: null }),
    });

    const result = await adminService.getDashboardStats();

    expect(result.success).toBe(true);
    expect(result.stats).toEqual({
      pending: 2,
      scheduled: 1,
      under_review: 1,
      approved: 1,
      denied: 2,
      disputed: 1,
    });
  });

  it('treats null verification_status as pending', async () => {
    const data = [
      { verification_status: null, dispute_message: null },
      { verification_status: null, dispute_message: null },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data, error: null }),
    });

    const result = await adminService.getDashboardStats();

    expect(result.success).toBe(true);
    expect(result.stats.pending).toBe(2);
  });

  it('returns zero counts when no creators exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await adminService.getDashboardStats();

    expect(result.success).toBe(true);
    expect(result.stats).toEqual({
      pending: 0,
      scheduled: 0,
      under_review: 0,
      approved: 0,
      denied: 0,
      disputed: 0,
    });
  });

  it('handles null data gracefully', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const result = await adminService.getDashboardStats();

    expect(result.success).toBe(true);
    expect(result.stats.pending).toBe(0);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
    });

    const result = await adminService.getDashboardStats();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Query failed');
  });
});
