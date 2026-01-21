import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ChevronLeft, CheckCircle, Filter,
  ThumbsUp, Calendar, User, Search, ChevronDown
} from 'lucide-react';
import { getModelByUsername, MODELS, PLATFORM_CONFIG } from '../data/models';

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

// Get all reviews across all models for the "all" view
const getAllReviews = () => {
  const allReviews = [];
  Object.entries(MODELS).forEach(([username, model]) => {
    model.reviews.forEach((review, index) => {
      allReviews.push({
        ...review,
        modelUsername: username,
        modelName: model.profile.name,
        id: `${username}-${index}`,
      });
    });
  });
  return allReviews;
};

const RATING_OPTIONS = [
  { label: "All Ratings", value: "all" },
  { label: "5 Stars", value: 5 },
  { label: "4 Stars", value: 4 },
  { label: "3 Stars", value: 3 },
  { label: "2 Stars", value: 2 },
  { label: "1 Star", value: 1 },
];

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Highest Rated", value: "highest" },
  { label: "Lowest Rated", value: "lowest" },
];

const ReviewCard = ({ review, showModel = false }) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        {/* Star rating */}
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}
            />
          ))}
        </div>
        {review.verified && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle size={12} />
            Verified
          </span>
        )}
      </div>
      <span className="text-white/40 text-xs flex items-center gap-1">
        <Calendar size={12} />
        {review.date}
      </span>
    </div>

    <p className="text-white/80 text-sm mb-3">"{review.text}"</p>

    <div className="flex items-center justify-between">
      <span className="text-white/50 text-xs flex items-center gap-1">
        <User size={12} />
        {review.author}
      </span>
      {showModel && (
        <Link
          to={`/model/${review.modelUsername}`}
          className="text-pink-400 text-xs hover:text-pink-300 transition-colors"
        >
          @{review.modelUsername}
        </Link>
      )}
    </div>
  </div>
);

const StatsCard = ({ reviews }) => {
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : 0;
  const verifiedCount = reviews.filter(r => r.verified).length;
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0
      ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
      : 0,
  }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-6 mb-4">
        {/* Average rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{averageRating}</div>
          <div className="flex gap-0.5 justify-center mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}
              />
            ))}
          </div>
          <p className="text-white/50 text-xs">{totalReviews} reviews</p>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-1.5">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-white/50 text-xs w-3">{rating}</span>
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-white/40 text-xs w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-white font-bold">{verifiedCount}</p>
          <p className="text-white/40 text-xs">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold">{fiveStarCount}</p>
          <p className="text-white/40 text-xs">5-Star</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold">{((verifiedCount / totalReviews) * 100 || 0).toFixed(0)}%</p>
          <p className="text-white/40 text-xs">Verified Rate</p>
        </div>
      </div>
    </div>
  );
};

export default function ReviewsPage() {
  const { username } = useParams();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Get reviews based on whether we're viewing a specific model or all reviews
  const isAllReviews = !username || username === 'all';
  const modelData = !isAllReviews ? getModelByUsername(username) : null;

  const allReviews = useMemo(() => {
    if (isAllReviews) {
      return getAllReviews();
    }
    if (modelData) {
      return modelData.reviews.map((review, index) => ({
        ...review,
        modelUsername: username,
        modelName: modelData.profile.name,
        id: `${username}-${index}`,
      }));
    }
    return [];
  }, [isAllReviews, modelData, username]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let reviews = [...allReviews];

    // Filter by rating
    if (ratingFilter !== "all") {
      reviews = reviews.filter(r => r.rating === ratingFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      reviews = reviews.filter(r =>
        r.text.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        (r.modelName && r.modelName.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case "highest":
        reviews.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        reviews.sort((a, b) => a.rating - b.rating);
        break;
      case "recent":
      default:
        // Keep original order (most recent first, as stored)
        break;
    }

    return reviews;
  }, [allReviews, ratingFilter, sortBy, searchQuery]);

  // Handle model not found
  if (!isAllReviews && !modelData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Model Not Found</h1>
          <p className="text-white/60 mb-6">The profile you're looking for doesn't exist.</p>
          <Link to="/explore/all" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-medium transition-colors">
            Browse All Models
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={isAllReviews ? "/explore/all" : `/model/${username}`}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {isAllReviews ? "All Reviews" : `Reviews for ${modelData?.profile.name}`}
            </h1>
            <p className="text-white/50 text-sm">
              {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
              {(ratingFilter !== "all" || searchQuery) && " (filtered)"}
            </p>
          </div>
        </div>

        {/* Stats card */}
        <StatsCard reviews={allReviews} />

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Rating filter */}
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="appearance-none bg-white/10 border border-white/10 rounded-xl px-4 py-2 pr-8 text-white text-sm focus:border-pink-500 focus:outline-none cursor-pointer"
            >
              {RATING_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/10 border border-white/10 rounded-xl px-4 py-2 pr-8 text-white text-sm focus:border-pink-500 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>

        </div>

        {/* Reviews list */}
        {filteredReviews.length > 0 ? (
          <div className="space-y-3">
            {filteredReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                showModel={isAllReviews}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <ThumbsUp size={32} className="text-white/30" />
            </div>
            <h3 className="text-white font-medium mb-2">No reviews found</h3>
            <p className="text-white/50 text-sm mb-4">
              {searchQuery || ratingFilter !== "all"
                ? "Try adjusting your filters"
                : "No reviews yet"}
            </p>
            {(searchQuery || ratingFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRatingFilter("all");
                }}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-white/30 text-xs">{PLATFORM_CONFIG.name} • 18+ Only • Anti-Catfish Platform</p>
        </div>
      </div>
    </div>
  );
}
