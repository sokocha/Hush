import { supabase } from '../lib/supabase';

const OTP_EXPIRY_MINUTES = 5;

export const authService = {
  /**
   * Request OTP code to be sent via WhatsApp
   * This calls a Supabase Edge Function that sends the OTP
   */
  async requestOTP(phone) {
    try {
      // Call Edge Function to send OTP via WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phone },
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error requesting OTP:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verify OTP code and sign in/register user
   */
  async verifyOTP(phone, code) {
    try {
      // Call Edge Function to verify OTP
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
        body: { phone, code },
      });

      if (error) throw error;

      if (!data.valid) {
        return { success: false, error: 'Invalid or expired code' };
      }

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*, clients(*), creators(*)')
        .eq('phone', phone)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw userError;
      }

      return {
        success: true,
        isNewUser: !existingUser,
        user: existingUser,
        token: data.token, // JWT token from Edge Function
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Register a new client
   */
  async registerClient({ phone, username, name, preferences }) {
    try {
      // First create the user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          phone,
          username,
          name,
          user_type: 'client',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create the client profile with preferences
      const clientData = {
        id: user.id,
      };

      // Add preferences if provided
      if (preferences) {
        clientData.preferences = {
          preferredLocation: preferences.preferredLocation || null,
          bodyTypes: preferences.bodyTypes || [],
          skinTones: preferences.skinTones || [],
          ageRanges: preferences.ageRanges || [],
          services: preferences.services || [],
        };
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) throw clientError;

      return {
        success: true,
        user: { ...user, clients: client },
      };
    } catch (error) {
      console.error('Error registering client:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Register a new creator
   */
  async registerCreator({ phone, username, name, location, areas, tagline, bio, bodyType, skinTone, age, height, services }) {
    try {
      // First create the user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          phone,
          username,
          name,
          user_type: 'creator',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create the creator profile with physical attributes
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .insert({
          id: user.id,
          location,
          tagline,
          bio,
          body_type: bodyType || null,
          skin_tone: skinTone || null,
          age: age ? parseInt(age) : null,
          height: height || null,
          services: services || [],
        })
        .select()
        .single();

      if (creatorError) throw creatorError;

      // Add service areas
      if (areas && areas.length > 0) {
        const areasToInsert = areas.map((area) => ({
          creator_id: user.id,
          area,
        }));

        const { error: areasError } = await supabase
          .from('creator_areas')
          .insert(areasToInsert);

        if (areasError) throw areasError;
      }

      return {
        success: true,
        user: { ...user, creator, areas },
      };
    } catch (error) {
      console.error('Error registering creator:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get current user data
   */
  async getCurrentUser(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(
          `
          *,
          clients(*),
          creators(
            *,
            creator_areas(area),
            creator_photos(id, storage_path, is_preview, display_order),
            creator_extras(id, name, price),
            creator_boundaries(id, boundary)
          )
        `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, user };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating last seen:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user by phone number (for login)
   */
  async getUserByPhone(phone) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(
          `
          *,
          clients(*),
          creators(
            *,
            creator_areas(area),
            creator_photos(id, storage_path, is_preview, display_order),
            creator_extras(id, name, price),
            creator_boundaries(id, boundary)
          )
        `
        )
        .eq('phone', phone)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found = user doesn't exist
        return { success: true, exists: false, user: null };
      }

      if (error) throw error;

      return { success: true, exists: true, user };
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if username is available
   */
  async checkUsernameAvailable(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found = username available
        return { success: true, available: true };
      }

      if (error) throw error;

      return { success: true, available: false };
    } catch (error) {
      console.error('Error checking username:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  },
};

export default authService;
