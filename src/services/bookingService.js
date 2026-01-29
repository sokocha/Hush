import { supabase } from '../lib/supabase';

/**
 * Generate a random 6-digit code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const bookingService = {
  /**
   * Create a new booking request
   */
  async createBooking(bookingData) {
    try {
      const clientCode = generateCode();
      const creatorCode = generateCode();

      console.log('[BookingService] Creating booking for client:', bookingData.clientId, 'creator:', bookingData.creatorId);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: bookingData.clientId,
          creator_id: bookingData.creatorId,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          location_type: bookingData.locationType,
          location: bookingData.location,
          special_requests: bookingData.specialRequests,
          total_price: bookingData.totalPrice,
          deposit_amount: bookingData.depositAmount,
          client_code: clientCode,
          creator_code: creatorCode,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[BookingService] Booking created successfully:', data.id);

      // Insert selected extras if any
      if (bookingData.extras && bookingData.extras.length > 0) {
        const extrasToInsert = bookingData.extras.map((extra) => ({
          booking_id: data.id,
          extra_id: extra.id,
          price: extra.price,
        }));

        await supabase.from('booking_extras').insert(extrasToInsert);
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('[BookingService] Error creating booking:', error.message, error.details || '', error.hint || '');
      return { success: false, error: error.message };
    }
  },

  /**
   * Get booking by ID with full details
   */
  async getBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          client:client_id(
            id,
            users:id(name, username, phone)
          ),
          creator:creator_id(
            id,
            users:id(name, username, phone)
          ),
          booking_extras(
            id,
            price,
            creator_extras(name)
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error getting booking:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get bookings for a client
   */
  async getClientBookings(clientId, status = null) {
    try {
      // First try with joins for full data
      let query = supabase
        .from('bookings')
        .select(
          `
          *,
          creator:creator_id(
            id,
            location,
            users:id(name, username),
            creator_photos(storage_path, is_preview)
          ),
          booking_extras(
            id,
            price,
            creator_extras(name)
          )
        `
        )
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[BookingService] Join query failed, trying simple query:', error.message);
        // Fallback: try without joins (in case RLS blocks joined tables)
        const { data: simpleData, error: simpleError } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        return { success: true, bookings: simpleData };
      }
      return { success: true, bookings: data };
    } catch (error) {
      console.error('[BookingService] Error getting client bookings:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get bookings for a creator
   */
  async getCreatorBookings(creatorId, status = null) {
    try {
      // First try with joins for full data
      let query = supabase
        .from('bookings')
        .select(
          `
          *,
          client:client_id(
            id,
            is_trusted_member,
            successful_meetups,
            users:id(name, username, phone)
          ),
          booking_extras(
            id,
            price,
            creator_extras(name)
          )
        `
        )
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[BookingService] Creator join query failed, trying simple query:', error.message);
        // Fallback: try without joins (in case RLS blocks joined tables)
        const { data: simpleData, error: simpleError } = await supabase
          .from('bookings')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        return { success: true, bookings: simpleData };
      }
      return { success: true, bookings: data };
    } catch (error) {
      console.error('[BookingService] Error getting creator bookings:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, note = null) {
    try {
      const updates = {
        status,
        status_updated_at: new Date().toISOString(),
      };

      if (note) {
        updates.status_note = note;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Confirm booking (creator accepts)
   */
  async confirmBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'confirmed');
  },

  /**
   * Decline booking (creator declines)
   */
  async declineBooking(bookingId, reason = null) {
    return this.updateBookingStatus(bookingId, 'declined', reason);
  },

  /**
   * Cancel booking (client cancels)
   */
  async cancelBooking(bookingId, reason = null) {
    return this.updateBookingStatus(bookingId, 'cancelled', reason);
  },

  /**
   * Complete booking (after meetup)
   */
  async completeBooking(bookingId, creatorId) {
    try {
      // Update booking status
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Record earnings for creator
      const { error: earningsError } = await supabase.from('creator_earnings').insert({
        creator_id: creatorId,
        booking_id: bookingId,
        amount: booking.total_price,
        type: 'meetup',
      });

      if (earningsError) throw earningsError;

      // Update creator stats
      const { data: creator, error: creatorFetchError } = await supabase
        .from('creators')
        .select('verified_meetups')
        .eq('id', creatorId)
        .single();

      if (creatorFetchError) throw creatorFetchError;

      await supabase
        .from('creators')
        .update({
          verified_meetups: (creator.verified_meetups || 0) + 1,
        })
        .eq('id', creatorId);

      return { success: true, booking };
    } catch (error) {
      console.error('Error completing booking:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId) {
    return this.updateBookingStatus(bookingId, 'no_show');
  },

  /**
   * Reschedule booking
   */
  async rescheduleBooking(bookingId, newDate, newTime) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          date: newDate,
          time: newTime,
          status: 'rescheduled',
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verify client code (for meetup verification)
   */
  async verifyClientCode(bookingId, code) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('client_code')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      const isValid = data.client_code === code;
      return { success: true, valid: isValid };
    } catch (error) {
      console.error('Error verifying client code:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verify creator code (for meetup verification)
   */
  async verifyCreatorCode(bookingId, code) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('creator_code')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      const isValid = data.creator_code === code;
      return { success: true, valid: isValid };
    } catch (error) {
      console.error('Error verifying creator code:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get upcoming bookings count for a creator
   */
  async getUpcomingBookingsCount(creatorId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .in('status', ['pending', 'confirmed'])
        .gte('date', today);

      if (error) throw error;
      return { success: true, count };
    } catch (error) {
      console.error('Error getting upcoming bookings count:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get pending bookings count for a creator
   */
  async getPendingBookingsCount(creatorId) {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true, count };
    } catch (error) {
      console.error('Error getting pending bookings count:', error);
      return { success: false, error: error.message };
    }
  },
};

export default bookingService;
