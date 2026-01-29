import { supabase } from '../lib/supabase';

/**
 * Fetch all creators with related data using separate queries.
 * Avoids PostgREST resource-embedding and this-binding issues.
 */
async function fetchAllCreators() {
  // 1. Fetch all creators (simple select — proven to work via stats)
  const { data: creators, error: creatorsErr } = await supabase
    .from('creators')
    .select('*');

  if (creatorsErr) {
    console.error('[AdminService] Error fetching creators:', creatorsErr);
    throw creatorsErr;
  }
  if (!creators || creators.length === 0) return [];

  const ids = creators.map(c => c.id);

  // 2. Batch-fetch related data in parallel (errors are non-fatal)
  let usersData = [];
  let areasData = [];
  let photosData = [];

  try {
    const [usersRes, areasRes, photosRes] = await Promise.all([
      supabase.from('users').select('id, name, username, phone, created_at').in('id', ids),
      supabase.from('creator_areas').select('creator_id, area').in('creator_id', ids),
      supabase.from('creator_photos').select('id, creator_id, storage_path, is_preview, display_order').in('creator_id', ids),
    ]);
    usersData = usersRes.data || [];
    areasData = areasRes.data || [];
    photosData = photosRes.data || [];
    if (usersRes.error) console.warn('[AdminService] users fetch error:', usersRes.error);
    if (areasRes.error) console.warn('[AdminService] areas fetch error:', areasRes.error);
    if (photosRes.error) console.warn('[AdminService] photos fetch error:', photosRes.error);
  } catch (batchErr) {
    console.warn('[AdminService] Batch fetch failed, returning creators without related data:', batchErr);
  }

  // Build lookup maps
  const usersMap = {};
  usersData.forEach(u => { usersMap[u.id] = u; });

  const areasMap = {};
  areasData.forEach(a => {
    if (!areasMap[a.creator_id]) areasMap[a.creator_id] = [];
    areasMap[a.creator_id].push({ area: a.area });
  });

  const photosMap = {};
  photosData.forEach(p => {
    if (!photosMap[p.creator_id]) photosMap[p.creator_id] = [];
    photosMap[p.creator_id].push(p);
  });

  // 3. Merge into the shape the CreatorCard component expects
  return creators.map(c => ({
    ...c,
    users: usersMap[c.id] || null,
    creator_areas: areasMap[c.id] || [],
    creator_photos: (photosMap[c.id] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
  }));
}

/** Get the effective verification status, treating NULL as 'pending'. */
function getStatus(creator) {
  return creator.verification_status || 'pending';
}

export const adminService = {
  /**
   * Get creators filtered by verification status
   * @param {string} status - 'pending' | 'scheduled' | 'under_review' | 'approved' | 'denied' | 'all' | 'disputed'
   */
  async getVerificationQueue(status = 'pending') {
    try {
      const all = await fetchAllCreators();

      let filtered;
      if (status === 'all') {
        filtered = all;
      } else if (status === 'disputed') {
        filtered = all.filter(c => getStatus(c) === 'denied' && c.dispute_message);
      } else {
        filtered = all.filter(c => getStatus(c) === status);
      }

      // Sort scheduled by call time ascending, everything else by created_at descending
      if (status === 'scheduled') {
        filtered.sort((a, b) =>
          new Date(a.verification_call_scheduled_at || 0) - new Date(b.verification_call_scheduled_at || 0)
        );
      }

      return { success: true, creators: filtered };
    } catch (error) {
      console.error('[AdminService] getVerificationQueue error:', error);
      return { success: false, error: error.message, creators: [] };
    }
  },

  /**
   * Get full creator details for admin review
   */
  async getCreatorDetail(creatorId) {
    try {
      // Use separate queries like fetchAllCreators for consistency
      const { data: creator, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (error) throw error;

      const [userRes, areasRes, photosRes, extrasRes, boundariesRes] = await Promise.all([
        supabase.from('users').select('id, name, username, phone, created_at, last_seen_at').eq('id', creatorId).single(),
        supabase.from('creator_areas').select('area').eq('creator_id', creatorId),
        supabase.from('creator_photos').select('id, storage_path, is_preview, display_order, captured_at').eq('creator_id', creatorId),
        supabase.from('creator_extras').select('id, name, price').eq('creator_id', creatorId),
        supabase.from('creator_boundaries').select('boundary').eq('creator_id', creatorId),
      ]);

      return {
        success: true,
        creator: {
          ...creator,
          users: userRes.data || null,
          creator_areas: (areasRes.data || []).map(a => ({ area: a.area })),
          creator_photos: photosRes.data || [],
          creator_extras: extrasRes.data || [],
          creator_boundaries: boundariesRes.data || [],
        },
      };
    } catch (error) {
      console.error('[AdminService] getCreatorDetail error:', error);
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
      console.error('[AdminService] approveCreator error:', error);
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
      console.error('[AdminService] denyCreator error:', error);
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
      console.error('[AdminService] rescheduleCreator error:', error);
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
      console.error('[AdminService] getDashboardStats error:', error);
      return { success: false, error: error.message };
    }
  },
};

export default adminService;
