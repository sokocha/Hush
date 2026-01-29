import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, CheckCircle, Shield, Filter,
  ChevronLeft, ChevronRight, Search, Target,
  TrendingUp, Heart, Clock, Users, Sparkles, X, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { getModelsList, getLocations, getAllExtras, PLATFORM_CONFIG } from '../data/models';
import useFavorites, { useFavoriteCount } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { getTopMatches, addMatchPercentages } from '../utils/matchingAlgorithm';
import { supabase } from '../lib/supabase';
import { storageService } from '../services/storageService';

// Get models from shared data store
const HARDCODED_MODELS = getModelsList();

// How many days the "New" badge shows on a creator's profile
const NEW_TAG_DURATION_DAYS = 14;

// Transform database creator to model format
const transformCreatorToModel = (creator, user) => {
  const photos = creator.creator_photos || [];
  const previewPhotos = photos.filter(p => p.is_preview);
  const profilePhoto = previewPhotos[0] || photos[0];
  const areas = (creator.creator_areas || []).map(a => a.area);

  return {
    id: `creator-${creator.id}`,
    username: user?.username || creator.id,
    name: user?.name || creator.display_name || 'New Model',
    tagline: creator.tagline || 'New on the platform',
    location: creator.location || 'Lagos',
    areas: areas,
    isOnline: user?.last_seen_at ? (Date.now() - new Date(user.last_seen_at).getTime() < 15 * 60 * 1000) : false,
    isAvailable: creator.is_available !== false,
    isVideoVerified: creator.is_video_verified || false,
    isStudioVerified: creator.is_studio_verified || false,
    rating: creator.rating || 0,
    verifiedMeetups: creator.verified_meetups || 0,
    meetupSuccessRate: creator.meetup_success_rate || 0,
    startingPrice: creator.pricing?.meetupIncall?.[1] || 0,
    hasOutcall: !!creator.pricing?.meetupOutcall,
    extras: (creator.creator_extras || []).map(e => ({ name: e.name, price: e.price })),
    profilePhotoUrl: profilePhoto?.storage_path ? storageService.getPhotoUrl(profilePhoto.storage_path) : null,
    isNew: user?.created_at
      ? (Date.now() - new Date(user.created_at).getTime() < NEW_TAG_DURATION_DAYS * 24 * 60 * 60 * 1000)
      : false,
    // Attributes for matching
    bodyType: creator.body_type || null,
    skinTone: creator.skin_tone || null,
    age: creator.age || null,
    height: creator.height || null,
    services: creator.services || [],
    favoriteCount: creator.favorite_count || 0,
  };
};

const ALL_EXTRAS = getAllExtras();

// Price range options
const PRICE_RANGES = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under ₦50k", min: 0, max: 50000 },
  { label: "₦50k - ₦75k", min: 50000, max: 75000 },
  { label: "₦75k - ₦100k", min: 75000, max: 100000 },
  { label: "Over ₦100k", min: 100000, max: Infinity },
];

// Body type options
const BODY_TYPES = ['Slim', 'Petite', 'Athletic', 'Curvy', 'Thick'];

// Skin tone options
const SKIN_TONES = ['Light', 'Caramel', 'Dark'];

// Age range options
const AGE_RANGES = [
  { label: '18-22', min: 18, max: 22 },
  { label: '23-27', min: 23, max: 27 },
  { label: '28-32', min: 28, max: 32 },
  { label: '33-40', min: 33, max: 40 },
  { label: '40+', min: 40, max: 99 },
];

// Services options (common ones)
const SERVICES = ['GFE', 'Oral', 'Anal', 'BDSM', 'Massage', 'Duo', 'Roleplay', 'Dinner date', 'Travel companion'];

// Build locations dynamically from models data
const getLocationsWithCounts = (models) => [
  { name: "All", slug: "all", count: models.length },
  { name: "Lagos", slug: "lagos", count: models.filter(m => m.location === "Lagos").length },
  { name: "Abuja", slug: "abuja", count: models.filter(m => m.location === "Abuja").length },
  { name: "Port Harcourt", slug: "port-harcourt", count: models.filter(m => m.location === "Port Harcourt").length },
];

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

const ModelCard = ({ model, isFavorite, onToggleFavorite, showMatchBadge = false }) => {
  const favoriteCount = useFavoriteCount(model.username, model.favoriteCount);

  return (
  <div className="relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-pink-500/30 hover:bg-white/10 transition-all group">
    <Link to={`/model/${model.username}`} className="block">
      {/* Photo */}
      <div className="aspect-[3/4] bg-gradient-to-br from-pink-500/30 to-purple-500/30 relative">
        {model.profilePhotoUrl ? (
          <img
            src={model.profilePhotoUrl}
            alt={model.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/30">{model.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* Gradient overlay for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Status badges — capped to key signals only */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {showMatchBadge && model.matchPercentage > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium">
              <Sparkles size={10} />
              {model.matchPercentage}% match
            </span>
          )}
          {model.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/90 text-white text-xs font-medium">
              <Sparkles size={10} />
              New
            </span>
          )}
          {model.isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Verification badge — single merged checkmark */}
        {(model.isVideoVerified || model.isStudioVerified) && (
          <div className="absolute top-3 right-3">
            <span className="p-1.5 rounded-full bg-blue-500/80">
              <CheckCircle size={12} className="text-white" />
            </span>
          </div>
        )}

        {/* Bottom-left: price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-semibold text-sm drop-shadow-lg">{formatNaira(model.startingPrice)}/hr</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="text-white font-semibold text-base group-hover:text-pink-300 transition-colors leading-tight">{model.name}</h3>
          <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0 ml-2">
            <Star size={12} className="fill-yellow-400" />
            <span className="text-white text-xs font-medium">{model.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
          <MapPin size={11} className="flex-shrink-0" />
          <span className="truncate">{model.location}{model.areas.length > 0 ? ` · ${model.areas.slice(0, 2).join(", ")}` : ''}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/40">
            {model.verifiedMeetups > 0 && model.meetupSuccessRate > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <Target size={11} />
                {model.meetupSuccessRate}%
              </span>
            )}
            <span>{model.verifiedMeetups} meetups</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Heart size={10} className="text-pink-400 fill-pink-400" />
            {favoriteCount}
          </span>
        </div>
      </div>
    </Link>

    {/* Favorite button */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(model.username);
      }}
      className={`absolute bottom-[3.5rem] right-3 p-2 rounded-full transition-all z-10 ${
        isFavorite
          ? 'bg-pink-500 text-white'
          : 'bg-black/60 backdrop-blur-sm text-white/70 hover:text-pink-400 hover:bg-black/80'
      }`}
    >
      <Heart size={16} className={isFavorite ? 'fill-white' : ''} />
    </button>
  </div>
  );
};

export default function ExplorePage() {
  const { location } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0]);
  const [showOutcallOnly, setShowOutcallOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // New attribute filters
  const [selectedBodyTypes, setSelectedBodyTypes] = useState([]);
  const [selectedSkinTones, setSelectedSkinTones] = useState([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated, isCreator, isClient, user } = useAuth();
  const navigate = useNavigate();

  // Registration prompt modal for visitors
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [registerPromptMessage, setRegisterPromptMessage] = useState('');

  // Platform stats for social proof (fetched from DB)
  const [platformStats, setPlatformStats] = useState({ members: 0, bookings: 0 });

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const [membersResult, bookingsResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'client'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
        ]);
        setPlatformStats({
          members: membersResult.count || 0,
          bookings: bookingsResult.count || 0,
        });
      } catch (err) {
        console.error('[ExplorePage] Error fetching platform stats:', err);
      }
    };
    fetchPlatformStats();
  }, []);

  const guardedToggleFavorite = (username) => {
    if (!isAuthenticated) {
      setRegisterPromptMessage(`Create a free account to save models to your favorites.`);
      setShowRegisterPrompt(true);
      return;
    }
    toggleFavorite(username);
  };

  // State for database creators
  const [dbCreators, setDbCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  // Fetch creators from database
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setCreatorsLoading(true);
        console.log('[ExplorePage] Fetching creators from database...');

        // First get all creators
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('creators')
          .select(`
            *,
            creator_areas(area),
            creator_photos(id, storage_path, is_preview, display_order),
            creator_extras(id, name, price)
          `);

        if (creatorsError) {
          console.error('[ExplorePage] Error fetching creators:', creatorsError);
          return;
        }

        console.log('[ExplorePage] Raw creators data:', creatorsData);

        if (creatorsData && creatorsData.length > 0) {
          // Get user data for each creator
          const creatorIds = creatorsData.map(c => c.id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, username, last_seen_at, created_at')
            .in('id', creatorIds);

          if (usersError) {
            console.error('[ExplorePage] Error fetching users:', usersError);
          }

          console.log('[ExplorePage] Users data:', usersData);

          // Create a map of user data by ID
          const usersMap = {};
          if (usersData) {
            usersData.forEach(u => { usersMap[u.id] = u; });
          }

          // Transform creators with user data
          const transformedCreators = creatorsData.map(creator => {
            const userData = usersMap[creator.id];
            return transformCreatorToModel(creator, userData);
          });

          console.log('[ExplorePage] Transformed creators:', transformedCreators);
          setDbCreators(transformedCreators);
        } else {
          console.log('[ExplorePage] No creators found in database');
        }
      } catch (err) {
        console.error('[ExplorePage] Error fetching creators:', err);
      } finally {
        setCreatorsLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Combine hardcoded models with database creators
  const allModels = useMemo(() => {
    return [...HARDCODED_MODELS, ...dbCreators];
  }, [dbCreators]);

  // Get dynamic location counts
  const LOCATIONS = useMemo(() => getLocationsWithCounts(allModels), [allModels]);

  // Get client preferences and compute matches
  const clientPreferences = useMemo(() => {
    if (isClient && user?.preferences) {
      console.log('[Matching] Client preferences:', user.preferences);
      return user.preferences;
    }
    console.log('[Matching] No preferences - isClient:', isClient, 'user?.preferences:', user?.preferences);
    return null;
  }, [isClient, user]);

  // Get top matches for "For You" section
  const forYouMatches = useMemo(() => {
    if (!clientPreferences) return [];
    const matches = getTopMatches(clientPreferences, allModels, 6);
    console.log('[Matching] For You matches:', matches.length, matches.map(m => ({ name: m.name, match: m.matchPercentage })));
    return matches;
  }, [clientPreferences, allModels]);

  // Add match percentages to all models for display
  const allModelsWithMatch = useMemo(() => {
    if (!clientPreferences) return allModels;
    return addMatchPercentages(clientPreferences, allModels);
  }, [clientPreferences, allModels]);

  // Determine the correct dashboard link based on user type
  const dashboardLink = isCreator ? '/creator-dashboard' : '/dashboard';

  // Toggle extra selection
  const toggleExtra = (extra) => {
    setSelectedExtras(prev =>
      prev.includes(extra)
        ? prev.filter(e => e !== extra)
        : [...prev, extra]
    );
  };

  // Toggle body type selection
  const toggleBodyType = (type) => {
    setSelectedBodyTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle skin tone selection
  const toggleSkinTone = (tone) => {
    setSelectedSkinTones(prev =>
      prev.includes(tone)
        ? prev.filter(t => t !== tone)
        : [...prev, tone]
    );
  };

  // Toggle age range selection
  const toggleAgeRange = (range) => {
    setSelectedAgeRanges(prev =>
      prev.includes(range)
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
  };

  // Toggle service selection
  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setShowOnlineOnly(false);
    setShowAvailableOnly(false);
    setSelectedExtras([]);
    setPriceRange(PRICE_RANGES[0]);
    setShowOutcallOnly(false);
    setShowFavoritesOnly(false);
    setSelectedBodyTypes([]);
    setSelectedSkinTones([]);
    setSelectedAgeRanges([]);
    setSelectedServices([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || showOnlineOnly || showAvailableOnly ||
    selectedExtras.length > 0 || priceRange !== PRICE_RANGES[0] || showOutcallOnly || showFavoritesOnly ||
    selectedBodyTypes.length > 0 || selectedSkinTones.length > 0 || selectedAgeRanges.length > 0 || selectedServices.length > 0;

  // Normalize location for filtering
  const normalizedLocation = location?.toLowerCase() || 'all';
  const currentLocation = LOCATIONS.find(l => l.slug === normalizedLocation) || LOCATIONS[0];

  // Filter models (using models with match percentages)
  let filteredModels = allModelsWithMatch;

  // Filter by location
  if (normalizedLocation !== 'all') {
    filteredModels = filteredModels.filter(m =>
      m.location.toLowerCase().replace(' ', '-') === normalizedLocation
    );
  }

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredModels = filteredModels.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.username.toLowerCase().includes(query) ||
      m.areas.some(a => a.toLowerCase().includes(query))
    );
  }

  // Filter by online/available
  if (showOnlineOnly) {
    filteredModels = filteredModels.filter(m => m.isOnline);
  }
  if (showAvailableOnly) {
    filteredModels = filteredModels.filter(m => m.isAvailable);
  }

  // Filter by extras
  if (selectedExtras.length > 0) {
    filteredModels = filteredModels.filter(m =>
      selectedExtras.every(extra => m.extras.some(e => e.name === extra || e === extra))
    );
  }

  // Filter by price range
  if (priceRange !== PRICE_RANGES[0]) {
    filteredModels = filteredModels.filter(m =>
      m.startingPrice >= priceRange.min && m.startingPrice < priceRange.max
    );
  }

  // Filter by outcall availability
  if (showOutcallOnly) {
    filteredModels = filteredModels.filter(m => m.hasOutcall);
  }

  // Filter by favorites
  if (showFavoritesOnly) {
    filteredModels = filteredModels.filter(m => favorites.includes(m.username));
  }

  // Filter by body type
  if (selectedBodyTypes.length > 0) {
    filteredModels = filteredModels.filter(m =>
      m.bodyType && selectedBodyTypes.some(bt => bt.toLowerCase() === m.bodyType.toLowerCase())
    );
  }

  // Filter by skin tone
  if (selectedSkinTones.length > 0) {
    filteredModels = filteredModels.filter(m =>
      m.skinTone && selectedSkinTones.some(st => st.toLowerCase() === m.skinTone.toLowerCase())
    );
  }

  // Filter by age range
  if (selectedAgeRanges.length > 0) {
    filteredModels = filteredModels.filter(m => {
      if (!m.age) return false;
      return selectedAgeRanges.some(range => {
        const ageRange = AGE_RANGES.find(ar => ar.label === range);
        return ageRange && m.age >= ageRange.min && m.age <= ageRange.max;
      });
    });
  }

  // Filter by services
  if (selectedServices.length > 0) {
    filteredModels = filteredModels.filter(m => {
      const modelServices = m.services || [];
      return selectedServices.some(service =>
        modelServices.some(ms => ms.toLowerCase().includes(service.toLowerCase()))
      );
    });
  }

  // Sort models
  switch (sortBy) {
    case 'rating':
      filteredModels = [...filteredModels].sort((a, b) => b.rating - a.rating);
      break;
    case 'success':
      filteredModels = [...filteredModels].sort((a, b) => b.meetupSuccessRate - a.meetupSuccessRate);
      break;
    case 'price-low':
      filteredModels = [...filteredModels].sort((a, b) => a.startingPrice - b.startingPrice);
      break;
    case 'price-high':
      filteredModels = [...filteredModels].sort((a, b) => b.startingPrice - a.startingPrice);
      break;
    case 'meetups':
      filteredModels = [...filteredModels].sort((a, b) => b.verifiedMeetups - a.verifiedMeetups);
      break;
    case 'match':
      // Sort by match percentage (highest first), then by rating for ties
      filteredModels = [...filteredModels].sort((a, b) => {
        const matchDiff = (b.matchPercentage || 0) - (a.matchPercentage || 0);
        if (matchDiff !== 0) return matchDiff;
        return b.rating - a.rating;
      });
      break;
    default:
      // 'recommended' - sort by combination of success rate and meetups
      filteredModels = [...filteredModels].sort((a, b) =>
        (b.meetupSuccessRate * b.verifiedMeetups) - (a.meetupSuccessRate * a.verifiedMeetups)
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/explore/all" className="text-white font-bold text-xl">
            {PLATFORM_CONFIG.name}
          </Link>
          <div className="flex-1">
            {isAuthenticated && user?.name ? (
              <p className="text-white/50 text-sm">Hi, {user.name}</p>
            ) : (
              <p className="text-white/50 text-sm">{filteredModels.length} verified models</p>
            )}
          </div>
          {isAuthenticated ? (
            <Link to={dashboardLink} className="block">
              {(() => {
                // For creators, show their profile photo
                if (isCreator && user?.photos?.length > 0) {
                  const profilePhoto = user.photos.find(p => p.isProfilePhoto) || user.photos[0];
                  return (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 hover:scale-105 transition-transform">
                      <img
                        src={profilePhoto.url}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  );
                }
                // For clients or creators without photos, show default icon
                return (
                  <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <User size={20} className="text-white" />
                  </div>
                );
              })()}
            </Link>
          ) : (
            <Link to="/auth" className="px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors">
              Login
            </Link>
          )}
        </div>

        {/* Location tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-2">
          {LOCATIONS.map(loc => (
            <Link
              key={loc.slug}
              to={`/explore/${loc.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                normalizedLocation === loc.slug
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {loc.name}
              <span className="ml-1.5 opacity-60">({loc.count})</span>
            </Link>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 mb-6">
          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Filter row */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Sort dropdown */}
            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/10 border border-white/10 rounded-xl px-4 py-2 pr-8 text-white text-sm focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                {isClient && clientPreferences && <option value="match">Best Match</option>}
                <option value="rating">Highest Rated</option>
                <option value="success">Success Rate</option>
                <option value="meetups">Most Meetups</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
              )}
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Toggle filters */}
            <button
              onClick={() => setShowOnlineOnly(!showOnlineOnly)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showOnlineOnly
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Online Now
            </button>
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showAvailableOnly
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Heart size={14} className={showFavoritesOnly ? 'fill-pink-300' : ''} />
              Favorites
              {favorites.length > 0 && (
                <span className="text-xs opacity-70">({favorites.length})</span>
              )}
            </button>
          </div>

          {/* Expanded filters panel */}
          {showFilters && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              {/* Body Type */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Body Type</h4>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleBodyType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedBodyTypes.includes(type)
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {type}
                      {selectedBodyTypes.includes(type) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Skin Tone</h4>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => toggleSkinTone(tone)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedSkinTones.includes(tone)
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {tone}
                      {selectedSkinTones.includes(tone) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Age Range</h4>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => toggleAgeRange(range.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedAgeRanges.includes(range.label)
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {range.label}
                      {selectedAgeRanges.includes(range.label) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedServices.includes(service)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {service}
                      {selectedServices.includes(service) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Price Range (per hour)</h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setPriceRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        priceRange === range
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Extras</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_EXTRAS.map((extra) => (
                    <button
                      key={extra}
                      onClick={() => toggleExtra(extra)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedExtras.includes(extra)
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {extra}
                      {selectedExtras.includes(extra) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service type */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Service Type</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowOutcallOnly(!showOutcallOnly)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      showOutcallOnly
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Outcall Available
                  </button>
                </div>
              </div>

              {/* Clear all button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-pink-400 text-sm font-medium hover:text-pink-300 transition-colors flex items-center gap-1.5"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filters summary (when panel is collapsed) */}
          {!showFilters && hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-white/40 text-xs">Active:</span>
              {/* Body type filters */}
              {selectedBodyTypes.map(type => (
                <span key={`body-${type}`} className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-300 text-xs flex items-center gap-1">
                  {type}
                  <button onClick={() => toggleBodyType(type)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {/* Skin tone filters */}
              {selectedSkinTones.map(tone => (
                <span key={`skin-${tone}`} className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-1">
                  {tone}
                  <button onClick={() => toggleSkinTone(tone)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {/* Age range filters */}
              {selectedAgeRanges.map(range => (
                <span key={`age-${range}`} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-xs flex items-center gap-1">
                  {range}
                  <button onClick={() => toggleAgeRange(range)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {/* Services filters */}
              {selectedServices.map(service => (
                <span key={`service-${service}`} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs flex items-center gap-1">
                  {service}
                  <button onClick={() => toggleService(service)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {priceRange !== PRICE_RANGES[0] && (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-xs flex items-center gap-1">
                  {priceRange.label}
                  <button onClick={() => setPriceRange(PRICE_RANGES[0])} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedExtras.map(extra => (
                <span key={extra} className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-xs flex items-center gap-1">
                  {extra}
                  <button onClick={() => toggleExtra(extra)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {showOutcallOnly && (
                <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs flex items-center gap-1">
                  Outcall
                  <button onClick={() => setShowOutcallOnly(false)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}
              {showFavoritesOnly && (
                <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-300 text-xs flex items-center gap-1">
                  <Heart size={10} className="fill-pink-300" />
                  Favorites
                  <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-white/40 text-xs hover:text-white/70 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Social proof stats bar */}
        <div className="flex items-center justify-center gap-3 text-white/40 text-xs mb-6 flex-wrap">
          {platformStats.members > 0 && (
            <>
              <span className="flex items-center gap-1"><Users size={12} className="text-green-400" />{platformStats.members.toLocaleString()} members</span>
              <span>·</span>
            </>
          )}
          {platformStats.bookings > 0 && (
            <>
              <span className="flex items-center gap-1"><TrendingUp size={12} className="text-pink-400" />{platformStats.bookings.toLocaleString()} bookings</span>
              <span>·</span>
            </>
          )}
          <span className="flex items-center gap-1"><Shield size={12} className="text-blue-400" />Deposit-protected</span>
        </div>

        {/* For You Section - Only show for clients with preferences and matching creators */}
        {isClient && forYouMatches.length > 0 && !hasActiveFilters && normalizedLocation === 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                <Heart size={16} className="text-white fill-white" />
              </div>
              <h2 className="text-white font-semibold text-lg">For You</h2>
              <span className="text-white/40 text-sm">Based on your preferences</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {forYouMatches.map(model => (
                <ModelCard
                  key={`foryou-${model.id}`}
                  model={model}
                  isFavorite={isFavorite(model.username)}
                  onToggleFavorite={guardedToggleFavorite}
                  showMatchBadge={true}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs text-center">
                Explore all models below
              </p>
            </div>
          </div>
        )}

        {/* Models grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                isFavorite={isFavorite(model.username)}
                onToggleFavorite={guardedToggleFavorite}
                showMatchBadge={isClient && clientPreferences !== null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles size={32} className="text-white/30" />
            </div>
            <h3 className="text-white font-medium mb-2">No models found</h3>
            <p className="text-white/50 text-sm mb-4">Try adjusting your filters or search</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-8 space-y-3">
          {!isAuthenticated && (
            <Link
              to="/for-models"
              className="inline-flex items-center gap-2 text-purple-400 text-sm hover:text-purple-300 transition-colors"
            >
              <Sparkles size={14} />
              Are you a model? List on Hush
              <ChevronRight size={14} />
            </Link>
          )}
          <p className="text-white/30 text-xs">Hush • 18+ Only • Anti-Catfish Platform</p>
        </div>
      </div>

      {/* Registration Prompt Modal */}
      {showRegisterPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => setShowRegisterPrompt(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart size={32} className="text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join Hush for Free</h3>
              <p className="text-white/60 text-sm">{registerPromptMessage}</p>
            </div>
            <div className="space-y-3">
              <Link
                to="/auth"
                className="block w-full py-3.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold text-center transition-colors"
              >
                Create Free Account
              </Link>
              <button
                onClick={() => setShowRegisterPrompt(false)}
                className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/30 text-xs text-center">
                Already have an account?{' '}
                <Link to="/auth" className="text-pink-400 hover:text-pink-300">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
