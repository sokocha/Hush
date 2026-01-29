import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bookingService
const mockCreateBooking = vi.fn();
vi.mock('../services/bookingService', () => ({
  bookingService: {
    createBooking: (...args) => mockCreateBooking(...args),
  },
}));

// We test the addMeetupBooking logic directly (extracted from AuthContext)
// since testing React context hooks requires complex setup.
// The logic is extracted here for unit testing.

function createAddMeetupBooking(user, setUser) {
  return async (meetupData) => {
    if (!user?.id || user.userType !== 'client') return;

    // If no creatorId, this is a mock creator - store locally only
    if (!meetupData.creatorId) {
      const localBooking = {
        id: `local-${Date.now()}`,
        ...meetupData,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setUser((prev) => ({
        ...prev,
        meetups: [...(prev.meetups || []), localBooking],
      }));
      return { success: true, booking: localBooking };
    }

    // For real database creators, save to database
    const { bookingService } = await import('../services/bookingService');
    const result = await bookingService.createBooking({
      clientId: user.id,
      ...meetupData,
    });

    if (result.success) {
      setUser((prev) => ({
        ...prev,
        meetups: [...(prev.meetups || []), result.booking],
      }));
    } else {
      // Database insert failed - save locally as fallback
      const localBooking = {
        id: `local-${Date.now()}`,
        ...meetupData,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setUser((prev) => ({
        ...prev,
        meetups: [...(prev.meetups || []), localBooking],
      }));
      return { success: true, booking: localBooking, dbFailed: true };
    }
    return result;
  };
}

describe('addMeetupBooking', () => {
  let mockUser;
  let mockSetUser;
  let updatedState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'client-123', userType: 'client', meetups: [] };
    updatedState = null;
    mockSetUser = vi.fn((updater) => {
      updatedState = updater(mockUser);
    });
  });

  it('returns early when user is not a client', async () => {
    const creatorUser = { id: 'creator-1', userType: 'creator' };
    const fn = createAddMeetupBooking(creatorUser, mockSetUser);

    const result = await fn({ creatorId: 'c1', date: '2026-02-01' });

    expect(result).toBeUndefined();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('returns early when user.id is missing', async () => {
    const fn = createAddMeetupBooking({ userType: 'client' }, mockSetUser);

    const result = await fn({ creatorId: 'c1' });

    expect(result).toBeUndefined();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('stores locally when no creatorId (mock creator)', async () => {
    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    const result = await fn({
      creatorName: 'Mock Model',
      date: '2026-02-01',
      time: '14:00',
      totalPrice: 5000,
    });

    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('pending');
    expect(result.booking.id).toMatch(/^local-/);
    expect(result.booking.creatorName).toBe('Mock Model');
    expect(result.booking.totalPrice).toBe(5000);
    expect(mockCreateBooking).not.toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(updatedState.meetups).toHaveLength(1);
  });

  it('saves to database when creatorId is present and DB succeeds', async () => {
    const dbBooking = {
      id: 'db-booking-1',
      client_id: 'client-123',
      creator_id: 'creator-1',
      status: 'pending',
      total_price: 50000,
    };
    mockCreateBooking.mockResolvedValue({ success: true, booking: dbBooking });

    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    const result = await fn({
      creatorId: 'creator-1',
      creatorName: 'Real Creator',
      date: '2026-02-01',
      time: '14:00',
      totalPrice: 50000,
    });

    expect(result.success).toBe(true);
    expect(result.booking).toEqual(dbBooking);
    expect(result.dbFailed).toBeUndefined();
    expect(mockCreateBooking).toHaveBeenCalledWith({
      clientId: 'client-123',
      creatorId: 'creator-1',
      creatorName: 'Real Creator',
      date: '2026-02-01',
      time: '14:00',
      totalPrice: 50000,
    });
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(updatedState.meetups).toHaveLength(1);
    expect(updatedState.meetups[0]).toEqual(dbBooking);
  });

  it('falls back to local storage when DB insert fails', async () => {
    mockCreateBooking.mockResolvedValue({ success: false, error: 'RLS policy violation' });

    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    const result = await fn({
      creatorId: 'creator-1',
      creatorName: 'Real Creator',
      date: '2026-02-01',
      time: '14:00',
      totalPrice: 50000,
    });

    expect(result.success).toBe(true); // Still returns success
    expect(result.dbFailed).toBe(true); // But flags DB failure
    expect(result.booking.id).toMatch(/^local-/);
    expect(result.booking.status).toBe('pending');
    expect(result.booking.creatorName).toBe('Real Creator');
    expect(result.booking.totalPrice).toBe(50000);
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(updatedState.meetups).toHaveLength(1);
  });

  it('preserves existing meetups when adding a new one', async () => {
    mockUser.meetups = [{ id: 'existing-1', status: 'confirmed' }];
    mockCreateBooking.mockResolvedValue({
      success: true,
      booking: { id: 'new-1', status: 'pending' },
    });

    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    await fn({ creatorId: 'c1', date: '2026-02-01', totalPrice: 100 });

    expect(updatedState.meetups).toHaveLength(2);
    expect(updatedState.meetups[0].id).toBe('existing-1');
    expect(updatedState.meetups[1].id).toBe('new-1');
  });

  it('handles undefined meetups array in user state', async () => {
    mockUser.meetups = undefined;
    mockCreateBooking.mockResolvedValue({
      success: true,
      booking: { id: 'first-1', status: 'pending' },
    });

    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    await fn({ creatorId: 'c1', date: '2026-02-01', totalPrice: 100 });

    expect(updatedState.meetups).toHaveLength(1);
  });

  it('local fallback booking has correct timestamp fields', async () => {
    const before = new Date().toISOString();
    const fn = createAddMeetupBooking(mockUser, mockSetUser);

    await fn({ creatorName: 'Test', date: '2026-02-01', totalPrice: 100 });
    const after = new Date().toISOString();

    const booking = updatedState.meetups[0];
    expect(booking.created_at).toBeDefined();
    expect(booking.created_at >= before).toBe(true);
    expect(booking.created_at <= after).toBe(true);
  });
});
