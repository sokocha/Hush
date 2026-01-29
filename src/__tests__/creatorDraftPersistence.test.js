import { describe, it, expect, beforeEach } from 'vitest';

const CREATOR_DRAFT_KEY = 'hush_creator_draft';

const DEFAULT_CREATOR_DATA = {
  name: '', username: '', tagline: '', location: '', areas: [],
  bodyType: '', skinTone: '', height: '', age: '',
  services: [], boundaries: [], bio: '',
};

// Helper: simulates the draft save logic from AuthPage
function saveCreatorDraft(data) {
  try {
    localStorage.setItem(CREATOR_DRAFT_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

// Helper: simulates the draft load logic from AuthPage useState initializer
function loadCreatorDraft() {
  try {
    const draft = localStorage.getItem(CREATOR_DRAFT_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      return { ...DEFAULT_CREATOR_DATA, ...parsed };
    }
  } catch (e) { /* ignore parse errors */ }
  return { ...DEFAULT_CREATOR_DATA };
}

// Helper: simulates draft detection
function hasDraft() {
  try {
    return !!localStorage.getItem(CREATOR_DRAFT_KEY);
  } catch {
    return false;
  }
}

// Helper: simulates clearing draft
function clearCreatorDraft() {
  try {
    localStorage.removeItem(CREATOR_DRAFT_KEY);
  } catch (e) { /* ignore */ }
}

beforeEach(() => {
  localStorage.clear();
});

describe('creator draft persistence', () => {
  describe('saving drafts', () => {
    it('saves creator data to localStorage', () => {
      const data = { ...DEFAULT_CREATOR_DATA, name: 'Destiny', username: 'destiny_x' };
      saveCreatorDraft(data);

      const stored = localStorage.getItem(CREATOR_DRAFT_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed.name).toBe('Destiny');
      expect(parsed.username).toBe('destiny_x');
    });

    it('overwrites previous draft on save', () => {
      saveCreatorDraft({ ...DEFAULT_CREATOR_DATA, name: 'First' });
      saveCreatorDraft({ ...DEFAULT_CREATOR_DATA, name: 'Second' });

      const parsed = JSON.parse(localStorage.getItem(CREATOR_DRAFT_KEY));
      expect(parsed.name).toBe('Second');
    });

    it('persists all creator fields', () => {
      const fullData = {
        name: 'Destiny', username: 'destiny_x', tagline: 'Hey there',
        location: 'Lagos', areas: ['Lekki', 'VI'],
        bodyType: 'Slim', skinTone: 'Caramel', height: '5\'5"-5\'8"', age: '24',
        services: ['gfe', 'dinner'], boundaries: ['No bareback'], bio: 'A short bio here.',
      };
      saveCreatorDraft(fullData);

      const parsed = JSON.parse(localStorage.getItem(CREATOR_DRAFT_KEY));
      expect(parsed.location).toBe('Lagos');
      expect(parsed.areas).toEqual(['Lekki', 'VI']);
      expect(parsed.services).toEqual(['gfe', 'dinner']);
      expect(parsed.boundaries).toEqual(['No bareback']);
    });
  });

  describe('loading drafts', () => {
    it('returns saved data merged with defaults', () => {
      localStorage.setItem(CREATOR_DRAFT_KEY, JSON.stringify({
        name: 'Destiny', username: 'destiny_x', location: 'Lagos',
      }));

      const loaded = loadCreatorDraft();
      expect(loaded.name).toBe('Destiny');
      expect(loaded.username).toBe('destiny_x');
      expect(loaded.location).toBe('Lagos');
      // Fields not in draft should have defaults
      expect(loaded.areas).toEqual([]);
      expect(loaded.bodyType).toBe('');
      expect(loaded.services).toEqual([]);
    });

    it('returns defaults when no draft exists', () => {
      const loaded = loadCreatorDraft();
      expect(loaded).toEqual(DEFAULT_CREATOR_DATA);
    });

    it('returns defaults for corrupted JSON', () => {
      localStorage.setItem(CREATOR_DRAFT_KEY, 'not-valid-json{{{');

      const loaded = loadCreatorDraft();
      expect(loaded).toEqual(DEFAULT_CREATOR_DATA);
    });

    it('returns defaults for empty string draft', () => {
      localStorage.setItem(CREATOR_DRAFT_KEY, '');

      const loaded = loadCreatorDraft();
      expect(loaded).toEqual(DEFAULT_CREATOR_DATA);
    });
  });

  describe('detecting drafts', () => {
    it('returns true when draft exists', () => {
      saveCreatorDraft({ ...DEFAULT_CREATOR_DATA, name: 'Test' });
      expect(hasDraft()).toBe(true);
    });

    it('returns false when no draft exists', () => {
      expect(hasDraft()).toBe(false);
    });

    it('returns false after clearing draft', () => {
      saveCreatorDraft({ ...DEFAULT_CREATOR_DATA, name: 'Test' });
      expect(hasDraft()).toBe(true);

      clearCreatorDraft();
      expect(hasDraft()).toBe(false);
    });
  });

  describe('clearing drafts', () => {
    it('removes draft from localStorage', () => {
      saveCreatorDraft({ ...DEFAULT_CREATOR_DATA, name: 'Destiny' });
      expect(localStorage.getItem(CREATOR_DRAFT_KEY)).not.toBeNull();

      clearCreatorDraft();
      expect(localStorage.getItem(CREATOR_DRAFT_KEY)).toBeNull();
    });

    it('does not throw when no draft to clear', () => {
      expect(() => clearCreatorDraft()).not.toThrow();
    });
  });

  describe('draft lifecycle: save → load → clear', () => {
    it('completes a full save-load-clear cycle', () => {
      // Step 1: No draft initially
      expect(hasDraft()).toBe(false);

      // Step 2: After profile1 - save basic info
      const afterStep1 = { ...DEFAULT_CREATOR_DATA, name: 'Destiny', username: 'destiny_x', location: 'Lagos', areas: ['Lekki'] };
      saveCreatorDraft(afterStep1);
      expect(hasDraft()).toBe(true);

      // Step 3: After profile2 - save physical attributes
      const afterStep2 = { ...afterStep1, bodyType: 'Slim', age: '24' };
      saveCreatorDraft(afterStep2);

      // Step 4: Load on return - all data preserved
      const loaded = loadCreatorDraft();
      expect(loaded.name).toBe('Destiny');
      expect(loaded.bodyType).toBe('Slim');
      expect(loaded.age).toBe('24');
      expect(loaded.location).toBe('Lagos');

      // Step 5: Clear after successful registration
      clearCreatorDraft();
      expect(hasDraft()).toBe(false);
      expect(loadCreatorDraft()).toEqual(DEFAULT_CREATOR_DATA);
    });
  });
});
