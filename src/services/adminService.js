import { supabase } from '../lib/supabase';

export const adminService = {
  /**
   * Get creators filtered by verification status
   * @param {string} status - 'pending' | 'scheduled' | 'under_review' | 'approved' | 'denied' | 'all' | 'disputed'
   */
  async getVerificationQueue(status = 'pending') {
    try {
      let query = supabase
        .from('creators')
        .select(`
          *,
          users:id(id, name, username, phone, created_at),
          creator_areas(area),
          creator_photos(id, storage_path, is_preview, display_order)
        `);

      if (status === 'disputed') {
        // Show denied creators who have submitted a dispute
        query = query.eq('verification_status', 'denied').not('dispute_message', 'is', null);
      } else if (status === 'pending') {
        // Match both explicit 'pending' and NULL (pre-migration rows)
        query = query.or('verification_status.eq.pending,verification_status.is.null');
      } else if (status !== 'all') {
        query = query.eq('verification_status', status);
      }

      // Sort scheduled by call time, everything else by creation date
      if (status === 'scheduled') {
        query = query.order('verification_call_scheduled_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, creators: data || [] };
    } catch (error) {
      console.error('Error getting verification queue:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get full creator details for admin review
   */
  async getCreatorDetail(creatorId) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users:id(id, name, username, phone, created_at, last_seen_at),
          creator_areas(area),
          creator_photos(id, storage_path, is_preview, display_order, captured_at),
          creator_extras(id, name, price),
          creator_boundaries(boundary)
        `)
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error getting creator detail:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Approve a creator's verification
   */
  async approveCreator(creatorId, notes = '') {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({
          verification_status: 'approved',
          is_verified: true,
          is_video_verified: true,
          pending_verification: false,
          is_visible_in_explore: true,
          verification_notes: notes || null,
          verification_denied_reason: null,
          dispute_message: null,
          dispute_submitted_at: null,
        })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error approving creator:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deny a creator's verification
   */
  async denyCreator(creatorId, reason) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({
          verification_status: 'denied',
          is_verified: false,
          is_video_verified: false,
          pending_verification: false,
          is_visible_in_explore: false,
          verification_denied_reason: reason,
          dispute_message: null,
          dispute_submitted_at: null,
        })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error denying creator:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reschedule a creator's verification call
   */
  async rescheduleCreator(creatorId, scheduledAt) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({
          verification_status: 'scheduled',
          verification_call_scheduled_at: scheduledAt,
          verification_denied_reason: null,
        })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error rescheduling creator:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get dashboard stats for admin overview
   */
  async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('verification_status, dispute_message');

      if (error) throw error;

      const stats = {
        pending: 0,
        scheduled: 0,
        under_review: 0,
        approved: 0,
        denied: 0,
        disputed: 0,
      };

      (data || []).forEach(c => {
        const s = c.verification_status || 'pending';
        if (stats[s] !== undefined) stats[s]++;
        if (s === 'denied' && c.dispute_message) stats.disputed++;
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { success: false, error: error.message };
    }
  },
};

export default adminService;
