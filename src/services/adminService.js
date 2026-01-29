import { supabase } from '../lib/supabase';

export const adminService = {
  /**
   * Fetch all creators with related data using separate queries
   * to avoid PostgREST resource-embedding / RLS issues.
   */
  async _fetchAllCreators() {
    // 1. Fetch all creators (simple select — proven to work via stats)
    const { data: creators, error: creatorsErr } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });

    if (creatorsErr) {
      console.error('[AdminService] Error fetching creators:', creatorsErr);
      throw creatorsErr;
    }
    if (!creators || creators.length === 0) return [];

    const ids = creators.map(c => c.id);

    // 2. Batch-fetch related data in parallel
    const [usersRes, areasRes, photosRes] = await Promise.all([
      supabase.from('users').select('id, name, username, phone, created_at').in('id', ids),
      supabase.from('creator_areas').select('creator_id, area').in('creator_id', ids),
      supabase.from('creator_photos').select('id, creator_id, storage_path, is_preview, display_order').in('creator_id', ids),
    ]);

    // Build lookup maps
    const usersMap = {};
    (usersRes.data || []).forEach(u => { usersMap[u.id] = u; });

    const areasMap = {};
    (areasRes.data || []).forEach(a => {
      if (!areasMap[a.creator_id]) areasMap[a.creator_id] = [];
      areasMap[a.creator_id].push({ area: a.area });
    });

    const photosMap = {};
    (photosRes.data || []).forEach(p => {
      if (!photosMap[p.creator_id]) photosMap[p.creator_id] = [];
      photosMap[p.creator_id].push(p);
    });

    // 3. Merge into the shape the CreatorCard component expects
    return creators.map(c => ({
      ...c,
      users: usersMap[c.id] || null,
      creator_areas: areasMap[c.id] || [],
      creator_photos: (photosMap[c.id] || []).sort((a, b) => a.display_order - b.display_order),
    }));
  },

  /**
   * Get the effective verification status, treating NULL as 'pending'.
   */
  _getStatus(creator) {
    return creator.verification_status || 'pending';
  },

  /**
   * Get creators filtered by verification status
   * @param {string} status - 'pending' | 'scheduled' | 'under_review' | 'approved' | 'denied' | 'all' | 'disputed'
   */
  async getVerificationQueue(status = 'pending') {
    try {
      const all = await this._fetchAllCreators();

      let filtered;
      if (status === 'all') {
        filtered = all;
      } else if (status === 'disputed') {
        filtered = all.filter(c => this._getStatus(c) === 'denied' && c.dispute_message);
      } else {
        filtered = all.filter(c => this._getStatus(c) === status);
      }

      // Sort scheduled by call time ascending, everything else by created_at descending
      if (status === 'scheduled') {
        filtered.sort((a, b) =>
          new Date(a.verification_call_scheduled_at || 0) - new Date(b.verification_call_scheduled_at || 0)
        );
      }

      return { success: true, creators: filtered };
    } catch (error) {
      console.error('[AdminService] Error getting verification queue:', error);
      return { success: false, error: error.message, creators: [] };
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
      console.error('[AdminService] Error getting creator detail:', error);
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
      console.error('[AdminService] Error getting dashboard stats:', error);
      return { success: false, error: error.message };
    }
  },
};

export default adminService;
