import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'hush_favorites';

// Global event emitter for favorite count changes
const favoriteCountListeners = new Set();

export const subscribeFavoriteCountChange = (callback) => {
  favoriteCountListeners.add(callback);
  return () => favoriteCountListeners.delete(callback);
};

const notifyFavoriteCountChange = (username, delta) => {
  favoriteCountListeners.forEach(callback => callback(username, delta));
};

export const useFavorites = () => {
  const { user, isClient } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const pendingOperations = useRef(new Set());

  // Sync favorites from database when user logs in
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id || !isClient) return;

      try {
        setLoading(true);
        // Get favorites with creator usernames
        const { data, error } = await supabase
          .from('favorites')
          .select('creator_id')
          .eq('client_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          return;
        }

        if (data && data.length > 0) {
          // Get usernames for these creator IDs
          const creatorIds = data.map(f => f.creator_id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('username')
            .in('id', creatorIds);

          if (usersError) {
            console.error('Error fetching usernames:', usersError);
            return;
          }

          const dbUsernames = usersData?.map(u => u.username) || [];

          // MERGE database favorites with existing localStorage favorites
          // This preserves favorites for mock/dummy creators that aren't in DB
          setFavorites(prev => {
            const merged = new Set([...prev, ...dbUsernames]);
            const mergedArray = Array.from(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedArray));
            return mergedArray;
          });
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

  const addFavorite = useCallback(async (username, onCountChange) => {
    // Prevent duplicate operations
    if (pendingOperations.current.has(`add-${username}`)) return;
    pendingOperations.current.add(`add-${username}`);

    // Update local state immediately (optimistic)
    setFavorites(prev => {
      if (prev.includes(username)) return prev;
      return [...prev, username];
    });

    // Notify listeners of count change (+1)
    notifyFavoriteCountChange(username, 1);
    if (onCountChange) onCountChange(1);

    // If logged in as client, try to sync to database (don't rollback local state on failure)
    if (user?.id && isClient) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .eq('user_type', 'creator')
          .single();

        if (!userError && userData) {
          const { error } = await supabase
            .from('favorites')
            .insert({
              client_id: user.id,
              creator_id: userData.id,
            });

          if (error && error.code !== '23505') {
            console.warn('Could not sync favorite to database:', error.message);
          }
        } else {
          console.warn('Creator not found in DB for sync:', username);
        }
      } catch (err) {
        console.warn('Could not sync favorite to database:', err.message);
      }
    }

    pendingOperations.current.delete(`add-${username}`);
  }, [user?.id, isClient]);

  const removeFavorite = useCallback(async (username, onCountChange) => {
    // Prevent duplicate operations
    if (pendingOperations.current.has(`remove-${username}`)) return;
    pendingOperations.current.add(`remove-${username}`);

    // Update local state immediately (optimistic)
    const previousFavorites = favorites;
    setFavorites(prev => prev.filter(u => u !== username));

    // Notify listeners of count change (-1)
    notifyFavoriteCountChange(username, -1);
    if (onCountChange) onCountChange(-1);

    // If logged in as client, try to sync to database (don't rollback local state on failure)
    if (user?.id && isClient) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .eq('user_type', 'creator')
          .single();

        if (!userError && userData) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('client_id', user.id)
            .eq('creator_id', userData.id);

          if (error) {
            console.warn('Could not sync unfavorite to database:', error.message);
          }
        } else {
          console.warn('Creator not found in DB for sync:', username);
        }
      } catch (err) {
        console.warn('Could not sync unfavorite to database:', err.message);
      }
    }

    pendingOperations.current.delete(`remove-${username}`);
  }, [user?.id, isClient, favorites]);

  const toggleFavorite = useCallback(async (username, onCountChange) => {
    if (favorites.includes(username)) {
      await removeFavorite(username, onCountChange);
    } else {
      await addFavorite(username, onCountChange);
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

// Hook for subscribing to favorite count changes for a specific username
// The initialCount comes from the database's favorite_count column (updated by trigger)
// This hook provides reactive updates within the current session
export const useFavoriteCount = (username, initialCount = 0) => {
  const [count, setCount] = useState(initialCount);

  // Update count when initialCount changes (e.g., data loads from DB)
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // Subscribe to real-time changes within this session
  useEffect(() => {
    const unsubscribe = subscribeFavoriteCountChange((changedUsername, delta) => {
      if (changedUsername === username) {
        setCount(prev => Math.max(0, prev + delta));
      }
    });
    return unsubscribe;
  }, [username]);

  return count;
};

export default useFavorites;
