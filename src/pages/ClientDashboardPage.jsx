import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet, CreditCard, History, Calendar, Clock, MapPin,
  Shield, ShieldCheck, Award, Crown, BadgeCheck, ChevronRight,
  Heart, Star, CheckCircle, AlertTriangle, Copy, ArrowUpRight,
  X, Plus, Minus, RefreshCw, Target, Users, Sparkles, Home,
  MessageCircle, Phone, Eye, Lock, Unlock, TrendingUp, Gift,
  LogOut, Settings, Edit3, User, ChevronLeft
} from 'lucide-react';
import { PLATFORM_CONFIG, getModelByUsername } from '../data/models';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { bookingService } from '../services/bookingService';
import { userService } from '../services/userService';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const LOCATIONS = [
  { name: "Lagos", areas: ["Lekki", "VI", "Ikoyi", "Ajah", "Ikeja", "GRA", "Maryland"] },
  { name: "Abuja", areas: ["Maitama", "Wuse", "Asokoro", "Garki", "Jabi"] },
  { name: "Port Harcourt", areas: ["GRA", "Trans Amadi", "Rumuola", "Eleme"] },
];

const BODY_TYPE_PREFERENCES = [
  "Slim", "Athletic", "Curvy", "Thick", "BBW", "Petite", "Tall", "No preference"
];

const SKIN_TONE_PREFERENCES = [
  "Fair", "Light", "Caramel", "Brown", "Dark", "No preference"
];

const AGE_PREFERENCES = [
  "18-22", "23-27", "28-32", "33-40", "40+", "No preference"
];

const SERVICE_PREFERENCES = [
  "GFE", "Oral", "Anal", "BDSM", "Massage", "Duo",
  "Dinner date", "Overnight", "Travel companion"
];

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const formatNaira = (amount) => `₦${Math.abs(amount).toLocaleString()}`;

// Helper to calculate time until code unlock (at meetup time)
const getCodeUnlockInfo = (meetupDate, meetupTime) => {
  if (!meetupDate || !meetupTime) return { isUnlocked: false, timeRemaining: null };

  // Parse the meetup date and time
  const [hours, minutes] = meetupTime.match(/(\d+):(\d+)/).slice(1).map(Number);
  const isPM = meetupTime.includes('PM');
  const isAM = meetupTime.includes('AM');

  let hour24 = hours;
  if (isPM && hours !== 12) hour24 = hours + 12;
  if (isAM && hours === 12) hour24 = 0;

  const meetupDateTime = new Date(meetupDate);
  meetupDateTime.setHours(hour24, minutes || 0, 0, 0);

  // Code unlocks at meetup time
  const unlockTime = meetupDateTime;
  const now = new Date();

  if (now >= unlockTime) {
    return { isUnlocked: true, timeRemaining: null };
  }

  const diff = unlockTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = '';
  if (days > 0) timeString += `${days}d `;
  if (hrs > 0) timeString += `${hrs}h `;
  timeString += `${mins}m`;

  return { isUnlocked: false, timeRemaining: timeString.trim(), unlockTime };
};

const getTierData = (tierId) => PLATFORM_CONFIG.verificationTiers[tierId];

const getTierColor = (tier) => {
  const colors = {
    visitor: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-300", accent: "text-gray-400", solid: "bg-gray-500" },
    verified: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", accent: "text-blue-400", solid: "bg-blue-500" },
    baller: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", accent: "text-purple-400", solid: "bg-purple-500" },
    bossman: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", accent: "text-amber-400", solid: "bg-amber-500" },
  };
  return colors[tier] || colors.visitor;
};

const getTierIcon = (tierId, size = 20) => {
  const icons = {
    visitor: <BadgeCheck size={size} />,
    verified: <ShieldCheck size={size} />,
    baller: <Award size={size} />,
    bossman: <Crown size={size} />,
  };
  return icons[tierId] || icons.visitor;
};

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className={`bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full ${size === 'lg' ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-hidden flex flex-col animate-slideUp`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

const TierBadge = ({ tier, size = "md" }) => {
  const tierData = getTierData(tier);
  const colors = getTierColor(tier);
  if (!tierData) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${size === 'lg' ? 'text-sm' : 'text-xs'} font-medium`}>
      {getTierIcon(tier, size === 'lg' ? 18 : 14)}
      {tierData.name}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color = "pink" }) => {
  const colorClasses = {
    pink: { bg: "bg-pink-500/20", text: "text-pink-400" },
    green: { bg: "bg-green-500/20", text: "text-green-400" },
    purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  };
  const colors = colorClasses[color] || colorClasses.pink;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={20} className={colors.text} />
        </div>
        <div className="flex-1">
          <p className="text-white/50 text-xs">{label}</p>
          <p className="text-white font-bold text-lg">{value}</p>
          {subValue && <p className="text-white/40 text-xs">{subValue}</p>}
        </div>
      </div>
    </div>
  );
};

const FavoriteModelCard = ({ username }) => {
  const [creatorData, setCreatorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      // First try mock data
      const mockData = getModelByUsername(username);
      if (mockData) {
        setCreatorData({
          name: mockData.profile.name,
          location: mockData.profile.location,
          rating: mockData.stats.rating,
          isOnline: mockData.profile.isOnline,
          isAvailable: mockData.profile.isAvailable,
          isVideoVerified: mockData.profile.isVideoVerified,
          tagline: mockData.profile.tagline || null,
          startingPrice: mockData.pricing?.meetupIncall?.[1] || null,
        });
        setLoading(false);
        return;
      }

      // Fetch from database — query users and creators separately (matches ExplorePage pattern)
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, last_seen_at')
          .eq('username', username)
          .single();

        if (userError || !userData) {
          setLoading(false);
          return;
        }

        const { data: creatorRow } = await supabase
          .from('creators')
          .select('location, rating, is_video_verified, tagline, starting_price, is_available')
          .eq('id', userData.id)
          .single();

        setCreatorData({
          name: userData.name,
          location: creatorRow?.location || 'Lagos',
          rating: creatorRow?.rating || 4.8,
          isOnline: userData.last_seen_at ? (Date.now() - new Date(userData.last_seen_at).getTime() < 15 * 60 * 1000) : false,
          isAvailable: creatorRow?.is_available || false,
          isVideoVerified: creatorRow?.is_video_verified || false,
          tagline: creatorRow?.tagline || null,
          startingPrice: creatorRow?.starting_price || null,
        });
      } catch (err) {
        console.error('Error fetching creator:', err);
      }
      setLoading(false);
    };

    fetchCreator();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl animate-pulse">
        <div className="w-14 h-14 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-24 mb-2" />
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
      </div>
    );
  }

  // Fallback card when creator data couldn't be fetched
  if (!creatorData) {
    return (
      <Link
        to={`/model/${username}`}
        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-pink-500/30 transition-all"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-white/50">{username.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">@{username}</h4>
          <p className="text-white/40 text-sm">Tap to view profile</p>
        </div>
        <ChevronRight size={20} className="text-white/30 flex-shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      to={`/model/${username}`}
      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-pink-500/30 transition-all"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 relative">
        <span className="text-lg font-bold text-white/50">{creatorData.name.slice(0, 2).toUpperCase()}</span>
        {creatorData.isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-semibold truncate">{creatorData.name}</h4>
          {creatorData.isVideoVerified && (
            <ShieldCheck size={14} className="text-blue-400 flex-shrink-0" />
          )}
          {(creatorData.isOnline || creatorData.isAvailable) && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">
              {creatorData.isOnline ? 'Online' : 'Available'}
            </span>
          )}
        </div>
        {creatorData.tagline && (
          <p className="text-white/40 text-xs truncate italic">{creatorData.tagline}</p>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50 truncate">{creatorData.location} • {creatorData.rating} ⭐</span>
          {creatorData.startingPrice && (
            <span className="text-pink-400 text-xs font-medium flex-shrink-0">From {formatNaira(creatorData.startingPrice)}</span>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="text-white/30 flex-shrink-0" />
    </Link>
  );
};

const TierSelectionCard = ({ tier, isSelected, onSelect, isCurrentTier, isLowerTier }) => {
  const tierData = getTierData(tier);
  const colors = getTierColor(tier);

  if (!tierData) return null;

  const isDisabled = isCurrentTier || isLowerTier;

  return (
    <button
      onClick={() => !isDisabled && onSelect(tier)}
      disabled={isDisabled}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : isSelected
            ? `${colors.bg} ${colors.border} ring-2 ring-pink-500`
            : `bg-white/5 border-white/10 hover:${colors.bg} hover:${colors.border}`
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <span className={colors.accent}>{getTierIcon(tier)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-semibold ${colors.text}`}>{tierData.name}</p>
            {isCurrentTier && (
              <span className="text-xs bg-green-500/20 px-2 py-0.5 rounded-full text-green-400">Current</span>
            )}
            {isLowerTier && !isCurrentTier && (
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/40">N/A</span>
            )}
          </div>
          <p className={`text-xs ${colors.accent}`}>"{tierData.tagline}"</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">{formatNaira(tierData.deposit)}</p>
          {isLowerTier && !isCurrentTier && (
            <p className="text-white/30 text-xs">Can't downgrade</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tierData.benefits.slice(0, 3).map((benefit, i) => (
          <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{benefit}</span>
        ))}
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

// Status Timeline Component
const StatusTimeline = ({ status }) => {
  const steps = [
    { key: 'requested', label: 'Requested', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'meetup', label: 'Meetup', icon: Calendar },
    { key: 'completed', label: 'Done', icon: Star },
  ];

  const getStepStatus = (stepKey) => {
    if (status === 'cancelled' || status === 'declined') {
      if (stepKey === 'requested') return 'completed';
      return 'cancelled';
    }
    if (status === 'no_show') {
      if (stepKey === 'requested' || stepKey === 'confirmed') return 'completed';
      if (stepKey === 'meetup') return 'cancelled';
      return 'cancelled';
    }
    if (status === 'rescheduled') {
      if (stepKey === 'requested') return 'completed';
      if (stepKey === 'confirmed') return 'current';
      return 'pending';
    }
    if (status === 'pending') {
      if (stepKey === 'requested') return 'current';
      return 'pending';
    }
    if (status === 'confirmed') {
      if (stepKey === 'requested') return 'completed';
      if (stepKey === 'confirmed') return 'current';
      return 'pending';
    }
    if (status === 'completed') {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.key);
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                stepStatus === 'completed' ? 'bg-green-500 text-white' :
                stepStatus === 'current' ? 'bg-pink-500 text-white ring-4 ring-pink-500/30' :
                stepStatus === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-white/10 text-white/30'
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[10px] mt-1 ${
                stepStatus === 'completed' ? 'text-green-400' :
                stepStatus === 'current' ? 'text-pink-400' :
                stepStatus === 'cancelled' ? 'text-red-400/50' :
                'text-white/30'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 -mt-4 ${
                stepStatus === 'completed' ? 'bg-green-500' :
                stepStatus === 'cancelled' ? 'bg-red-500/20' :
                'bg-white/10'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({ isOpen, onClose, meetup, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !meetup) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({ meetupId: meetup.id, creatorUsername: meetup.creatorUsername, rating, text });
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setRating(0);
    setText('');
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleClose}>
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Rate Your Meetup</h3>
          <button onClick={handleClose} className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-1">Review Submitted</h4>
              <p className="text-white/50 text-sm">Thanks for your feedback on {meetup.creatorName}.</p>
              <button onClick={handleClose} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1">How was your meetup with</p>
                <p className="text-white font-semibold text-lg">{meetup.creatorName}?</p>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                    <Star size={32} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-white/50 text-sm">
                  {rating === 5 ? 'Amazing!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </p>
              )}

              {/* Review Text */}
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your experience (optional)..."
                maxLength={500}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-pink-500 focus:outline-none resize-none text-sm"
              />

              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${rating > 0 ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Meetup Card Component
const MeetupCard = ({ meetup, onCancel, onReview }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const modelData = getModelByUsername(meetup.creatorUsername);
  const statusColors = {
    pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', label: 'Awaiting Confirmation' },
    confirmed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', label: 'Confirmed' },
    declined: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', label: 'Declined by Model' },
    rescheduled: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Reschedule Requested' },
    completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', label: 'Completed' },
    no_show: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', label: 'No Show' },
    cancelled: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Cancelled' },
  };
  const status = statusColors[meetup.status] || statusColors.pending;

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    onCancel(meetup.id);
    setShowCancelConfirm(false);
  };

  return (
    <div className={`${status.bg} ${status.border} border rounded-xl p-4`}>
      {/* Status Timeline */}
      <StatusTimeline status={meetup.status} />

      {/* Cancel Confirmation Overlay */}
      {showCancelConfirm && (
        <div className="mb-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
          <p className="text-red-200 text-sm mb-3">
            Are you sure you want to cancel this meetup with {meetup.creatorName}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmCancel}
              className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Keep It
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
            <span className="text-sm font-bold text-white/50">
              {meetup.creatorName?.slice(0, 2).toUpperCase() || 'XX'}
            </span>
          </div>
          <div>
            <Link to={`/model/${meetup.creatorUsername}`} className="text-white font-semibold hover:text-pink-400">
              {meetup.creatorName}
            </Link>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${status.bg} ${status.text} font-medium`}>
                {status.label}
              </span>
            </div>
            {meetup.status === 'declined' && meetup.status_note && (
              <p className="text-red-300/70 text-xs mt-1">Reason: {meetup.status_note}</p>
            )}
          </div>
        </div>
        {(meetup.status === 'pending' || meetup.status === 'confirmed') && !showCancelConfirm && (
          <button
            onClick={handleCancelClick}
            className="text-red-400/70 hover:text-red-400 text-xs"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="flex items-center gap-2 text-white/60">
          <Calendar size={14} />
          <span>{new Date(meetup.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Clock size={14} />
          <span>{meetup.time}{meetup.duration ? ` (${meetup.duration})` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <MapPin size={14} />
          <span>{meetup.location}</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <span>{meetup.locationType === 'incall' ? '🏠' : '🚗'}</span>
          <span>{meetup.locationType === 'incall' ? 'Incall' : 'Outcall'}</span>
        </div>
      </div>

      {meetup.specialRequests && (
        <div className="bg-black/20 rounded-lg p-2 mb-3">
          <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
            <MessageCircle size={12} />
            Special Requests:
          </p>
          <p className="text-white/70 text-xs">{meetup.specialRequests}</p>
        </div>
      )}

      {meetup.booking_extras && meetup.booking_extras.length > 0 && (
        <div className="bg-black/20 rounded-lg p-2 mb-3">
          <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
            <Gift size={12} />
            Selected Extras:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {meetup.booking_extras.map((extra, i) => (
              <span key={i} className="text-xs bg-pink-500/15 text-pink-300 px-2 py-0.5 rounded-full">
                {extra}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div>
          <p className="text-white/40 text-xs">Rate</p>
          <p className="text-white font-bold">{formatNaira(meetup.totalPrice)}</p>
        </div>
        {meetup.clientCode && (meetup.status === 'pending' || meetup.status === 'confirmed') && (
          (() => {
            const codeInfo = getCodeUnlockInfo(meetup.date, meetup.time);
            return (
              <div className="text-right">
                {codeInfo.isUnlocked ? (
                  <>
                    <p className="text-white/40 text-xs">Your Code</p>
                    <p className="text-blue-400 font-mono font-bold">{meetup.clientCode}</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/40 text-xs flex items-center justify-end gap-1">
                      <Lock size={10} /> Code unlocks in
                    </p>
                    <p className="text-purple-400 font-medium text-sm">{codeInfo.timeRemaining}</p>
                  </>
                )}
              </div>
            );
          })()
        )}
        {meetup.status === 'completed' && onReview && (
          <button
            onClick={() => onReview(meetup)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg text-yellow-300 text-xs font-medium transition-colors"
          >
            <Star size={12} />
            Leave Review
          </button>
        )}
      </div>
    </div>
  );
};

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, updateUser, updateTier, isClient, cancelMeetup: authCancelMeetup } = useAuth();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState('overview');

  // Set active tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'meetups', 'favorites', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [editName, setEditName] = useState('');
  const [depositStep, setDepositStep] = useState('select'); // select, payment, confirm
  const [dbMeetups, setDbMeetups] = useState([]);
  const [loadingMeetups, setLoadingMeetups] = useState(false);
  const [reviewMeetup, setReviewMeetup] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpStep, setTopUpStep] = useState('amount'); // amount, payment, confirm
  const [topUpAmount, setTopUpAmount] = useState(null);
  const TOP_UP_OPTIONS = [10000, 20000, 50000, 100000];
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [editPrefs, setEditPrefs] = useState({});

  // Fetch bookings from database and normalize field names
  const fetchClientBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMeetups(true);
    try {
      const result = await bookingService.getClientBookings(user.id);
      if (result.success && result.bookings?.length > 0) {
        console.log('[ClientDashboard] Fetched', result.bookings.length, 'bookings from database');

        // Collect creator_ids that need name lookup
        const needsNameLookup = result.bookings.filter(b => !b.creator?.users?.name);
        let creatorNameMap = {};
        if (needsNameLookup.length > 0) {
          const creatorIds = [...new Set(needsNameLookup.map(b => b.creator_id))];
          const { data: creatorUsers } = await supabase
            .from('users')
            .select('id, name, username')
            .in('id', creatorIds);
          if (creatorUsers) {
            creatorUsers.forEach(u => { creatorNameMap[u.id] = u; });
          }
        }

        // Normalize database snake_case fields to camelCase for MeetupCard
        const normalized = result.bookings.map(b => ({
          ...b,
          creatorName: b.creator?.users?.name || creatorNameMap[b.creator_id]?.name || 'Model',
          creatorUsername: b.creator?.users?.username || creatorNameMap[b.creator_id]?.username,
          totalPrice: b.total_price,
          locationType: b.location_type,
          specialRequests: b.special_requests,
          clientCode: b.client_code,
          depositAmount: b.deposit_amount,
        }));
        setDbMeetups(normalized);
      } else {
        console.warn('[ClientDashboard] DB fetch returned empty or failed:', result.error || 'no bookings');
      }
    } catch (err) {
      console.error('[ClientDashboard] Error fetching client bookings:', err);
    } finally {
      setLoadingMeetups(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClientBookings();
  }, [fetchClientBookings]);

  // Fetch transaction history (unlocks + booking deposits)
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTransactions(true);
    try {
      const result = await userService.getClientUnlocks(user.id);
      const unlockTxns = (result.success && result.unlocks || []).map(u => ({
        id: u.id,
        type: u.unlock_type === 'photos' ? 'Unlock Photos' : 'Unlock Contact',
        creatorName: u.creators?.users?.name || 'Model',
        amount: u.price_paid,
        date: u.created_at,
      }));

      // Merge booking deposits from fetched meetups
      const bookingTxns = dbMeetups
        .filter(m => m.depositAmount > 0)
        .map(m => ({
          id: m.id,
          type: 'Booking Deposit',
          creatorName: m.creatorName,
          amount: m.depositAmount,
          date: m.created_at,
        }));

      const all = [...unlockTxns, ...bookingTxns].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(all);
    } catch (err) {
      console.error('[ClientDashboard] Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user?.id, dbMeetups]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCancelMeetup = useCallback(async (meetupId) => {
    await authCancelMeetup(meetupId);
    fetchClientBookings();
  }, [authCancelMeetup, fetchClientBookings]);

  // Redirect if not a client
  if (!user || !isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">This page is only for registered clients.</p>
          <Link to="/auth" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-medium transition-colors">
            Register / Login
          </Link>
        </div>
      </div>
    );
  }

  const currentTier = user.tier || 'visitor';
  const tierData = getTierData(currentTier);
  const tierColors = getTierColor(currentTier);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleEditProfile = () => {
    setEditName(user.name || '');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (editName.trim().length >= 2) {
      updateUser({ name: editName.trim() });
      setShowEditProfileModal(false);
    }
  };

  const handleSelectTier = (tier) => {
    // Prevent selecting lower tiers
    if (user.hasPaidTrustDeposit && currentTier) {
      const selectedTierDeposit = PLATFORM_CONFIG.verificationTiers[tier]?.deposit || 0;
      const currentTierDeposit = PLATFORM_CONFIG.verificationTiers[currentTier]?.deposit || 0;
      if (selectedTierDeposit < currentTierDeposit) {
        return; // Can't downgrade
      }
    }
    setSelectedTier(tier);
  };

  const handleProceedToPayment = () => {
    if (selectedTier) {
      setDepositStep('payment');
    }
  };

  const handleConfirmDeposit = () => {
    if (selectedTier) {
      const tierInfo = getTierData(selectedTier);
      updateTier(selectedTier, tierInfo.deposit);
      setDepositStep('confirm');
    }
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setSelectedTier(null);
    setDepositStep('select');
  };

  const handleSubmitReview = async ({ meetupId, creatorUsername, rating, text }) => {
    if (!user?.id) return;
    try {
      const { data: creatorUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', creatorUsername)
        .single();

      if (creatorUser) {
        await supabase.from('reviews').insert({
          client_id: user.id,
          creator_id: creatorUser.id,
          booking_id: meetupId,
          rating,
          comment: text || null,
        });
      }
    } catch (err) {
      console.error('[ClientDashboard] Error submitting review:', err);
    }
  };

  const handleConfirmTopUp = async () => {
    if (!topUpAmount || !user?.id) return;
    const newBalance = (user.depositBalance || 0) + topUpAmount;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ deposit_balance: newBalance })
        .eq('id', user.id);

      if (!error) {
        updateUser({ depositBalance: newBalance }, false);
      }
    } catch (err) {
      console.error('[ClientDashboard] Error topping up balance:', err);
    }
    setTopUpStep('confirm');
  };

  const closeTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpAmount(null);
    setTopUpStep('amount');
  };

  // Calculate stats
  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const successRate = user.successfulMeetups > 0
    ? Math.round((user.successfulMeetups / (user.successfulMeetups + 1)) * 100)
    : 0;

  // Get meetups data - merge database results with local state fallback
  const localMeetups = user.meetups || [];
  const meetups = dbMeetups.length > 0
    ? dbMeetups
    : localMeetups;
  const upcomingMeetups = meetups.filter(m => m.status === 'pending' || m.status === 'confirmed' || m.status === 'rescheduled');
  const pastMeetups = meetups.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.status === 'declined');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'meetups', label: 'Meetups', icon: Calendar, badge: upcomingMeetups.length > 0 ? upcomingMeetups.length : null },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/explore/all" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
              <p className="text-white/50 text-sm">Welcome back, {user.name || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-3 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/60"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* New Member Banner (if no tier selected) */}
        {!user.hasPaidTrustDeposit && (
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Sparkles size={24} className="text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Complete Your Registration</h3>
                <p className="text-white/60 text-sm mb-3">
                  Choose a verification tier to unlock full access to models and booking features.
                </p>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  Choose Your Tier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tier & Balance Card */}
        {user.hasPaidTrustDeposit && (
          <div className={`${tierColors.bg} ${tierColors.border} border rounded-2xl p-4 mb-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <TierBadge tier={currentTier} size="lg" />
                <p className="text-white/50 text-xs mt-2">Member since {memberSince}</p>
              </div>
              {currentTier !== 'bossman' && (
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <ArrowUpRight size={14} />
                  Upgrade
                </button>
              )}
            </div>

            {/* Wallet Balance */}
            <div className="bg-black/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm flex items-center gap-2">
                  <Wallet size={16} />
                  Deposit Balance
                </span>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-lg text-green-300 text-xs font-medium transition-colors"
                >
                  <Plus size={12} />
                  Top Up
                </button>
              </div>
              <p className="text-3xl font-bold text-white">{formatNaira(user.depositBalance || 0)}</p>
              <p className="text-white/40 text-xs mt-1">Trust deposit for unlocks & bookings</p>
            </div>

          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full text-xs flex items-center justify-center text-white font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Target}
                label="Successful Meetups"
                value={user.successfulMeetups || 0}
                subValue={user.isTrustedMember ? "Trusted Member" : "Building trust"}
                color="green"
              />
              <StatCard
                icon={Calendar}
                label="Member Status"
                value={user.isNewMember ? "New" : "Active"}
                subValue={memberSince}
                color="purple"
              />
              <StatCard
                icon={TrendingUp}
                label="Success Rate"
                value={`${successRate}%`}
                subValue={`${user.successfulMeetups || 0} completed`}
                color="blue"
              />
            </div>

            {/* Profile Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <User size={18} className="text-pink-400" />
                  My Profile
                </h3>
                <button
                  onClick={handleEditProfile}
                  className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Display Name</span>
                  <span className="text-white font-medium">{user.name || 'Not set'}</span>
                </div>
                {user.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Username</span>
                    <span className="text-white/70 font-medium">@{user.username}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Phone</span>
                  <span className="text-white font-medium">+234{user.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Verification Tier</span>
                  {user.hasPaidTrustDeposit ? (
                    <TierBadge tier={currentTier} />
                  ) : (
                    <span className="text-white/40 text-sm">Not verified</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Trust Status</span>
                  <span className={`text-sm font-medium ${user.isTrustedMember ? 'text-green-400' : 'text-white/60'}`}>
                    {user.isTrustedMember ? 'Trusted Member' : user.isNewMember ? 'New Member' : 'Building Trust'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Heart size={18} className="text-pink-400" />
                  My Preferences
                </h3>
                <button
                  onClick={() => {
                    setEditPrefs(user.preferences || {});
                    setShowEditPreferences(true);
                  }}
                  className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
              {user.preferences && (user.preferences.preferredLocation || user.preferences.bodyTypes?.length > 0 || user.preferences.skinTones?.length > 0 || user.preferences.ageRanges?.length > 0 || user.preferences.services?.length > 0) ? (
                <div className="space-y-2 text-sm">
                  {user.preferences.preferredLocation && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Location</span>
                      <span className="text-white">{user.preferences.preferredLocation}</span>
                    </div>
                  )}
                  {user.preferences.bodyTypes?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Body Types</span>
                      <span className="text-white">{user.preferences.bodyTypes.filter(v => v && v !== 'No preference').join(', ') || 'Any'}</span>
                    </div>
                  )}
                  {user.preferences.skinTones?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Complexion</span>
                      <span className="text-white">{user.preferences.skinTones.filter(v => v && v !== 'No preference').join(', ') || 'Any'}</span>
                    </div>
                  )}
                  {user.preferences.ageRanges?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Age Range</span>
                      <span className="text-white">{user.preferences.ageRanges.filter(v => v && v !== 'No preference').join(', ') || 'Any'}</span>
                    </div>
                  )}
                  {user.preferences.services?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Services</span>
                      <span className="text-white text-right max-w-[60%]">{user.preferences.services.filter(v => v && v !== 'No preference').join(', ') || 'Any'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No preferences set. Tap Edit to customize your preferences.</p>
              )}
            </div>

            {/* Tier Benefits */}
            {user.tier && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Your {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Benefits
                </h3>
                <div className="space-y-2 text-sm">
                  {user.tier === 'verified' && (
                    <>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />View creator contact info</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />Unlock all photos</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />Book meetups</p>
                    </>
                  )}
                  {user.tier === 'baller' && (
                    <>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />All Verified benefits</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />VIP badge on profile</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />Priority booking</p>
                    </>
                  )}
                  {user.tier === 'bossman' && (
                    <>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />All Baller benefits</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />Concierge service</p>
                      <p className="text-white/70 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />First access to new creators</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {loadingTransactions && (
              <div className="flex items-center justify-center py-6">
                <RefreshCw size={20} className="text-pink-400 animate-spin" />
                <span className="text-white/50 ml-3 text-sm">Loading activity...</span>
              </div>
            )}
            {!loadingTransactions && transactions.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <History size={18} className="text-pink-400" />
                  Recent Activity
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
                  {transactions.slice(0, 5).map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${txn.type === 'Booking Deposit' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                          {txn.type === 'Booking Deposit'
                            ? <Calendar size={14} className="text-blue-400" />
                            : txn.type === 'Unlock Photos'
                              ? <Eye size={14} className="text-purple-400" />
                              : <Phone size={14} className="text-purple-400" />
                          }
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{txn.type}</p>
                          <p className="text-white/40 text-xs">{txn.creatorName} &bull; {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className="text-red-300 text-sm font-medium">-{formatNaira(txn.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Meetups Preview */}
            {upcomingMeetups.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Calendar size={18} className="text-pink-400" />
                    Upcoming Meetups
                  </h2>
                  <button
                    onClick={() => setActiveTab('meetups')}
                    className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {upcomingMeetups.slice(0, 2).map(meetup => (
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={handleCancelMeetup} onReview={setReviewMeetup} />
                  ))}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                <Shield size={16} />
                How Hush Works
              </h4>
              <ol className="text-blue-200/70 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500/20 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Choose a verification tier and pay your trust deposit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500/20 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Unlock contact info and photos for models you like</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500/20 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Book meetups with a 50% deposit, pay the rest in person</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500/20 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <span>Get your trust deposit back after successful meetups!</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'meetups' && (
          <div className="space-y-6">
            {loadingMeetups && (
              <div className="flex items-center justify-center py-10">
                <RefreshCw size={24} className="text-pink-400 animate-spin" />
                <span className="text-white/50 ml-3 text-sm">Loading meetups...</span>
              </div>
            )}
            {/* Upcoming Meetups */}
            {!loadingMeetups && <div>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-pink-400" />
                Upcoming Meetups ({upcomingMeetups.length})
              </h2>
              {upcomingMeetups.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeetups.map(meetup => (
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={handleCancelMeetup} onReview={setReviewMeetup} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <Calendar size={32} className="text-pink-400/60" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">No upcoming meetups</h3>
                  <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto">
                    Your calendar is empty! Browse models and book your first meetup.
                  </p>
                  <Link
                    to="/explore/all"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl text-white font-medium transition-all shadow-lg shadow-pink-500/25"
                  >
                    <Users size={18} />
                    Browse Models
                  </Link>
                </div>
              )}
            </div>}

            {/* Past Meetups */}
            {!loadingMeetups && pastMeetups.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <History size={18} className="text-white/50" />
                  Past Meetups ({pastMeetups.length})
                </h2>
                <div className="space-y-3">
                  {pastMeetups.map(meetup => (
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={handleCancelMeetup} onReview={setReviewMeetup} />
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                <Shield size={16} />
                Meetup Safety Tips
              </h4>
              <ul className="text-blue-200/70 text-sm space-y-1">
                <li>• Always exchange verification codes at the meetup</li>
                <li>• Verify codes match before proceeding</li>
                <li>• Keep your booking confirmation as reference</li>
                <li>• Report any suspicious behavior to us</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-white font-semibold mb-4">Saved Models ({favorites.length})</h2>
            {favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.map(username => (
                  <FavoriteModelCard key={username} username={username} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center relative">
                  <Heart size={36} className="text-pink-400/60" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <Plus size={16} className="text-white/40" />
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">No favorites yet</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto">
                  Tap the heart icon on any model profile to save them here for quick access.
                </p>
                <Link
                  to="/explore/all"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl text-white font-medium transition-all shadow-lg shadow-pink-500/25"
                >
                  <Users size={18} />
                  Explore Models
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Account Settings</h2>

            {/* Edit Profile */}
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Edit3 size={18} className="text-pink-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Edit Profile</p>
                  <p className="text-white/50 text-sm">Change your display name</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </button>

            {/* Deposit / Upgrade - hide if already at highest tier */}
            {!(user.hasPaidTrustDeposit && currentTier === 'bossman') && (
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Wallet size={18} className="text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">
                      {user.hasPaidTrustDeposit ? 'Upgrade Tier' : 'Make Trust Deposit'}
                    </p>
                    <p className="text-white/50 text-sm">
                      {user.hasPaidTrustDeposit
                        ? `Current: ${tierData?.name || 'None'}`
                        : 'Choose a verification tier'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-white/30" />
              </button>
            )}

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-red-300 font-medium">Sign Out</p>
                  <p className="text-red-300/50 text-sm">Log out of your account</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-300/30" />
            </button>

            {/* Register as Different Type */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-sm mb-3">Want to become a model instead?</p>
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="text-pink-400 text-sm hover:text-pink-300 transition-colors"
              >
                Sign out and register as a Creator →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <Link to="/explore/all" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Users size={20} />
            <span className="text-xs">Explore</span>
          </Link>
          <Link to="/reviews" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Star size={20} />
            <span className="text-xs">Reviews</span>
          </Link>
          <Link to="/dashboard" className="flex flex-col items-center gap-1 text-pink-400">
            <User size={20} />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={closeDepositModal}
        title={depositStep === 'select' ? "💎 Choose Your Tier" : depositStep === 'payment' ? "💳 Make Payment" : "✅ Success!"}
        size="lg"
      >
        {depositStep === 'select' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <p className="text-blue-200/80 text-sm">
                <strong>Lifetime verification</strong> — Your deposit becomes <strong>store credit</strong> for unlocking photos, contacts, and premium features.
              </p>
            </div>

            {Object.keys(PLATFORM_CONFIG.verificationTiers).map(tierId => {
              const tierDeposit = PLATFORM_CONFIG.verificationTiers[tierId]?.deposit || 0;
              const currentTierDeposit = PLATFORM_CONFIG.verificationTiers[currentTier]?.deposit || 0;
              const isLowerTier = user.hasPaidTrustDeposit && tierDeposit < currentTierDeposit;
              const isCurrentTierSelected = user.hasPaidTrustDeposit && currentTier === tierId;
              return (
                <TierSelectionCard
                  key={tierId}
                  tier={tierId}
                  isSelected={selectedTier === tierId}
                  onSelect={handleSelectTier}
                  isCurrentTier={isCurrentTierSelected}
                  isLowerTier={isLowerTier}
                />
              );
            })}

            <button
              onClick={handleProceedToPayment}
              disabled={!selectedTier || (user.hasPaidTrustDeposit && currentTier === selectedTier)}
              className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
                selectedTier && !(user.hasPaidTrustDeposit && currentTier === selectedTier)
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              {user.hasPaidTrustDeposit ? 'Upgrade Tier' : 'Continue to Payment'}
            </button>
          </div>
        )}

        {depositStep === 'payment' && selectedTier && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${getTierColor(selectedTier).bg} ${getTierColor(selectedTier).border} border`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={getTierColor(selectedTier).accent}>{getTierIcon(selectedTier)}</span>
                <span className={`font-semibold ${getTierColor(selectedTier).text}`}>
                  {getTierData(selectedTier)?.name}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNaira(getTierData(selectedTier)?.deposit || 0)}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-3">Transfer to:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Bank</span>
                  <span className="text-white font-medium">{PLATFORM_CONFIG.trustDepositAccount.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Account Number</span>
                  <span className="text-white font-mono font-medium">{PLATFORM_CONFIG.trustDepositAccount.number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Account Name</span>
                  <span className="text-white font-medium">{PLATFORM_CONFIG.trustDepositAccount.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-300 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                In demo mode, click below to simulate payment
              </p>
            </div>

            <button
              onClick={handleConfirmDeposit}
              className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-all"
            >
              I've Made the Transfer
            </button>

            <button
              onClick={() => setDepositStep('select')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {depositStep === 'confirm' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You're Verified!</h3>
            <p className="text-white/60 text-sm mb-4">
              Your {getTierData(selectedTier)?.name} tier is now active forever.
            </p>

            {/* Store credit info */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} className="text-green-400" />
                <p className="text-green-300 font-medium">Store Credit: {formatNaira(getTierData(selectedTier)?.deposit || 0)}</p>
              </div>
              <p className="text-green-200/70 text-sm">
                Your deposit is now store credit. Use it to unlock photos, contacts, and more!
              </p>
            </div>

            <button
              onClick={() => {
                closeDepositModal();
                navigate('/explore/all');
              }}
              className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold transition-all"
            >
              Start Exploring
            </button>
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="✏️ Edit Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. John D."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
            />
            <p className="text-white/40 text-xs mt-2">
              This name is shown to models when you book
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={editName.trim().length < 2}
            className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
              editName.trim().length >= 2
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-white/20 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to sign out? You'll need to verify your phone number again to log back in.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewMeetup}
        onClose={() => setReviewMeetup(null)}
        meetup={reviewMeetup}
        onSubmit={handleSubmitReview}
      />

      {/* Edit Preferences Modal */}
      <Modal
        isOpen={showEditPreferences}
        onClose={() => setShowEditPreferences(false)}
        title="Edit Preferences"
        size="lg"
      >
        <div className="space-y-5">
          {/* Location */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Preferred Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => setEditPrefs(prev => ({
                    ...prev,
                    preferredLocation: prev.preferredLocation === loc.name ? '' : loc.name
                  }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    editPrefs.preferredLocation === loc.name
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Body Types */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Body Types</label>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPE_PREFERENCES.map(type => {
                const selected = (editPrefs.bodyTypes || []).includes(type);
                const isNoPreference = type === 'No preference';
                const noPreferenceSelected = (editPrefs.bodyTypes || []).includes('No preference');
                return (
                  <button
                    key={type}
                    onClick={() => setEditPrefs(prev => {
                      const current = prev.bodyTypes || [];
                      if (isNoPreference) return { ...prev, bodyTypes: selected ? [] : ['No preference'] };
                      const filtered = current.filter(t => t !== 'No preference');
                      return { ...prev, bodyTypes: selected ? filtered.filter(t => t !== type) : [...filtered, type] };
                    })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : noPreferenceSelected && !isNoPreference
                          ? 'bg-white/5 border-white/5 text-white/30 cursor-default'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complexion */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Complexion</label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONE_PREFERENCES.map(tone => {
                const selected = (editPrefs.skinTones || []).includes(tone);
                const isNoPreference = tone === 'No preference';
                const noPreferenceSelected = (editPrefs.skinTones || []).includes('No preference');
                return (
                  <button
                    key={tone}
                    onClick={() => setEditPrefs(prev => {
                      const current = prev.skinTones || [];
                      if (isNoPreference) return { ...prev, skinTones: selected ? [] : ['No preference'] };
                      const filtered = current.filter(t => t !== 'No preference');
                      return { ...prev, skinTones: selected ? filtered.filter(t => t !== tone) : [...filtered, tone] };
                    })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : noPreferenceSelected && !isNoPreference
                          ? 'bg-white/5 border-white/5 text-white/30 cursor-default'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Age Range</label>
            <div className="flex flex-wrap gap-2">
              {AGE_PREFERENCES.map(age => {
                const selected = (editPrefs.ageRanges || []).includes(age);
                const isNoPreference = age === 'No preference';
                const noPreferenceSelected = (editPrefs.ageRanges || []).includes('No preference');
                return (
                  <button
                    key={age}
                    onClick={() => setEditPrefs(prev => {
                      const current = prev.ageRanges || [];
                      if (isNoPreference) return { ...prev, ageRanges: selected ? [] : ['No preference'] };
                      const filtered = current.filter(t => t !== 'No preference');
                      return { ...prev, ageRanges: selected ? filtered.filter(t => t !== age) : [...filtered, age] };
                    })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : noPreferenceSelected && !isNoPreference
                          ? 'bg-white/5 border-white/5 text-white/30 cursor-default'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_PREFERENCES.map(service => {
                const selected = (editPrefs.services || []).includes(service);
                return (
                  <button
                    key={service}
                    onClick={() => setEditPrefs(prev => {
                      const current = prev.services || [];
                      return { ...prev, services: selected ? current.filter(s => s !== service) : [...current, service] };
                    })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={async () => {
              updateUser({ preferences: editPrefs });
              if (user?.id) {
                await userService.updateClientPreferences(user.id, editPrefs);
              }
              setShowEditPreferences(false);
            }}
            className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold transition-all"
          >
            Save Preferences
          </button>
        </div>
      </Modal>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={closeTopUpModal}
        title={topUpStep === 'amount' ? "Top Up Balance" : topUpStep === 'payment' ? "Make Payment" : "Top Up Complete!"}
      >
        {topUpStep === 'amount' && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm">Select an amount to add to your deposit balance.</p>
            <div className="grid grid-cols-2 gap-3">
              {TOP_UP_OPTIONS.map(amount => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    topUpAmount === amount
                      ? 'bg-green-500/20 border-green-500/50 ring-2 ring-green-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className="text-white font-bold text-lg">{formatNaira(amount)}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => topUpAmount && setTopUpStep('payment')}
              disabled={!topUpAmount}
              className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
                topUpAmount ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              Continue to Payment
            </button>
          </div>
        )}

        {topUpStep === 'payment' && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-white/60 text-sm">Amount to add</p>
              <p className="text-2xl font-bold text-white">{formatNaira(topUpAmount)}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-3">Transfer to:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Bank</span>
                  <span className="text-white font-medium">{PLATFORM_CONFIG.trustDepositAccount.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Account Number</span>
                  <span className="text-white font-mono font-medium">{PLATFORM_CONFIG.trustDepositAccount.number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Account Name</span>
                  <span className="text-white font-medium">{PLATFORM_CONFIG.trustDepositAccount.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-300 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                In demo mode, click below to simulate payment
              </p>
            </div>

            <button
              onClick={handleConfirmTopUp}
              className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-all"
            >
              I've Made the Transfer
            </button>

            <button
              onClick={() => setTopUpStep('amount')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {topUpStep === 'confirm' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Balance Updated!</h3>
            <p className="text-white/60 text-sm mb-2">
              {formatNaira(topUpAmount)} has been added to your balance.
            </p>
            <p className="text-white font-bold text-lg mb-6">
              New Balance: {formatNaira(user.depositBalance || 0)}
            </p>
            <button
              onClick={closeTopUpModal}
              className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold transition-all"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
