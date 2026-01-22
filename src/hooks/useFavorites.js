import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'hush_favorites';

export const useFavorites = () => {
  const { user, isClient } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    // Initialize from localStorage for quick access
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync favorites from database when user logs in
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id || !isClient) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            creator_id,
            creators:creator_id(
              id,
              users:id(username)
            )
          `)
          .eq('client_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          return;
        }

        if (data) {
          // Extract usernames from the favorites
          const usernames = data
            .filter(f => f.creators?.users?.username)
            .map(f => f.creators.users.username);

          setFavorites(usernames);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(usernames));
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.id, isClient]);

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // localStorage not available
    }
  }, [favorites]);

  const addFavorite = useCallback(async (username) => {
    // Update local state immediately for responsiveness
    setFavorites(prev => {
      if (prev.includes(username)) return prev;
      return [...prev, username];
    });

    // If logged in as client, sync to database
    if (user?.id && isClient) {
      try {
        // First get the creator ID from username
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .eq('user_type', 'creator')
          .single();

        if (userError || !userData) {
          console.error('Creator not found:', username);
          return;
        }

        // Insert favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            client_id: user.id,
            creator_id: userData.id,
          });

        if (error && error.code !== '23505') { // Ignore duplicate key error
          console.error('Error adding favorite:', error);
        }
      } catch (err) {
        console.error('Error adding favorite:', err);
      }
    }
  }, [user?.id, isClient]);

  const removeFavorite = useCallback(async (username) => {
    // Update local state immediately
    setFavorites(prev => prev.filter(u => u !== username));

    // If logged in as client, sync to database
    if (user?.id && isClient) {
      try {
        // First get the creator ID from username
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .eq('user_type', 'creator')
          .single();

        if (userError || !userData) {
          console.error('Creator not found:', username);
          return;
        }

        // Delete favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('client_id', user.id)
          .eq('creator_id', userData.id);

        if (error) {
          console.error('Error removing favorite:', error);
        }
      } catch (err) {
        console.error('Error removing favorite:', err);
      }
    }
  }, [user?.id, isClient]);

  const toggleFavorite = useCallback(async (username) => {
    if (favorites.includes(username)) {
      await removeFavorite(username);
    } else {
      await addFavorite(username);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((username) => {
    return favorites.includes(username);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    loading,
  };
};

export default useFavorites;
