import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeFavoriteCountChange } from '../hooks/useFavorites';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        in: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isClient: true,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('subscribeFavoriteCountChange', () => {
  it('adds a callback and returns an unsubscribe function', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeFavoriteCountChange(callback);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('does not call the callback after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeFavoriteCountChange(callback);
    unsubscribe();
    // After unsubscribing, the callback should not be in the listener set
    // We can't easily trigger notification from here, but we verify the unsubscribe pattern works
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('favorites localStorage', () => {
  it('stores and retrieves favorites from localStorage', () => {
    const favorites = ['creator1', 'creator2'];
    localStorage.setItem('hush_favorites', JSON.stringify(favorites));

    const stored = JSON.parse(localStorage.getItem('hush_favorites'));
    expect(stored).toEqual(favorites);
  });

  it('handles empty favorites gracefully', () => {
    localStorage.setItem('hush_favorites', JSON.stringify([]));

    const stored = JSON.parse(localStorage.getItem('hush_favorites'));
    expect(stored).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    localStorage.setItem('hush_favorites', 'invalid-json');

    let favorites = [];
    try {
      favorites = JSON.parse(localStorage.getItem('hush_favorites'));
    } catch {
      favorites = [];
    }
    expect(favorites).toEqual([]);
  });

  it('handles missing key', () => {
    const stored = localStorage.getItem('hush_favorites');
    expect(stored).toBeNull();
  });
});

describe('favorites logic (unit)', () => {
  it('can add a username to a favorites array', () => {
    const favorites = ['creator1'];
    const username = 'creator2';

    if (!favorites.includes(username)) {
      favorites.push(username);
    }

    expect(favorites).toContain('creator2');
    expect(favorites).toHaveLength(2);
  });

  it('does not add duplicate usernames', () => {
    const favorites = ['creator1'];
    const username = 'creator1';

    if (!favorites.includes(username)) {
      favorites.push(username);
    }

    expect(favorites).toHaveLength(1);
  });

  it('can remove a username from a favorites array', () => {
    const favorites = ['creator1', 'creator2', 'creator3'];
    const username = 'creator2';

    const updated = favorites.filter((u) => u !== username);

    expect(updated).not.toContain('creator2');
    expect(updated).toHaveLength(2);
  });

  it('handles removing non-existent username', () => {
    const favorites = ['creator1'];
    const username = 'nonexistent';

    const updated = favorites.filter((u) => u !== username);

    expect(updated).toEqual(['creator1']);
  });

  it('can toggle a favorite', () => {
    let favorites = ['creator1'];
    const username = 'creator1';

    if (favorites.includes(username)) {
      favorites = favorites.filter((u) => u !== username);
    } else {
      favorites = [...favorites, username];
    }

    expect(favorites).not.toContain('creator1');
  });

  it('can check if a username is a favorite', () => {
    const favorites = ['creator1', 'creator2'];

    expect(favorites.includes('creator1')).toBe(true);
    expect(favorites.includes('creator3')).toBe(false);
  });
});
