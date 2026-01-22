import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Star, CheckCircle, Shield, Filter,
  ChevronLeft, Search, Target, Video, Aperture,
  TrendingUp, Heart, Clock, Users, Sparkles, X, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { getModelsList, getLocations, getAllExtras, PLATFORM_CONFIG } from '../data/models';
import useFavorites from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { getTopMatches, addMatchPercentages } from '../utils/matchingAlgorithm';

// Get models from shared data store
const HARDCODED_MODELS = getModelsList();

// Helper to get registered creators from localStorage
const getRegisteredCreators = () => {
  try {
    // Get all localStorage keys and find creator accounts
    const creators = [];
    const authData = localStorage.getItem('hush_auth');
    if (authData) {
      const user = JSON.parse(authData);
      // Only include verified creators (not pending verification)
      if (user.userType === 'creator' && !user.pendingVerification) {
        // Transform creator data to match model format
        const photos = user.photos || [];
        const previewPhotos = photos.filter(p => p.isPreview);
        const profilePhoto = photos.find(p => p.isProfilePhoto) || previewPhotos[0] || photos[0];

        creators.push({
          id: `creator-${user.username}`,
          username: user.username,
          name: user.name || user.username,
          tagline: user.tagline || 'New on the platform',
          location: user.location || 'Lagos',
          areas: user.areas || [],
          isOnline: true, // Assume online if recently active
          isAvailable: true,
          isVideoVerified: user.isVideoVerified || false,
          isStudioVerified: user.isStudioVerified || false,
          rating: user.stats?.rating || 0,
          verifiedMeetups: user.stats?.verifiedMeetups || 0,
          meetupSuccessRate: user.stats?.meetupSuccessRate || 0,
          startingPrice: user.pricing?.meetupIncall?.[1] || 0,
          hasOutcall: !!user.pricing?.meetupOutcall,
          extras: user.extras || [],
          profilePhotoUrl: profilePhoto?.url || null,
          isRegisteredCreator: true,
          // Attributes for matching
          bodyType: user.bodyType || null,
          skinTone: user.skinTone || null,
          age: user.age || null,
          height: user.height || null,
          services: user.services || [],
        });
      }
    }
    return creators;
  } catch (e) {
    console.error('Error getting registered creators:', e);
    return [];
  }
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

// Build locations dynamically from models data
const getLocationsWithCounts = (models) => [
  { name: "All", slug: "all", count: models.length },
  { name: "Lagos", slug: "lagos", count: models.filter(m => m.location === "Lagos").length },
  { name: "Abuja", slug: "abuja", count: models.filter(m => m.location === "Abuja").length },
  { name: "Port Harcourt", slug: "port-harcourt", count: models.filter(m => m.location === "Port Harcourt").length },
];

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

const ModelCard = ({ model, isFavorite, onToggleFavorite, showMatchBadge = false }) => (
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

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {/* Match percentage badge */}
          {showMatchBadge && model.matchPercentage > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium">
              <Sparkles size={10} />
              {model.matchPercentage}% match
            </span>
          )}
          {model.isRegisteredCreator && (
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
          {model.isAvailable && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/90 text-white text-xs font-medium">
              Available
            </span>
          )}
        </div>

        {/* Verification badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {model.isVideoVerified && (
            <span className="p-1.5 rounded-full bg-blue-500/80">
              <Video size={12} className="text-white" />
            </span>
          )}
          {model.isStudioVerified && (
            <span className="p-1.5 rounded-full bg-cyan-500/80">
              <Aperture size={12} className="text-white" />
            </span>
          )}
        </div>

        {/* Success rate badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-green-400 text-xs font-medium">
            <Target size={12} />
            {model.meetupSuccessRate}% success
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-lg group-hover:text-pink-300 transition-colors">{model.name}</h3>
            <p className="text-white/50 text-sm">@{model.username}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={14} className="fill-yellow-400" />
            <span className="text-white text-sm font-medium">{model.rating}</span>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-3">{model.tagline}</p>

        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {model.areas.slice(0, 2).join(", ")}
          </span>
          <span>•</span>
          <span>{model.verifiedMeetups} meetups</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-white/40 text-xs">From</span>
          <span className="text-pink-400 font-semibold">{formatNaira(model.startingPrice)}/hr</span>
        </div>
      </div>
    </Link>

    {/* Favorite button - positioned outside the Link */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(model.username);
      }}
      className={`absolute bottom-[4.5rem] right-3 p-2 rounded-full transition-all z-10 ${
        isFavorite
          ? 'bg-pink-500 text-white'
          : 'bg-black/60 backdrop-blur-sm text-white/70 hover:text-pink-400 hover:bg-black/80'
      }`}
    >
      <Heart size={16} className={isFavorite ? 'fill-white' : ''} />
    </button>
  </div>
);

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

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated, isCreator, isClient, user } = useAuth();

  // Combine hardcoded models with registered creators (dynamic)
  const allModels = useMemo(() => {
    const registeredCreators = getRegisteredCreators();
    return [...HARDCODED_MODELS, ...registeredCreators];
  }, [user]); // Re-compute when user changes

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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setShowOnlineOnly(false);
    setShowAvailableOnly(false);
    setSelectedExtras([]);
    setPriceRange(PRICE_RANGES[0]);
    setShowOutcallOnly(false);
    setShowFavoritesOnly(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || showOnlineOnly || showAvailableOnly ||
    selectedExtras.length > 0 || priceRange !== PRICE_RANGES[0] || showOutcallOnly || showFavoritesOnly;

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
      selectedExtras.every(extra => m.extras.includes(extra))
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
            <p className="text-white/50 text-sm">{filteredModels.length} verified models</p>
          </div>
          {isAuthenticated ? (
            <Link to={dashboardLink} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Users size={20} className="text-white" />
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
          <div className="flex flex-wrap gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/10 border border-white/10 rounded-xl px-4 py-2 pr-8 text-white text-sm focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showOnlineOnly
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Online Now
            </button>
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showAvailableOnly
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
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
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras / Services */}
              <div>
                <h4 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wide">Services & Extras</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_EXTRAS.map((extra) => (
                    <button
                      key={extra}
                      onClick={() => toggleExtra(extra)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedExtras.includes(extra)
                          ? 'bg-purple-500 text-white'
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
              {priceRange !== PRICE_RANGES[0] && (
                <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-300 text-xs flex items-center gap-1">
                  {priceRange.label}
                  <button onClick={() => setPriceRange(PRICE_RANGES[0])} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedExtras.map(extra => (
                <span key={extra} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs flex items-center gap-1">
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

        {/* Trust banner */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <Shield size={20} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-green-300 font-medium text-sm">All models are verified</p>
              <p className="text-green-300/60 text-xs">Video verified • Studio photos • Anti-catfish protected</p>
            </div>
          </div>
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
                  onToggleFavorite={toggleFavorite}
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
                onToggleFavorite={toggleFavorite}
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
        <div className="text-center mt-12 pb-8">
          <p className="text-white/30 text-xs">Hush • 18+ Only • Anti-Catfish Platform</p>
        </div>
      </div>
    </div>
  );
}
