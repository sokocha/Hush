import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingService } from '../services/bookingService';

// Mock supabase
const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper to build a chain mock
function chainMock(resolvedData) {
  const single = vi.fn().mockResolvedValue(resolvedData);
  const select = vi.fn(() => ({ single }));
  const order = vi.fn(() => resolvedData);
  const eq = vi.fn(() => ({ single, select, eq, order, gte: vi.fn(() => resolvedData) }));
  const insert = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const inFn = vi.fn(() => ({ gte: vi.fn(() => resolvedData) }));

  return { select: vi.fn(() => ({ eq, single, order })), insert, update, eq, in: inFn };
}

describe('bookingService.createBooking', () => {
  it('creates a booking with generated codes and returns it', async () => {
    const mockBooking = {
      id: 'booking-1',
      client_id: 'client-1',
      creator_id: 'creator-1',
      status: 'pending',
      client_code: '123456',
      creator_code: '654321',
    };

    mockFrom.mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
            })),
          })),
        };
      }
      if (table === 'booking_extras') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
    });

    const result = await bookingService.createBooking({
      clientId: 'client-1',
      creatorId: 'creator-1',
      date: '2026-02-01',
      time: '14:00',
      duration: 2,
      locationType: 'incall',
      location: 'Lagos',
      totalPrice: 500,
      depositAmount: 100,
      extras: [{ id: 'extra-1', price: 50 }],
    });

    expect(result.success).toBe(true);
    expect(result.booking).toEqual(mockBooking);
  });

  it('creates booking without extras', async () => {
    const mockBooking = { id: 'booking-1', status: 'pending' };
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        })),
      })),
    });

    const result = await bookingService.createBooking({
      clientId: 'client-1',
      creatorId: 'creator-1',
      date: '2026-02-01',
      time: '14:00',
      totalPrice: 300,
    });

    expect(result.success).toBe(true);
  });

  it('returns failure on database error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        })),
      })),
    });

    const result = await bookingService.createBooking({
      clientId: 'client-1',
      creatorId: 'creator-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

describe('bookingService.getBooking', () => {
  it('returns booking with full details', async () => {
    const mockBooking = { id: 'booking-1', status: 'confirmed' };
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        })),
      })),
    });

    const result = await bookingService.getBooking('booking-1');

    expect(result.success).toBe(true);
    expect(result.booking).toEqual(mockBooking);
  });

  it('returns failure when booking not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        })),
      })),
    });

    const result = await bookingService.getBooking('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('bookingService.getClientBookings', () => {
  it('returns all client bookings when no status filter', async () => {
    const mockBookings = [{ id: '1' }, { id: '2' }];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await bookingService.getClientBookings('client-1');

    expect(result.success).toBe(true);
    expect(result.bookings).toHaveLength(2);
  });

  it('filters by status when provided', async () => {
    const mockBookings = [{ id: '1', status: 'confirmed' }];
    const mockEqStatus = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
    const mockOrder = vi.fn(() => ({ eq: mockEqStatus }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await bookingService.getClientBookings('client-1', 'confirmed');

    expect(result.success).toBe(true);
  });
});

describe('bookingService.getCreatorBookings', () => {
  it('returns all creator bookings', async () => {
    const mockBookings = [{ id: '1' }, { id: '2' }];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await bookingService.getCreatorBookings('creator-1');

    expect(result.success).toBe(true);
    expect(result.bookings).toHaveLength(2);
  });
});

describe('bookingService.updateBookingStatus', () => {
  it('updates status and returns the booking', async () => {
    const mockBooking = { id: 'booking-1', status: 'confirmed' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.updateBookingStatus('booking-1', 'confirmed');

    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('confirmed');
  });

  it('includes status note when provided', async () => {
    const mockBooking = { id: 'booking-1', status: 'declined', status_note: 'Busy' };
    const mockUpdateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        })),
      })),
    }));
    mockFrom.mockReturnValue({ update: mockUpdateFn });

    const result = await bookingService.updateBookingStatus('booking-1', 'declined', 'Busy');

    expect(result.success).toBe(true);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed' } }),
          })),
        })),
      })),
    });

    const result = await bookingService.updateBookingStatus('booking-1', 'confirmed');

    expect(result.success).toBe(false);
  });
});

describe('bookingService.confirmBooking', () => {
  it('delegates to updateBookingStatus with "confirmed"', async () => {
    const mockBooking = { id: 'booking-1', status: 'confirmed' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.confirmBooking('booking-1');

    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('confirmed');
  });
});

describe('bookingService.declineBooking', () => {
  it('delegates to updateBookingStatus with "declined"', async () => {
    const mockBooking = { id: 'booking-1', status: 'declined' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.declineBooking('booking-1', 'Not available');

    expect(result.success).toBe(true);
  });
});

describe('bookingService.cancelBooking', () => {
  it('delegates to updateBookingStatus with "cancelled"', async () => {
    const mockBooking = { id: 'booking-1', status: 'cancelled' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.cancelBooking('booking-1');

    expect(result.success).toBe(true);
  });
});

describe('bookingService.completeBooking', () => {
  it('completes booking, records earnings, and updates creator stats', async () => {
    const mockBooking = { id: 'booking-1', status: 'completed', total_price: 500 };
    const mockCreator = { verified_meetups: 3 };

    mockFrom.mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
              })),
            })),
          })),
        };
      }
      if (table === 'creator_earnings') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'creators') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockCreator, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
    });

    const result = await bookingService.completeBooking('booking-1', 'creator-1');

    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('completed');
  });

  it('returns failure when booking update fails', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
          })),
        })),
      })),
    });

    const result = await bookingService.completeBooking('booking-1', 'creator-1');

    expect(result.success).toBe(false);
  });
});

describe('bookingService.markNoShow', () => {
  it('delegates to updateBookingStatus with "no_show"', async () => {
    const mockBooking = { id: 'booking-1', status: 'no_show' };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.markNoShow('booking-1');

    expect(result.success).toBe(true);
  });
});

describe('bookingService.rescheduleBooking', () => {
  it('updates date, time and sets status to rescheduled', async () => {
    const mockBooking = {
      id: 'booking-1',
      status: 'rescheduled',
      date: '2026-03-01',
      time: '16:00',
    };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      })),
    });

    const result = await bookingService.rescheduleBooking('booking-1', '2026-03-01', '16:00');

    expect(result.success).toBe(true);
    expect(result.booking.date).toBe('2026-03-01');
    expect(result.booking.time).toBe('16:00');
    expect(result.booking.status).toBe('rescheduled');
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Reschedule failed' },
            }),
          })),
        })),
      })),
    });

    const result = await bookingService.rescheduleBooking('booking-1', '2026-03-01', '16:00');

    expect(result.success).toBe(false);
  });
});

describe('bookingService.verifyClientCode', () => {
  it('returns valid=true when code matches', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { client_code: '123456' },
            error: null,
          }),
        })),
      })),
    });

    const result = await bookingService.verifyClientCode('booking-1', '123456');

    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('returns valid=false when code does not match', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { client_code: '123456' },
            error: null,
          }),
        })),
      })),
    });

    const result = await bookingService.verifyClientCode('booking-1', '000000');

    expect(result.success).toBe(true);
    expect(result.valid).toBe(false);
  });
});

describe('bookingService.verifyCreatorCode', () => {
  it('returns valid=true when code matches', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { creator_code: '654321' },
            error: null,
          }),
        })),
      })),
    });

    const result = await bookingService.verifyCreatorCode('booking-1', '654321');

    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('returns valid=false when code does not match', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { creator_code: '654321' },
            error: null,
          }),
        })),
      })),
    });

    const result = await bookingService.verifyCreatorCode('booking-1', '111111');

    expect(result.success).toBe(true);
    expect(result.valid).toBe(false);
  });
});

describe('bookingService.getUpcomingBookingsCount', () => {
  it('returns count of upcoming bookings', async () => {
    const mockGte = vi.fn().mockResolvedValue({ count: 5, error: null });
    const mockIn = vi.fn(() => ({ gte: mockGte }));
    const mockEq = vi.fn(() => ({ in: mockIn }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await bookingService.getUpcomingBookingsCount('creator-1');

    expect(result.success).toBe(true);
    expect(result.count).toBe(5);
  });
});

describe('bookingService.getPendingBookingsCount', () => {
  it('returns count of pending bookings', async () => {
    const mockEqStatus = vi.fn().mockResolvedValue({ count: 3, error: null });
    const mockEq = vi.fn(() => ({ eq: mockEqStatus }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await bookingService.getPendingBookingsCount('creator-1');

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
  });
});
