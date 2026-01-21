import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hush_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // localStorage not available
    }
  }, [favorites]);

  const addFavorite = useCallback((username) => {
    setFavorites(prev => {
      if (prev.includes(username)) return prev;
      return [...prev, username];
    });
  }, []);

  const removeFavorite = useCallback((username) => {
    setFavorites(prev => prev.filter(u => u !== username));
  }, []);

  const toggleFavorite = useCallback((username) => {
    setFavorites(prev => {
      if (prev.includes(username)) {
        return prev.filter(u => u !== username);
      }
      return [...prev, username];
    });
  }, []);

  const isFavorite = useCallback((username) => {
    return favorites.includes(username);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};

export default useFavorites;
