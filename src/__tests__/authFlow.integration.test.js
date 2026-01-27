import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock variables so they're available when vi.mock factory runs
const { mockFrom, mockFunctions, mockAuth } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFunctions: { invoke: vi.fn() },
  mockAuth: { signOut: vi.fn() },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    functions: mockFunctions,
    auth: mockAuth,
  },
}));

import { authService } from '../services/authService';
import { userService } from '../services/userService';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Auth Flow Integration', () => {
  describe('full registration flow: OTP → verify → register client', () => {
    it('completes client registration end-to-end', async () => {
      const phone = '+2348012345678';

      // Step 1: Request OTP
      mockFunctions.invoke.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const otpResult = await authService.requestOTP(phone);
      expect(otpResult.success).toBe(true);
      expect(mockFunctions.invoke).toHaveBeenCalledWith('send-whatsapp-otp', {
        body: { phone },
      });

      // Step 2: Verify OTP — calls functions.invoke then from('users')
      mockFunctions.invoke.mockResolvedValueOnce({
        data: { valid: true, token: 'jwt-token-123' },
        error: null,
      });
      // The verifyOTP also queries users table to check if user exists
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'no rows' },
            }),
          })),
        })),
      });

      const verifyResult = await authService.verifyOTP(phone, '123456');
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isNewUser).toBe(true);
      expect(verifyResult.token).toBe('jwt-token-123');

      // Step 3: Register as client — insert into users then clients
      const mockUser = {
        id: 'user-1',
        phone,
        username: 'testclient',
        name: 'Test Client',
        user_type: 'client',
      };
      const mockClient = {
        id: 'user-1',
        is_new_member: true,
        has_paid_trust_deposit: false,
        tier: null,
        deposit_balance: 0,
      };

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
        return {};
      });

      const registerResult = await authService.registerClient({
        phone,
        username: 'testclient',
        name: 'Test Client',
      });

      expect(registerResult.success).toBe(true);
      expect(registerResult.user.username).toBe('testclient');
      expect(registerResult.user.clients).toBeDefined();
    });
  });

  describe('returning user login flow', () => {
    it('verifies OTP and loads existing user data', async () => {
      const phone = '+2348012345678';
      const existingUser = {
        id: 'user-1',
        phone,
        username: 'existingclient',
        name: 'Existing Client',
        user_type: 'client',
        clients: {
          is_new_member: false,
          has_paid_trust_deposit: true,
          tier: 'verified',
          deposit_balance: 50000,
          successful_meetups: 5,
        },
      };

      // verifyOTP: functions.invoke → from('users').select().eq().single()
      mockFunctions.invoke.mockResolvedValueOnce({
        data: { valid: true, token: 'jwt-token-456' },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: existingUser, error: null }),
          })),
        })),
      });

      const verifyResult = await authService.verifyOTP(phone, '654321');
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isNewUser).toBe(false);
      expect(verifyResult.user.username).toBe('existingclient');
    });
  });

  describe('session persistence flow', () => {
    it('getCurrentUser loads full user with related data', async () => {
      const fullUser = {
        id: 'user-1',
        phone: '+2348012345678',
        username: 'testclient',
        name: 'Test Client',
        user_type: 'client',
        clients: {
          is_new_member: false,
          has_paid_trust_deposit: true,
          tier: 'verified',
          deposit_balance: 25000,
          successful_meetups: 3,
        },
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: fullUser, error: null }),
          })),
        })),
      });

      const result = await authService.getCurrentUser('user-1');
      expect(result.success).toBe(true);
      expect(result.user.clients.tier).toBe('verified');
      expect(result.user.clients.deposit_balance).toBe(25000);
    });
  });

  describe('client tier upgrade flow', () => {
    it('updates tier and balance after trust deposit', async () => {
      const updatedClient = {
        id: 'user-1',
        deposit_balance: 50000,
        tier: 'verified',
        has_paid_trust_deposit: true,
      };

      // updateClientTier chain: update → eq → select → single
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: updatedClient, error: null }),
            })),
          })),
        })),
      });

      const result = await userService.updateClientTier('user-1', 'verified', 50000);
      expect(result.success).toBe(true);
      expect(result.client.tier).toBe('verified');
      expect(result.client.deposit_balance).toBe(50000);
    });
  });

  describe('logout flow', () => {
    it('clears auth state on sign out', async () => {
      localStorage.setItem('hush_auth', JSON.stringify({ id: 'user-1' }));
      localStorage.setItem('hush_token', 'some-token');

      // signOut uses supabase.auth.signOut()
      mockAuth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();
      expect(result.success).toBe(true);
      expect(mockAuth.signOut).toHaveBeenCalled();
    });
  });
});
