import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { bookingService } from '../services/bookingService';
import { userService } from '../services/userService';
import { creatorService } from '../services/creatorService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Booking Flow Integration', () => {
  const clientId = 'client-1';
  const creatorId = 'creator-1';

  describe('full booking lifecycle: create → confirm → verify codes → complete', () => {
    it('creates a booking with verification codes', async () => {
      const bookingData = {
        clientId,
        creatorId,
        date: '2026-02-15',
        time: '14:00',
        duration: '1',
        locationType: 'incall',
        location: 'Lagos',
        totalPrice: 50000,
        depositAmount: 25000,
      };

      const mockBooking = {
        id: 'booking-1',
        ...bookingData,
        client_id: clientId,
        creator_id: creatorId,
        client_code: '123456',
        creator_code: '654321',
        status: 'pending',
        created_at: '2026-01-27T10:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          })),
        })),
      });

      const result = await bookingService.createBooking(bookingData);

      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('pending');
      expect(result.booking.client_code).toBeDefined();
      expect(result.booking.creator_code).toBeDefined();
      expect(result.booking.client_code).not.toBe(result.booking.creator_code);
    });

    it('creator confirms the pending booking', async () => {
      const confirmedBooking = {
        id: 'booking-1',
        status: 'confirmed',
        status_updated_at: expect.any(String),
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: confirmedBooking, error: null }),
            })),
          })),
        })),
      });

      const result = await bookingService.confirmBooking('booking-1');

      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('confirmed');
    });

    it('verifies client code at meetup', async () => {
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

      const validResult = await bookingService.verifyClientCode('booking-1', '123456');
      expect(validResult.success).toBe(true);
      expect(validResult.valid).toBe(true);
    });

    it('rejects wrong client code', async () => {
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

      const invalidResult = await bookingService.verifyClientCode('booking-1', '000000');
      expect(invalidResult.success).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    it('verifies creator code at meetup', async () => {
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

    it('completes booking and records earnings + updates stats', async () => {
      const completedBooking = {
        id: 'booking-1',
        total_price: 50000,
        status: 'completed',
      };

      let callIndex = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'bookings') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: completedBooking, error: null }),
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
          callIndex++;
          if (callIndex === 1) {
            // First call: select verified_meetups
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { verified_meetups: 5 },
                    error: null,
                  }),
                })),
              })),
            };
          }
          // Second call: update verified_meetups
          return {
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          };
        }
        return {};
      });

      const result = await bookingService.completeBooking('booking-1', creatorId);

      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('completed');
      // Verify earnings insert was called
      expect(mockFrom).toHaveBeenCalledWith('creator_earnings');
      // Verify creator stats update was called
      expect(mockFrom).toHaveBeenCalledWith('creators');
    });
  });

  describe('booking with extras', () => {
    it('creates booking and inserts selected extras', async () => {
      const bookingData = {
        clientId,
        creatorId,
        date: '2026-02-20',
        time: '18:00',
        duration: '2',
        locationType: 'outcall',
        location: 'Abuja',
        totalPrice: 95000,
        depositAmount: 47500,
        extras: [
          { id: 'extra-1', name: 'Dinner', price: 10000 },
          { id: 'extra-2', name: 'Transport', price: 5000 },
        ],
      };

      const mockBooking = {
        id: 'booking-2',
        client_id: clientId,
        creator_id: creatorId,
        status: 'pending',
        total_price: 95000,
      };

      const insertedExtras = [];
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
            insert: vi.fn((data) => {
              insertedExtras.push(...data);
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      });

      const result = await bookingService.createBooking(bookingData);

      expect(result.success).toBe(true);
      expect(insertedExtras).toHaveLength(2);
      expect(insertedExtras[0].booking_id).toBe('booking-2');
      expect(insertedExtras[0].extra_id).toBe('extra-1');
      expect(insertedExtras[1].extra_id).toBe('extra-2');
    });
  });

  describe('booking decline and reschedule', () => {
    it('creator declines with reason', async () => {
      const declinedBooking = {
        id: 'booking-3',
        status: 'declined',
        status_note: 'Not available on this date',
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: declinedBooking, error: null }),
            })),
          })),
        })),
      });

      const result = await bookingService.declineBooking('booking-3', 'Not available on this date');
      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('declined');
    });

    it('reschedules booking to new date and time', async () => {
      const rescheduledBooking = {
        id: 'booking-4',
        date: '2026-03-01',
        time: '16:00',
        status: 'rescheduled',
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: rescheduledBooking, error: null }),
            })),
          })),
        })),
      });

      const result = await bookingService.rescheduleBooking('booking-4', '2026-03-01', '16:00');
      expect(result.success).toBe(true);
      expect(result.booking.date).toBe('2026-03-01');
      expect(result.booking.time).toBe('16:00');
      expect(result.booking.status).toBe('rescheduled');
    });
  });

  describe('client cancellation flow', () => {
    it('client cancels booking with reason', async () => {
      const cancelledBooking = {
        id: 'booking-5',
        status: 'cancelled',
        status_note: 'Change of plans',
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: cancelledBooking, error: null }),
            })),
          })),
        })),
      });

      const result = await bookingService.cancelBooking('booking-5', 'Change of plans');
      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('cancelled');
    });
  });

  describe('booking queries', () => {
    it('fetches client bookings ordered by date', async () => {
      const mockBookings = [
        { id: 'b1', status: 'confirmed', created_at: '2026-02-01' },
        { id: 'b2', status: 'pending', created_at: '2026-01-28' },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getClientBookings(clientId);
      expect(result.success).toBe(true);
      expect(result.bookings).toHaveLength(2);
    });

    it('filters client bookings by status', async () => {
      const mockBookings = [
        { id: 'b1', status: 'confirmed' },
      ];

      const mockEqStatus = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
      const mockOrder = vi.fn(() => ({ eq: mockEqStatus }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getClientBookings(clientId, 'confirmed');
      expect(result.success).toBe(true);
      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].status).toBe('confirmed');
    });

    it('fetches creator bookings', async () => {
      const mockBookings = [
        { id: 'b1', client_id: 'c1', status: 'pending' },
        { id: 'b2', client_id: 'c2', status: 'confirmed' },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockBookings, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getCreatorBookings(creatorId);
      expect(result.success).toBe(true);
      expect(result.bookings).toHaveLength(2);
    });

    it('gets upcoming bookings count', async () => {
      const mockGte = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockIn = vi.fn(() => ({ gte: mockGte }));
      const mockEq = vi.fn(() => ({ in: mockIn }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getUpcomingBookingsCount(creatorId);
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('gets pending bookings count', async () => {
      const mockEqStatus = vi.fn().mockResolvedValue({ count: 2, error: null });
      const mockEq = vi.fn(() => ({ eq: mockEqStatus }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getPendingBookingsCount(creatorId);
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe('no-show flow', () => {
    it('marks booking as no-show', async () => {
      const noShowBooking = { id: 'booking-6', status: 'no_show' };

      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: noShowBooking, error: null }),
            })),
          })),
        })),
      });

      const result = await bookingService.markNoShow('booking-6');
      expect(result.success).toBe(true);
      expect(result.booking.status).toBe('no_show');
    });
  });
});
