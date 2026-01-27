import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authService';

// Mock supabase
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ single: mockSingle, select: mockSelect, eq: mockEq }));
const mockIn = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
}));
const mockInvoke = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    functions: {
      invoke: (...args) => mockInvoke(...args),
    },
    auth: {
      signOut: (...args) => mockSignOut(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.requestOTP', () => {
  it('calls the send-whatsapp-otp edge function with the phone number', async () => {
    mockInvoke.mockResolvedValue({ data: { message: 'OTP sent' }, error: null });

    const result = await authService.requestOTP('+2341234567890');

    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp-otp', {
      body: { phone: '+2341234567890' },
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: 'OTP sent' });
  });

  it('returns failure when edge function returns an error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Network error') });

    const result = await authService.requestOTP('+2341234567890');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('authService.verifyOTP', () => {
  it('returns invalid when OTP is wrong', async () => {
    mockInvoke.mockResolvedValue({ data: { valid: false }, error: null });

    const result = await authService.verifyOTP('+2341234567890', '000000');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid or expired code');
  });

  it('returns success with existing user data when OTP is valid', async () => {
    const existingUser = { id: 'user-1', phone: '+2341234567890', name: 'Test' };
    mockInvoke.mockResolvedValue({ data: { valid: true, token: 'jwt-token' }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: existingUser, error: null }),
        })),
      })),
    });

    const result = await authService.verifyOTP('+2341234567890', '123456');

    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(false);
    expect(result.user).toEqual(existingUser);
    expect(result.token).toBe('jwt-token');
  });

  it('returns success with isNewUser=true when user does not exist', async () => {
    mockInvoke.mockResolvedValue({ data: { valid: true, token: 'jwt-token' }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        })),
      })),
    });

    const result = await authService.verifyOTP('+2341234567890', '123456');

    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(true);
    expect(result.user).toBeNull();
  });

  it('returns failure on edge function error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Server error') });

    const result = await authService.verifyOTP('+2341234567890', '123456');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server error');
  });
});

describe('authService.registerClient', () => {
  it('creates a user and client profile with preferences', async () => {
    const mockUser = { id: 'user-1', phone: '+234', username: 'testuser', name: 'Test' };
    const mockClient = { id: 'user-1', preferences: { preferredLocation: 'Lagos' } };

    // First call: from('users').insert().select().single()
    // Second call: from('clients').insert().select().single()
    let callCount = 0;
    mockFrom.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        };
      }
      if (table === 'clients') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
            })),
          })),
        };
      }
    });

    const result = await authService.registerClient({
      phone: '+234',
      username: 'testuser',
      name: 'Test',
      preferences: { preferredLocation: 'Lagos' },
    });

    expect(result.success).toBe(true);
    expect(result.user.id).toBe('user-1');
    expect(result.user.clients).toEqual(mockClient);
  });

  it('returns failure when user insert fails', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Duplicate phone' },
          }),
        })),
      })),
    });

    const result = await authService.registerClient({
      phone: '+234',
      username: 'testuser',
      name: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Duplicate phone');
  });
});

describe('authService.registerCreator', () => {
  it('creates a user, creator profile, and service areas', async () => {
    const mockUser = { id: 'creator-1', phone: '+234', username: 'creator', name: 'Creator' };
    const mockCreator = { id: 'creator-1', location: 'Lagos' };

    mockFrom.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        };
      }
      if (table === 'creators') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
            })),
          })),
        };
      }
      if (table === 'creator_areas') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
    });

    const result = await authService.registerCreator({
      phone: '+234',
      username: 'creator',
      name: 'Creator',
      location: 'Lagos',
      areas: ['Lekki', 'VI'],
      tagline: 'Hi',
      bio: 'About me',
    });

    expect(result.success).toBe(true);
    expect(result.user.id).toBe('creator-1');
    expect(result.user.areas).toEqual(['Lekki', 'VI']);
  });
});

describe('authService.getCurrentUser', () => {
  it('returns user with related data', async () => {
    const mockUser = { id: 'user-1', name: 'Test', clients: {} };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    const result = await authService.getCurrentUser('user-1');

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        })),
      })),
    });

    const result = await authService.getCurrentUser('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('authService.updateLastSeen', () => {
  it('updates the last_seen_at timestamp', async () => {
    const mockUpdateFn = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    mockFrom.mockReturnValue({ update: mockUpdateFn });

    const result = await authService.updateLastSeen('user-1');

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('users');
  });
});

describe('authService.getUserByPhone', () => {
  it('returns exists=false when user not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows' },
          }),
        })),
      })),
    });

    const result = await authService.getUserByPhone('+234');

    expect(result.success).toBe(true);
    expect(result.exists).toBe(false);
    expect(result.user).toBeNull();
  });

  it('returns user when found', async () => {
    const mockUser = { id: 'user-1', phone: '+234' };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    const result = await authService.getUserByPhone('+234');

    expect(result.success).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.user).toEqual(mockUser);
  });
});

describe('authService.checkUsernameAvailable', () => {
  it('returns available=true when username not taken', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows' },
          }),
        })),
      })),
    });

    const result = await authService.checkUsernameAvailable('newuser');

    expect(result.success).toBe(true);
    expect(result.available).toBe(true);
  });

  it('returns available=false when username is taken', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null }),
        })),
      })),
    });

    const result = await authService.checkUsernameAvailable('existinguser');

    expect(result.success).toBe(true);
    expect(result.available).toBe(false);
  });
});

describe('authService.signOut', () => {
  it('returns success on successful sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await authService.signOut();

    expect(result.success).toBe(true);
  });

  it('returns failure on error', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

    const result = await authService.signOut();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Sign out failed');
  });
});
