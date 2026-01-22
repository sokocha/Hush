import { supabase } from '../lib/supabase';

export const userService = {
  /**
   * Update user's basic info (name, etc.)
   */
  async updateUserInfo(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      console.error('Error updating user info:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get client profile with full details
   */
  async getClientProfile(clientId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          *,
          clients(*)
        `
        )
        .eq('id', clientId)
        .eq('user_type', 'client')
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Error getting client profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update client profile
   */
  async updateClientProfile(clientId, updates) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Error updating client profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update client tier after deposit
   */
  async updateClientTier(clientId, tier, depositAmount) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          tier,
          has_paid_trust_deposit: true,
          deposit_balance: depositAmount,
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Error updating client tier:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deduct from client balance
   */
  async deductClientBalance(clientId, amount) {
    try {
      // First get current balance
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('deposit_balance')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Math.max(0, (client.deposit_balance || 0) - amount);

      const { data, error } = await supabase
        .from('clients')
        .update({ deposit_balance: newBalance })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data, newBalance };
    } catch (error) {
      console.error('Error deducting client balance:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Record successful meetup for client
   */
  async recordClientMeetup(clientId) {
    try {
      // First get current meetup count
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('successful_meetups')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;

      const newMeetupCount = (client.successful_meetups || 0) + 1;

      const { data, error } = await supabase
        .from('clients')
        .update({
          successful_meetups: newMeetupCount,
          is_new_member: false,
          is_trusted_member: newMeetupCount >= 3,
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Error recording client meetup:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if client has unlocked a creator's content
   */
  async checkUnlock(clientId, creatorId, unlockType) {
    try {
      const { data, error } = await supabase
        .from('unlocks')
        .select('*')
        .eq('client_id', clientId)
        .eq('creator_id', creatorId)
        .eq('unlock_type', unlockType)
        .single();

      if (error && error.code === 'PGRST116') {
        return { success: true, unlocked: false };
      }

      if (error) throw error;
      return { success: true, unlocked: true, unlock: data };
    } catch (error) {
      console.error('Error checking unlock:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create an unlock (client unlocks creator content)
   */
  async createUnlock(clientId, creatorId, unlockType, pricePaid) {
    try {
      const { data, error } = await supabase
        .from('unlocks')
        .insert({
          client_id: clientId,
          creator_id: creatorId,
          unlock_type: unlockType,
          price_paid: pricePaid,
        })
        .select()
        .single();

      if (error) throw error;

      // Record earnings for creator
      await supabase.from('creator_earnings').insert({
        creator_id: creatorId,
        amount: pricePaid,
        type: unlockType === 'contact' ? 'unlock_contact' : 'unlock_photos',
      });

      return { success: true, unlock: data };
    } catch (error) {
      console.error('Error creating unlock:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all unlocks for a client
   */
  async getClientUnlocks(clientId) {
    try {
      const { data, error } = await supabase
        .from('unlocks')
        .select(
          `
          *,
          creators:creator_id(
            id,
            users:id(name, username)
          )
        `
        )
        .eq('client_id', clientId);

      if (error) throw error;
      return { success: true, unlocks: data };
    } catch (error) {
      console.error('Error getting client unlocks:', error);
      return { success: false, error: error.message };
    }
  },
};

export default userService;
