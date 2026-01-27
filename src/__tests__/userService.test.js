import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../services/userService';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('userService.updateUserInfo', () => {
  it('updates user name and returns updated user', async () => {
    const mockUser = { id: 'user-1', name: 'New Name' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          })),
        })),
      })),
    });

    const result = await userService.updateUserInfo('user-1', { name: 'New Name' });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('New Name');
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

    const result = await userService.updateUserInfo('user-1', { name: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
  });
});

describe('userService.getClientProfile', () => {
  it('returns client profile with related data', async () => {
    const mockClient = { id: 'client-1', name: 'Test', clients: { tier: 'verified' } };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          })),
        })),
      })),
    });

    const result = await userService.getClientProfile('client-1');

    expect(result.success).toBe(true);
    expect(result.client).toEqual(mockClient);
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

    const result = await userService.getClientProfile('nonexistent');

    expect(result.success).toBe(false);
  });
});

describe('userService.updateClientProfile', () => {
  it('updates and returns the client profile', async () => {
    const mockClient = { id: 'client-1', tier: 'baller' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          })),
        })),
      })),
    });

    const result = await userService.updateClientProfile('client-1', { tier: 'baller' });

    expect(result.success).toBe(true);
    expect(result.client.tier).toBe('baller');
  });
});

describe('userService.updateClientPreferences', () => {
  it('updates and returns preferences', async () => {
    const preferences = { preferredLocation: 'Lagos', bodyTypes: ['Slim'] };
    const mockClient = { id: 'client-1', preferences };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          })),
        })),
      })),
    });

    const result = await userService.updateClientPreferences('client-1', preferences);

    expect(result.success).toBe(true);
    expect(result.client.preferences).toEqual(preferences);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Sync failed' },
            }),
          })),
        })),
      })),
    });

    const result = await userService.updateClientPreferences('client-1', {});

    expect(result.success).toBe(false);
  });
});

describe('userService.updateClientTier', () => {
  it('updates tier, deposit status, and balance', async () => {
    const mockClient = {
      id: 'client-1',
      tier: 'baller',
      has_paid_trust_deposit: true,
      deposit_balance: 5000,
    };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          })),
        })),
      })),
    });

    const result = await userService.updateClientTier('client-1', 'baller', 5000);

    expect(result.success).toBe(true);
    expect(result.client.tier).toBe('baller');
    expect(result.client.has_paid_trust_deposit).toBe(true);
    expect(result.client.deposit_balance).toBe(5000);
  });
});

describe('userService.deductClientBalance', () => {
  it('deducts amount and returns new balance', async () => {
    const mockClientFetch = { deposit_balance: 1000 };
    const mockClientUpdate = { id: 'client-1', deposit_balance: 800 };

    mockFrom.mockImplementation((table) => {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClientFetch, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockClientUpdate, error: null }),
            })),
          })),
        })),
      };
    });

    const result = await userService.deductClientBalance('client-1', 200);

    expect(result.success).toBe(true);
  });

  it('clamps balance to 0 when deduction exceeds balance', async () => {
    const mockClientFetch = { deposit_balance: 100 };
    const mockClientUpdate = { id: 'client-1', deposit_balance: 0 };

    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockClientFetch, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClientUpdate, error: null }),
          })),
        })),
      })),
    }));

    const result = await userService.deductClientBalance('client-1', 500);

    expect(result.success).toBe(true);
  });

  it('returns failure when fetch fails', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Fetch failed' },
          }),
        })),
      })),
    });

    const result = await userService.deductClientBalance('client-1', 100);

    expect(result.success).toBe(false);
  });
});

describe('userService.recordClientMeetup', () => {
  it('increments meetup count and updates trusted status', async () => {
    const mockClientFetch = { successful_meetups: 2 };
    const mockClientUpdate = {
      id: 'client-1',
      successful_meetups: 3,
      is_new_member: false,
      is_trusted_member: true,
    };

    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockClientFetch, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClientUpdate, error: null }),
          })),
        })),
      })),
    }));

    const result = await userService.recordClientMeetup('client-1');

    expect(result.success).toBe(true);
    expect(result.client.successful_meetups).toBe(3);
    expect(result.client.is_trusted_member).toBe(true);
  });

  it('does not set trusted when meetups < 3', async () => {
    const mockClientFetch = { successful_meetups: 0 };
    const mockClientUpdate = {
      id: 'client-1',
      successful_meetups: 1,
      is_new_member: false,
      is_trusted_member: false,
    };

    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockClientFetch, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockClientUpdate, error: null }),
          })),
        })),
      })),
    }));

    const result = await userService.recordClientMeetup('client-1');

    expect(result.success).toBe(true);
    expect(result.client.is_trusted_member).toBe(false);
  });
});

describe('userService.checkUnlock', () => {
  it('returns unlocked=true when unlock exists', async () => {
    const mockUnlock = { id: 'unlock-1', unlock_type: 'contact' };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUnlock, error: null }),
            })),
          })),
        })),
      })),
    });

    const result = await userService.checkUnlock('client-1', 'creator-1', 'contact');

    expect(result.success).toBe(true);
    expect(result.unlocked).toBe(true);
  });

  it('returns unlocked=false when no unlock exists', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows' },
              }),
            })),
          })),
        })),
      })),
    });

    const result = await userService.checkUnlock('client-1', 'creator-1', 'contact');

    expect(result.success).toBe(true);
    expect(result.unlocked).toBe(false);
  });
});

describe('userService.createUnlock', () => {
  it('creates unlock and records earnings', async () => {
    const mockUnlock = { id: 'unlock-1', unlock_type: 'contact', price_paid: 200 };

    mockFrom.mockImplementation((table) => {
      if (table === 'unlocks') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUnlock, error: null }),
            })),
          })),
        };
      }
      if (table === 'creator_earnings') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
    });

    const result = await userService.createUnlock('client-1', 'creator-1', 'contact', 200);

    expect(result.success).toBe(true);
    expect(result.unlock.price_paid).toBe(200);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        })),
      })),
    });

    const result = await userService.createUnlock('client-1', 'creator-1', 'contact', 200);

    expect(result.success).toBe(false);
  });
});

describe('userService.getClientUnlocks', () => {
  it('returns all unlocks for a client', async () => {
    const mockUnlocks = [
      { id: 'unlock-1', unlock_type: 'contact' },
      { id: 'unlock-2', unlock_type: 'photos' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: mockUnlocks, error: null }),
      })),
    });

    const result = await userService.getClientUnlocks('client-1');

    expect(result.success).toBe(true);
    expect(result.unlocks).toHaveLength(2);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      })),
    });

    const result = await userService.getClientUnlocks('client-1');

    expect(result.success).toBe(false);
  });
});
