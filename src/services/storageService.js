import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'creator-photos';

export const storageService = {
  /**
   * Upload a photo for a creator
   */
  async uploadCreatorPhoto(creatorId, file, isPreview = false) {
    try {
      // Generate unique filename
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const fileName = `${creatorId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the current photo count for display_order
      const { data: photos, error: countError } = await supabase
        .from('creator_photos')
        .select('id')
        .eq('creator_id', creatorId);

      if (countError) throw countError;

      const displayOrder = photos ? photos.length : 0;

      // Create database record
      const { data: photoRecord, error: dbError } = await supabase
        .from('creator_photos')
        .insert({
          creator_id: creatorId,
          storage_path: uploadData.path,
          is_preview: isPreview,
          display_order: displayOrder,
          captured_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        photo: {
          ...photoRecord,
          url: this.getPhotoUrl(uploadData.path),
        },
      };
    } catch (error) {
      console.error('Error uploading creator photo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload a photo from a blob (for camera captures)
   */
  async uploadCreatorPhotoBlob(creatorId, blob, isPreview = false) {
    try {
      console.log('[StorageService] Starting photo upload for creator:', creatorId);

      // Ensure bucket exists first
      const bucketResult = await this.ensureBucketExists();
      if (!bucketResult.success) {
        console.error('[StorageService] Failed to ensure bucket exists:', bucketResult.error);
        // Continue anyway - bucket might already exist but we don't have permission to list
      }

      // Generate unique filename
      const fileName = `${creatorId}/${Date.now()}.jpg`;
      console.log('[StorageService] Uploading to path:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[StorageService] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[StorageService] Upload successful, path:', uploadData.path);

      // Get the current photo count for display_order
      let displayOrder = 0;
      try {
        const { data: photos, error: countError } = await supabase
          .from('creator_photos')
          .select('id')
          .eq('creator_id', creatorId);

        if (countError) {
          console.error('[StorageService] Error counting photos:', countError);
          // Continue with displayOrder = 0
        } else {
          displayOrder = photos ? photos.length : 0;
        }
      } catch (countErr) {
        console.error('[StorageService] Exception counting photos:', countErr);
        // Continue with displayOrder = 0
      }

      console.log('[StorageService] Display order for new photo:', displayOrder);

      // Create database record
      const { data: photoRecord, error: dbError } = await supabase
        .from('creator_photos')
        .insert({
          creator_id: creatorId,
          storage_path: uploadData.path,
          is_preview: isPreview,
          display_order: displayOrder,
          captured_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error('[StorageService] Database insert error:', dbError);
        // Photo was uploaded to storage but DB record failed
        // Return success with storage URL so photo isn't lost
        const publicUrl = this.getPhotoUrl(uploadData.path);
        console.log('[StorageService] Returning storage-only photo with URL:', publicUrl);
        return {
          success: true,
          photo: {
            id: Date.now().toString(),
            storage_path: uploadData.path,
            url: publicUrl,
            is_preview: isPreview,
            display_order: displayOrder,
          },
        };
      }

      console.log('[StorageService] Photo record created:', photoRecord.id);
      return {
        success: true,
        photo: {
          ...photoRecord,
          url: this.getPhotoUrl(uploadData.path),
        },
      };
    } catch (error) {
      console.error('[StorageService] Error uploading creator photo blob:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a creator photo
   */
  async deleteCreatorPhoto(photoId, storagePath) {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from('creator_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting creator photo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update photo preview status
   */
  async setPhotoPreview(photoId, isPreview) {
    try {
      const { data, error } = await supabase
        .from('creator_photos')
        .update({ is_preview: isPreview })
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, photo: data };
    } catch (error) {
      console.error('Error updating photo preview status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reorder photos
   */
  async reorderPhotos(photoOrders) {
    try {
      // photoOrders is an array of { id, display_order }
      const updates = photoOrders.map(({ id, display_order }) =>
        supabase
          .from('creator_photos')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error reordering photos:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all photos for a creator
   */
  async getCreatorPhotos(creatorId, previewOnly = false) {
    try {
      let query = supabase
        .from('creator_photos')
        .select('*')
        .eq('creator_id', creatorId)
        .order('display_order', { ascending: true });

      if (previewOnly) {
        query = query.eq('is_preview', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add URLs to photos
      const photosWithUrls = data.map((photo) => ({
        ...photo,
        url: this.getPhotoUrl(photo.storage_path),
      }));

      return { success: true, photos: photosWithUrls };
    } catch (error) {
      console.error('Error getting creator photos:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get public URL for a photo
   */
  getPhotoUrl(storagePath) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return data.publicUrl;
  },

  /**
   * Get signed URL for private photo access (when unlocked)
   */
  async getSignedPhotoUrl(storagePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresIn);

      if (error) throw error;
      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if bucket exists and create if not
   */
  async ensureBucketExists() {
    try {
      console.log('[StorageService] Checking if bucket exists:', BUCKET_NAME);
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('[StorageService] Error listing buckets:', listError);
        // This might fail due to permissions, but bucket might still exist
        return { success: true }; // Continue anyway
      }

      const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);
      console.log('[StorageService] Bucket exists:', bucketExists);

      if (!bucketExists) {
        console.log('[StorageService] Creating bucket:', BUCKET_NAME);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true, // Make public so getPublicUrl works
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });

        if (createError) {
          console.error('[StorageService] Error creating bucket:', createError);
          // Bucket might already exist, continue anyway
          if (!createError.message?.includes('already exists')) {
            throw createError;
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return { success: false, error: error.message };
    }
  },
};

export default storageService;
