import { describe, it, expect } from 'vitest';

/**
 * Photo URL resolution logic from App.jsx PhotoGalleryModal.
 * Tests the index → URL mapping for preview vs locked photos,
 * lock status determination, and boundary conditions.
 */

// Mirrors the resolution logic in App.jsx (PhotoGalleryModal, ~line 220)
const resolvePhotoUrl = (photos, currentIndex) => {
  const previewCount = photos?.previewCount || 0;
  const isPreview = currentIndex < previewCount;
  return isPreview
    ? photos?.previewImages?.[currentIndex]
    : photos?.lockedImages?.[currentIndex - previewCount];
};

// Mirrors lock status check in App.jsx (~line 162)
const isPhotoLocked = (currentIndex, previewCount, photosUnlocked) => {
  return !photosUnlocked && currentIndex >= previewCount;
};

// Mirrors navigation bounds
const clampIndex = (index, totalPhotos) => {
  return Math.max(0, Math.min(index, totalPhotos - 1));
};

const makePhotos = (previewUrls = [], lockedUrls = []) => ({
  total: previewUrls.length + lockedUrls.length,
  previewCount: previewUrls.length,
  previewImages: previewUrls,
  lockedImages: lockedUrls,
});

describe('resolvePhotoUrl', () => {
  const photos = makePhotos(
    ['preview-1.jpg', 'preview-2.jpg'],
    ['locked-1.jpg', 'locked-2.jpg', 'locked-3.jpg']
  );

  describe('preview photos', () => {
    it('resolves first preview photo at index 0', () => {
      expect(resolvePhotoUrl(photos, 0)).toBe('preview-1.jpg');
    });

    it('resolves second preview photo at index 1', () => {
      expect(resolvePhotoUrl(photos, 1)).toBe('preview-2.jpg');
    });
  });

  describe('locked photos', () => {
    it('resolves first locked photo at index 2 (after 2 previews)', () => {
      expect(resolvePhotoUrl(photos, 2)).toBe('locked-1.jpg');
    });

    it('resolves second locked photo at index 3', () => {
      expect(resolvePhotoUrl(photos, 3)).toBe('locked-2.jpg');
    });

    it('resolves last locked photo at index 4', () => {
      expect(resolvePhotoUrl(photos, 4)).toBe('locked-3.jpg');
    });
  });

  describe('boundary: last preview / first locked', () => {
    it('index (previewCount - 1) is last preview', () => {
      const idx = photos.previewCount - 1;
      expect(resolvePhotoUrl(photos, idx)).toBe('preview-2.jpg');
    });

    it('index (previewCount) is first locked', () => {
      const idx = photos.previewCount;
      expect(resolvePhotoUrl(photos, idx)).toBe('locked-1.jpg');
    });
  });

  describe('edge cases', () => {
    it('returns undefined for index beyond total', () => {
      expect(resolvePhotoUrl(photos, 10)).toBeUndefined();
    });

    it('handles photos with no preview images', () => {
      const noPreview = makePhotos([], ['locked.jpg']);
      expect(resolvePhotoUrl(noPreview, 0)).toBe('locked.jpg');
    });

    it('handles photos with no locked images', () => {
      const noLocked = makePhotos(['preview.jpg'], []);
      expect(resolvePhotoUrl(noLocked, 0)).toBe('preview.jpg');
      expect(resolvePhotoUrl(noLocked, 1)).toBeUndefined();
    });

    it('handles empty photos object', () => {
      const empty = makePhotos([], []);
      expect(resolvePhotoUrl(empty, 0)).toBeUndefined();
    });

    it('handles null photos', () => {
      expect(resolvePhotoUrl(null, 0)).toBeUndefined();
    });

    it('handles undefined photos', () => {
      expect(resolvePhotoUrl(undefined, 0)).toBeUndefined();
    });

    it('handles single preview photo only', () => {
      const single = makePhotos(['only.jpg'], []);
      expect(resolvePhotoUrl(single, 0)).toBe('only.jpg');
    });
  });
});

describe('isPhotoLocked', () => {
  it('preview photo is never locked', () => {
    expect(isPhotoLocked(0, 2, false)).toBe(false);
    expect(isPhotoLocked(1, 2, false)).toBe(false);
  });

  it('locked photo is locked when not unlocked', () => {
    expect(isPhotoLocked(2, 2, false)).toBe(true);
    expect(isPhotoLocked(3, 2, false)).toBe(true);
  });

  it('locked photo is not locked after unlock', () => {
    expect(isPhotoLocked(2, 2, true)).toBe(false);
    expect(isPhotoLocked(5, 2, true)).toBe(false);
  });

  it('all photos accessible when unlocked', () => {
    for (let i = 0; i < 5; i++) {
      expect(isPhotoLocked(i, 2, true)).toBe(false);
    }
  });

  it('boundary: index exactly at previewCount is locked', () => {
    expect(isPhotoLocked(3, 3, false)).toBe(true);
  });

  it('boundary: index just below previewCount is not locked', () => {
    expect(isPhotoLocked(2, 3, false)).toBe(false);
  });

  it('zero preview count means all locked', () => {
    expect(isPhotoLocked(0, 0, false)).toBe(true);
  });
});

describe('clampIndex (navigation bounds)', () => {
  it('clamps negative index to 0', () => {
    expect(clampIndex(-1, 5)).toBe(0);
  });

  it('clamps index beyond total to last', () => {
    expect(clampIndex(10, 5)).toBe(4);
  });

  it('keeps valid index unchanged', () => {
    expect(clampIndex(2, 5)).toBe(2);
  });

  it('first index is 0', () => {
    expect(clampIndex(0, 5)).toBe(0);
  });

  it('last index is total - 1', () => {
    expect(clampIndex(4, 5)).toBe(4);
  });

  it('single photo: index clamped to 0', () => {
    expect(clampIndex(0, 1)).toBe(0);
    expect(clampIndex(1, 1)).toBe(0);
  });
});
