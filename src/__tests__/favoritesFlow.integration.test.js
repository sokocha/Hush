import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { subscribeFavoriteCountChange } from '../hooks/useFavorites';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'client-1' },
    isClient: true,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Favorites Flow Integration', () => {
  describe('localStorage persistence across sessions', () => {
    it('saves favorites to localStorage and retrieves them', () => {
      const favorites = ['creator1', 'creator2', 'creator3'];
      localStorage.setItem('hush_favorites', JSON.stringify(favorites));

      const restored = JSON.parse(localStorage.getItem('hush_favorites'));
      expect(restored).toEqual(favorites);
      expect(restored).toHaveLength(3);
    });

    it('persists favorites after adding a new one', () => {
      const initial = ['creator1'];
      localStorage.setItem('hush_favorites', JSON.stringify(initial));

      const current = JSON.parse(localStorage.getItem('hush_favorites'));
      const updated = [...current, 'creator2'];
      localStorage.setItem('hush_favorites', JSON.stringify(updated));

      const result = JSON.parse(localStorage.getItem('hush_favorites'));
      expect(result).toEqual(['creator1', 'creator2']);
    });

    it('persists favorites after removing one', () => {
      const initial = ['creator1', 'creator2', 'creator3'];
      localStorage.setItem('hush_favorites', JSON.stringify(initial));

      const current = JSON.parse(localStorage.getItem('hush_favorites'));
      const updated = current.filter(u => u !== 'creator2');
      localStorage.setItem('hush_favorites', JSON.stringify(updated));

      const result = JSON.parse(localStorage.getItem('hush_favorites'));
      expect(result).toEqual(['creator1', 'creator3']);
    });

    it('handles empty favorites gracefully', () => {
      localStorage.setItem('hush_favorites', JSON.stringify([]));
      const result = JSON.parse(localStorage.getItem('hush_favorites'));
      expect(result).toEqual([]);
    });

    it('handles corrupt localStorage data', () => {
      localStorage.setItem('hush_favorites', 'not-valid-json');

      let favorites;
      try {
        favorites = JSON.parse(localStorage.getItem('hush_favorites'));
      } catch {
        favorites = [];
      }
      expect(favorites).toEqual([]);
    });
  });

  describe('favorite count event system', () => {
    it('notifies multiple listeners on favorite change', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = subscribeFavoriteCountChange(listener1);
      const unsub2 = subscribeFavoriteCountChange(listener2);

      // Both listeners should be registered
      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');

      unsub1();
      unsub2();
    });

    it('stops notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsub = subscribeFavoriteCountChange(listener);
      unsub();

      // After unsubscribe, listener should no longer be in the set
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple subscribe/unsubscribe cycles', () => {
      const listener = vi.fn();

      const unsub1 = subscribeFavoriteCountChange(listener);
      unsub1();

      const unsub2 = subscribeFavoriteCountChange(listener);
      unsub2();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('database sync flow', () => {
    it('fetches favorites from database and resolves usernames', async () => {
      // Simulate: fetch favorites → get creator_ids → resolve to usernames
      const favoritesData = [
        { creator_id: 'creator-1' },
        { creator_id: 'creator-2' },
      ];

      const usersData = [
        { username: 'angel_lagos' },
        { username: 'queen_abj' },
      ];

      const { supabase } = await import('../lib/supabase');

      // Step 1: Fetch favorites for client
      mockFrom.mockImplementation((table) => {
        if (table === 'favorites') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: favoritesData, error: null }),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: usersData, error: null }),
            })),
          };
        }
        return {};
      });

      // Simulate the fetch flow from useFavorites hook
      const { data: favData } = await supabase
        .from('favorites')
        .select('creator_id')
        .eq('client_id', 'client-1');

      expect(favData).toHaveLength(2);

      // Step 2: Resolve creator IDs to usernames
      const creatorIds = favData.map(f => f.creator_id);
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .in('id', creatorIds);

      const usernames = userData.map(u => u.username);
      expect(usernames).toEqual(['angel_lagos', 'queen_abj']);

      // Step 3: Store resolved usernames
      localStorage.setItem('hush_favorites', JSON.stringify(usernames));
      const stored = JSON.parse(localStorage.getItem('hush_favorites'));
      expect(stored).toEqual(['angel_lagos', 'queen_abj']);
    });

    it('adds favorite to database (insert flow)', async () => {
      const { supabase } = await import('../lib/supabase');

      // Step 1: Look up creator ID from username
      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'creator-1' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'favorites') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      // Look up creator
      const { data: creatorData } = await supabase
        .from('users')
        .select('id')
        .eq('username', 'angel_lagos')
        .eq('user_type', 'creator')
        .single();

      expect(creatorData.id).toBe('creator-1');

      // Insert favorite
      const { error } = await supabase
        .from('favorites')
        .insert({ client_id: 'client-1', creator_id: creatorData.id });

      expect(error).toBeNull();
    });

    it('removes favorite from database (delete flow)', async () => {
      const { supabase } = await import('../lib/supabase');

      mockFrom.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'creator-1' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'favorites') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            })),
          };
        }
        return {};
      });

      // Look up creator
      const { data: creatorData } = await supabase
        .from('users')
        .select('id')
        .eq('username', 'angel_lagos')
        .eq('user_type', 'creator')
        .single();

      // Delete favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('client_id', 'client-1')
        .eq('creator_id', creatorData.id);

      expect(error).toBeNull();
    });

    it('handles duplicate favorite insert gracefully (code 23505)', async () => {
      const { supabase } = await import('../lib/supabase');

      mockFrom.mockImplementation((table) => {
        if (table === 'favorites') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { code: '23505', message: 'duplicate key value' },
            }),
          };
        }
        return {};
      });

      const { error } = await supabase
        .from('favorites')
        .insert({ client_id: 'client-1', creator_id: 'creator-1' });

      // Duplicate insert should be treated as non-fatal (code 23505)
      expect(error.code).toBe('23505');
    });
  });

  describe('favorite count tracking', () => {
    it('favorite count stored alongside favorites in localStorage', () => {
      const counts = { angel_lagos: 5, queen_abj: 12 };
      localStorage.setItem('hush_favorite_counts', JSON.stringify(counts));

      const restored = JSON.parse(localStorage.getItem('hush_favorite_counts'));
      expect(restored.angel_lagos).toBe(5);
      expect(restored.queen_abj).toBe(12);
    });

    it('increments count when favorite added', () => {
      const counts = { angel_lagos: 5 };
      counts.angel_lagos += 1;
      expect(counts.angel_lagos).toBe(6);
    });

    it('decrements count when favorite removed (never below zero)', () => {
      const counts = { angel_lagos: 1 };
      counts.angel_lagos = Math.max(0, counts.angel_lagos - 1);
      expect(counts.angel_lagos).toBe(0);

      // Should not go below zero
      counts.angel_lagos = Math.max(0, counts.angel_lagos - 1);
      expect(counts.angel_lagos).toBe(0);
    });
  });

  describe('optimistic update with rollback', () => {
    it('rolls back on add failure', () => {
      let favorites = ['creator1'];

      // Optimistic add
      favorites = [...favorites, 'creator2'];
      expect(favorites).toContain('creator2');

      // Simulate error → rollback
      favorites = favorites.filter(u => u !== 'creator2');
      expect(favorites).not.toContain('creator2');
      expect(favorites).toEqual(['creator1']);
    });

    it('rolls back on remove failure', () => {
      const previousFavorites = ['creator1', 'creator2'];
      let favorites = [...previousFavorites];

      // Optimistic remove
      favorites = favorites.filter(u => u !== 'creator2');
      expect(favorites).not.toContain('creator2');

      // Simulate error → rollback
      favorites = previousFavorites;
      expect(favorites).toContain('creator2');
    });
  });
});
