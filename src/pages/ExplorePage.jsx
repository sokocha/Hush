import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Star, CheckCircle, Shield, Filter,
  ChevronLeft, Search, Target, Video, Aperture,
  TrendingUp, Heart, Clock, Users, Sparkles
} from 'lucide-react';

// Mock data for models - in real app, this would come from an API
const MOCK_MODELS = [
  {
    id: 1,
    name: "Destiny",
    username: "destiny_x",
    location: "Lagos",
    areas: ["Lekki", "VI", "Ikoyi"],
    rating: 4.8,
    reviews: 23,
    meetupSuccessRate: 89,
    verifiedMeetups: 47,
    isOnline: true,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 50000,
    tagline: "Your favorite girl",
  },
  {
    id: 2,
    name: "Bella",
    username: "bella_luxe",
    location: "Lagos",
    areas: ["Lekki", "Ajah"],
    rating: 4.9,
    reviews: 45,
    meetupSuccessRate: 95,
    verifiedMeetups: 89,
    isOnline: true,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 60000,
    tagline: "Premium experience only",
  },
  {
    id: 3,
    name: "Amara",
    username: "amara_ng",
    location: "Lagos",
    areas: ["VI", "Ikoyi"],
    rating: 4.7,
    reviews: 31,
    meetupSuccessRate: 87,
    verifiedMeetups: 52,
    isOnline: false,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 45000,
    tagline: "Sweet & discreet",
  },
  {
    id: 4,
    name: "Zara",
    username: "zara_elite",
    location: "Lagos",
    areas: ["Ikeja", "GRA"],
    rating: 4.6,
    reviews: 18,
    meetupSuccessRate: 82,
    verifiedMeetups: 28,
    isOnline: true,
    isAvailable: false,
    isVideoVerified: true,
    isStudioVerified: false,
    startingPrice: 40000,
    tagline: "Mainland's finest",
  },
  {
    id: 5,
    name: "Chioma",
    username: "chioma_vip",
    location: "Lagos",
    areas: ["Lekki", "Ajah", "VI"],
    rating: 5.0,
    reviews: 67,
    meetupSuccessRate: 98,
    verifiedMeetups: 134,
    isOnline: true,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 80000,
    tagline: "The best in Lagos",
  },
  {
    id: 6,
    name: "Nneka",
    username: "nneka_exclusive",
    location: "Lagos",
    areas: ["Ikoyi"],
    rating: 4.8,
    reviews: 39,
    meetupSuccessRate: 91,
    verifiedMeetups: 61,
    isOnline: false,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 70000,
    tagline: "Exclusive bookings only",
  },
  {
    id: 7,
    name: "Adaeze",
    username: "ada_premium",
    location: "Abuja",
    areas: ["Maitama", "Wuse"],
    rating: 4.9,
    reviews: 52,
    meetupSuccessRate: 93,
    verifiedMeetups: 78,
    isOnline: true,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 75000,
    tagline: "Abuja's sweetheart",
  },
  {
    id: 8,
    name: "Favour",
    username: "favour_ph",
    location: "Port Harcourt",
    areas: ["GRA", "Trans Amadi"],
    rating: 4.7,
    reviews: 29,
    meetupSuccessRate: 85,
    verifiedMeetups: 41,
    isOnline: true,
    isAvailable: true,
    isVideoVerified: true,
    isStudioVerified: true,
    startingPrice: 45000,
    tagline: "PH's finest",
  },
];

const LOCATIONS = [
  { name: "All", slug: "all", count: MOCK_MODELS.length },
  { name: "Lagos", slug: "lagos", count: MOCK_MODELS.filter(m => m.location === "Lagos").length },
  { name: "Abuja", slug: "abuja", count: MOCK_MODELS.filter(m => m.location === "Abuja").length },
  { name: "Port Harcourt", slug: "port-harcourt", count: MOCK_MODELS.filter(m => m.location === "Port Harcourt").length },
];

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

const ModelCard = ({ model }) => (
  <Link
    to={`/model/${model.username}`}
    className="block bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-pink-500/30 hover:bg-white/10 transition-all group"
  >
    {/* Photo placeholder */}
    <div className="aspect-[3/4] bg-gradient-to-br from-pink-500/30 to-purple-500/30 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-white/30">{model.name.slice(0, 2).toUpperCase()}</span>
      </div>

      {/* Status badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
);

export default function ExplorePage() {
  const { location } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Normalize location for filtering
  const normalizedLocation = location?.toLowerCase() || 'all';
  const currentLocation = LOCATIONS.find(l => l.slug === normalizedLocation) || LOCATIONS[0];

  // Filter models
  let filteredModels = MOCK_MODELS;

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
          <Link to="/" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} className="text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {normalizedLocation === 'all' ? 'All Models' : `Models in ${currentLocation.name}`}
            </h1>
            <p className="text-white/50 text-sm">{filteredModels.length} verified models</p>
          </div>
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
          </div>
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

        {/* Models grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <ModelCard key={model.id} model={model} />
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
              onClick={() => {
                setSearchQuery('');
                setShowOnlineOnly(false);
                setShowAvailableOnly(false);
              }}
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
