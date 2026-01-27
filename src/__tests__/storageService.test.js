import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from '../services/storageService';

const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockListBuckets = vi.fn();
const mockCreateBucket = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    storage: {
      from: (...args) => mockStorageFrom(...args),
      listBuckets: (...args) => mockListBuckets(...args),
      createBucket: (...args) => mockCreateBucket(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('storageService.uploadCreatorPhoto', () => {
  it('uploads file, creates db record, and returns photo with URL', async () => {
    const mockUploadData = { path: 'creator-1/123456.jpg' };
    const mockPhotoRecord = {
      id: 'photo-1',
      storage_path: 'creator-1/123456.jpg',
      is_preview: false,
      display_order: 2,
    };

    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: mockUploadData, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/creator-1/123456.jpg' },
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: '1' }, { id: '2' }],
          error: null,
        }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockPhotoRecord, error: null }),
        })),
      })),
    });

    const file = { name: 'photo.jpg' };
    const result = await storageService.uploadCreatorPhoto('creator-1', file, false);

    expect(result.success).toBe(true);
    expect(result.photo.id).toBe('photo-1');
  });

  it('handles file without name extension', async () => {
    const mockUploadData = { path: 'creator-1/123456.jpg' };
    const mockPhotoRecord = { id: 'photo-1', storage_path: 'creator-1/123456.jpg' };

    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: mockUploadData, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockPhotoRecord, error: null }),
        })),
      })),
    });

    const file = {}; // no name
    const result = await storageService.uploadCreatorPhoto('creator-1', file);

    expect(result.success).toBe(true);
  });

  it('returns failure on upload error', async () => {
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      }),
    });

    const file = { name: 'photo.jpg' };
    const result = await storageService.uploadCreatorPhoto('creator-1', file);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Upload failed');
  });
});

describe('storageService.uploadCreatorPhotoBlob', () => {
  it('uploads blob and creates db record', async () => {
    const mockUploadData = { path: 'creator-1/123456.jpg' };
    const mockPhotoRecord = { id: 'photo-1', storage_path: 'creator-1/123456.jpg' };

    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: mockUploadData, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockPhotoRecord, error: null }),
        })),
      })),
    });

    const blob = new Blob(['image data'], { type: 'image/jpeg' });
    const result = await storageService.uploadCreatorPhotoBlob('creator-1', blob, true);

    expect(result.success).toBe(true);
  });

  it('returns failure on upload error', async () => {
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Blob upload failed' },
      }),
    });

    const blob = new Blob(['data']);
    const result = await storageService.uploadCreatorPhotoBlob('creator-1', blob);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Blob upload failed');
  });
});

describe('storageService.deleteCreatorPhoto', () => {
  it('deletes from storage and database', async () => {
    mockStorageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await storageService.deleteCreatorPhoto('photo-1', 'creator-1/photo.jpg');

    expect(result.success).toBe(true);
  });

  it('returns failure on storage delete error', async () => {
    mockStorageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ error: { message: 'Storage error' } }),
    });

    const result = await storageService.deleteCreatorPhoto('photo-1', 'creator-1/photo.jpg');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Storage error');
  });
});

describe('storageService.setPhotoPreview', () => {
  it('updates preview status and returns photo', async () => {
    const mockPhoto = { id: 'photo-1', is_preview: true };
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockPhoto, error: null }),
          })),
        })),
      })),
    });

    const result = await storageService.setPhotoPreview('photo-1', true);

    expect(result.success).toBe(true);
    expect(result.photo.is_preview).toBe(true);
  });

  it('returns failure on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          })),
        })),
      })),
    });

    const result = await storageService.setPhotoPreview('photo-1', true);

    expect(result.success).toBe(false);
  });
});

describe('storageService.reorderPhotos', () => {
  it('updates display order for multiple photos', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await storageService.reorderPhotos([
      { id: 'photo-1', display_order: 0 },
      { id: 'photo-2', display_order: 1 },
      { id: 'photo-3', display_order: 2 },
    ]);

    expect(result.success).toBe(true);
  });

  it('returns failure when any update fails', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn().mockRejectedValue(new Error('Update failed')),
      })),
    });

    const result = await storageService.reorderPhotos([
      { id: 'photo-1', display_order: 0 },
    ]);

    expect(result.success).toBe(false);
  });
});

describe('storageService.getCreatorPhotos', () => {
  it('returns all photos with URLs', async () => {
    const mockPhotos = [
      { id: '1', storage_path: 'creator-1/a.jpg', display_order: 0 },
      { id: '2', storage_path: 'creator-1/b.jpg', display_order: 1 },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPhotos, error: null });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    mockStorageFrom.mockReturnValue({
      getPublicUrl: vi.fn((path) => ({
        data: { publicUrl: `https://storage.example.com/${path}` },
      })),
    });

    const result = await storageService.getCreatorPhotos('creator-1');

    expect(result.success).toBe(true);
    expect(result.photos).toHaveLength(2);
    expect(result.photos[0]).toHaveProperty('url');
  });

  it('filters preview-only photos when flag is set', async () => {
    const mockPhotos = [
      { id: '1', storage_path: 'a.jpg', is_preview: true },
    ];
    // Chain: select → eq(creator_id) → order → eq(is_preview) → resolved
    const mockEqPreview = vi.fn().mockResolvedValue({ data: mockPhotos, error: null });
    const mockOrder = vi.fn(() => ({ eq: mockEqPreview }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    mockStorageFrom.mockReturnValue({
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://storage.example.com/a.jpg' },
      })),
    });

    const result = await storageService.getCreatorPhotos('creator-1', true);

    expect(result.success).toBe(true);
  });

  it('returns failure on error', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Fetch failed' },
    });
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: mockEq })),
    });

    const result = await storageService.getCreatorPhotos('creator-1');

    expect(result.success).toBe(false);
  });
});

describe('storageService.getPhotoUrl', () => {
  it('returns public URL for a storage path', () => {
    mockStorageFrom.mockReturnValue({
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/creator-1/photo.jpg' },
      }),
    });

    const url = storageService.getPhotoUrl('creator-1/photo.jpg');

    expect(url).toBe('https://storage.example.com/creator-1/photo.jpg');
  });
});

describe('storageService.getSignedPhotoUrl', () => {
  it('returns signed URL with default expiry', async () => {
    mockStorageFrom.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/photo.jpg' },
        error: null,
      }),
    });

    const result = await storageService.getSignedPhotoUrl('creator-1/photo.jpg');

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://storage.example.com/signed/photo.jpg');
  });

  it('returns failure on error', async () => {
    mockStorageFrom.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Signing failed' },
      }),
    });

    const result = await storageService.getSignedPhotoUrl('creator-1/photo.jpg');

    expect(result.success).toBe(false);
  });
});

describe('storageService.ensureBucketExists', () => {
  it('does nothing when bucket already exists', async () => {
    mockListBuckets.mockResolvedValue({
      data: [{ name: 'creator-photos' }],
      error: null,
    });

    const result = await storageService.ensureBucketExists();

    expect(result.success).toBe(true);
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it('creates bucket when it does not exist', async () => {
    mockListBuckets.mockResolvedValue({
      data: [{ name: 'other-bucket' }],
      error: null,
    });
    mockCreateBucket.mockResolvedValue({ error: null });

    const result = await storageService.ensureBucketExists();

    expect(result.success).toBe(true);
    expect(mockCreateBucket).toHaveBeenCalledWith('creator-photos', {
      public: false,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  });

  it('returns failure when listing buckets fails', async () => {
    mockListBuckets.mockResolvedValue({
      data: null,
      error: { message: 'List failed' },
    });

    const result = await storageService.ensureBucketExists();

    expect(result.success).toBe(false);
  });

  it('returns failure when creating bucket fails', async () => {
    mockListBuckets.mockResolvedValue({
      data: [],
      error: null,
    });
    mockCreateBucket.mockResolvedValue({ error: { message: 'Create failed' } });

    const result = await storageService.ensureBucketExists();

    expect(result.success).toBe(false);
  });
});
