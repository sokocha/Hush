import { PLATFORM_CONFIG } from '../data/models';
import { storageService } from '../services/storageService';

/**
 * Transform a database creator record into the CONFIG format used by the model detail page.
 * Extracted from App.jsx for testability.
 */
export function transformDbCreatorToConfig(dbData) {
  if (!dbData || !dbData.creators) return null;

  const creator = dbData.creators;
  const photos = creator.creator_photos || [];
  const previewPhotos = photos.filter(p => p.is_preview);

  return {
    platform: PLATFORM_CONFIG,
    creatorId: creator.id,
    profile: {
      name: dbData.name,
      username: dbData.username,
      tagline: creator.tagline || '',
      bio: creator.bio || '',
      isVerified: creator.is_verified || creator.is_video_verified,
      isStudioVerified: creator.is_studio_verified,
      isOnline: dbData.last_seen_at ? (Date.now() - new Date(dbData.last_seen_at).getTime() < 15 * 60 * 1000) : false,
      isAvailable: creator.is_available !== false,
      location: creator.location || 'Lagos',
      areas: creator.creator_areas?.map(a => a.area) || [],
      bodyType: creator.body_type || null,
      skinTone: creator.skin_tone || null,
      age: creator.age || null,
      height: creator.height || null,
      services: creator.services || [],
    },
    stats: {
      rating: parseFloat(creator.rating) || 4.8,
      reviews: creator.reviews_count || 0,
      verifiedMeetups: creator.verified_meetups || 0,
      meetupSuccessRate: parseFloat(creator.meetup_success_rate) || 98,
      profileViews: creator.profile_views || 0,
      favoriteCount: creator.favorite_count || 0,
    },
    contact: {
      phone: dbData.phone,
      whatsapp: dbData.phone?.replace(/^0/, '234'),
    },
    pricing: creator.pricing || {
      unlockContact: 5000,
      unlockPhotos: 3000,
      meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
      meetupOutcall: null,
    },
    extras: creator.creator_extras?.map(e => ({
      id: e.id,
      name: e.name,
      price: parseFloat(e.price),
    })) || [],
    boundaries: creator.creator_boundaries?.map(b => b.boundary) || [],
    photos: {
      total: photos.length,
      previewCount: previewPhotos.length,
      previewImages: previewPhotos.map(p => storageService.getPhotoUrl(p.storage_path)),
      lockedImages: photos.filter(p => !p.is_preview).map(p => storageService.getPhotoUrl(p.storage_path)),
    },
    schedule: creator.schedule,
    reviews: [],
    blacklistedClients: [],
    freeMessages: 3,
  };
}
