import { supabase } from '../lib/supabase';

export const creatorService = {
  /**
   * Get creator profile with full details
   */
  async getCreatorProfile(creatorId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          *,
          creators(
            *,
            creator_areas(id, area),
            creator_photos(id, storage_path, is_preview, display_order, captured_at),
            creator_extras(id, name, price),
            creator_boundaries(id, boundary)
          )
        `
        )
        .eq('id', creatorId)
        .eq('user_type', 'creator')
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error getting creator profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get creator by username (for public profile view)
   */
  async getCreatorByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          *,
          creators(
            *,
            creator_areas(id, area),
            creator_photos(id, storage_path, is_preview, display_order, captured_at),
            creator_extras(id, name, price),
            creator_boundaries(id, boundary)
          )
        `
        )
        .eq('username', username)
        .eq('user_type', 'creator')
        .single();

      if (error) throw error;

      // Increment profile views
      if (data?.creators) {
        await supabase
          .from('creators')
          .update({ profile_views: (data.creators.profile_views || 0) + 1 })
          .eq('id', data.id);
      }

      return { success: true, creator: data };
    } catch (error) {
      console.error('Error getting creator by username:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all visible creators for explore page
   */
  async getExploreCreators(filters = {}) {
    try {
      let query = supabase
        .from('creators')
        .select(
          `
          *,
          users:id(id, name, username, last_seen_at),
          creator_areas(area),
          creator_photos(id, storage_path, is_preview, display_order)
        `
        )
        .eq('is_visible_in_explore', true);

      // Apply filters
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.verified) {
        query = query.eq('is_verified', true);
      }

      if (filters.minPrice) {
        query = query.gte('pricing->meetupIncall->1', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('pricing->meetupIncall->1', filters.maxPrice);
      }

      // Sort
      if (filters.sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else if (filters.sortBy === 'reviews') {
        query = query.order('reviews_count', { ascending: false });
      } else if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, creators: data };
    } catch (error) {
      console.error('Error getting explore creators:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update creator profile
   */
  async updateCreatorProfile(creatorId, updates) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update(updates)
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error updating creator profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update creator pricing
   */
  async updateCreatorPricing(creatorId, pricing) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({ pricing })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error updating creator pricing:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update creator schedule
   */
  async updateCreatorSchedule(creatorId, schedule) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({ schedule })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error updating creator schedule:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update creator service areas
   */
  async updateCreatorAreas(creatorId, areas) {
    try {
      // Delete existing areas
      await supabase.from('creator_areas').delete().eq('creator_id', creatorId);

      // Insert new areas
      if (areas && areas.length > 0) {
        const areasToInsert = areas.map((area) => ({
          creator_id: creatorId,
          area,
        }));

        const { error } = await supabase.from('creator_areas').insert(areasToInsert);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating creator areas:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add creator extra service
   */
  async addCreatorExtra(creatorId, name, price) {
    try {
      const { data, error } = await supabase
        .from('creator_extras')
        .insert({
          creator_id: creatorId,
          name,
          price,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, extra: data };
    } catch (error) {
      console.error('Error adding creator extra:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove creator extra service
   */
  async removeCreatorExtra(extraId) {
    try {
      const { error } = await supabase.from('creator_extras').delete().eq('id', extraId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing creator extra:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add creator boundary
   */
  async addCreatorBoundary(creatorId, boundary) {
    try {
      const { data, error } = await supabase
        .from('creator_boundaries')
        .insert({
          creator_id: creatorId,
          boundary,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, boundary: data };
    } catch (error) {
      console.error('Error adding creator boundary:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove creator boundary
   */
  async removeCreatorBoundary(boundaryId) {
    try {
      const { error } = await supabase
        .from('creator_boundaries')
        .delete()
        .eq('id', boundaryId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing creator boundary:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get creator earnings
   */
  async getCreatorEarnings(creatorId, period = 'all') {
    try {
      let query = supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Filter by period
      if (period === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', today);
      } else if (period === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', monthAgo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate total
      const total = data.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);

      return { success: true, earnings: data, total };
    } catch (error) {
      console.error('Error getting creator earnings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Toggle creator visibility in explore
   */
  async toggleExploreVisibility(creatorId, isVisible) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({ is_visible_in_explore: isVisible })
        .eq('id', creatorId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, creator: data };
    } catch (error) {
      console.error('Error toggling explore visibility:', error);
      return { success: false, error: error.message };
    }
  },
};

export default creatorService;
