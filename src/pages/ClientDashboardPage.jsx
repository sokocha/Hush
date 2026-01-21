import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const formatNaira = (amount) => `₦${Math.abs(amount).toLocaleString()}`;

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
  const modelData = getModelByUsername(username);
  if (!modelData) return null;

  const { profile, stats } = modelData;

  return (
    <Link
      to={`/model/${username}`}
      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-pink-500/30 transition-all"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 relative">
        <span className="text-lg font-bold text-white/50">{profile.name.slice(0, 2).toUpperCase()}</span>
        {profile.isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-semibold truncate">{profile.name}</h4>
          {profile.isVideoVerified && (
            <ShieldCheck size={14} className="text-blue-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-white/50 text-sm truncate">{profile.location} • {stats.rating} ⭐</p>
      </div>
      <ChevronRight size={20} className="text-white/30 flex-shrink-0" />
    </Link>
  );
};

const TierSelectionCard = ({ tier, isSelected, onSelect, isCurrentTier }) => {
  const tierData = getTierData(tier);
  const colors = getTierColor(tier);

  if (!tierData) return null;

  return (
    <button
      onClick={() => !isCurrentTier && onSelect(tier)}
      disabled={isCurrentTier}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isCurrentTier
          ? 'opacity-50 cursor-not-allowed'
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
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">Current</span>
            )}
          </div>
          <p className={`text-xs ${colors.accent}`}>"{tierData.tagline}"</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">{formatNaira(tierData.deposit)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tierData.benefits.slice(0, 3).map((benefit, i) => (
          <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{benefit}</span>
        ))}
      </div>
      {tierData.refund && (
        <p className="text-white/40 text-xs mt-2">
          Refundable after {tierData.refund.meetups} meetups or {tierData.refund.months} months
        </p>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

// Meetup Card Component
const MeetupCard = ({ meetup, onCancel }) => {
  const modelData = getModelByUsername(meetup.creatorUsername);
  const statusColors = {
    pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', label: 'Pending' },
    confirmed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', label: 'Confirmed' },
    declined: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', label: 'Declined' },
    rescheduled: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Rescheduled' },
    completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', label: 'Completed' },
    cancelled: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Cancelled' },
  };
  const status = statusColors[meetup.status] || statusColors.pending;

  return (
    <div className={`${status.bg} ${status.border} border rounded-xl p-4`}>
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
          </div>
        </div>
        {(meetup.status === 'pending' || meetup.status === 'confirmed') && (
          <button
            onClick={() => onCancel(meetup.id)}
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
          <span>{meetup.time}</span>
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

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div>
          <p className="text-white/40 text-xs">Rate</p>
          <p className="text-white font-bold">{formatNaira(meetup.totalPrice)}</p>
        </div>
        {meetup.clientCode && (meetup.status === 'pending' || meetup.status === 'confirmed') && (
          <div className="text-right">
            <p className="text-white/40 text-xs">Your Code</p>
            <p className="text-blue-400 font-mono font-bold">{meetup.clientCode}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser, updateTier, isClient, cancelMeetup } = useAuth();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [editName, setEditName] = useState('');
  const [depositStep, setDepositStep] = useState('select'); // select, payment, confirm

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

  // Calculate stats
  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const successRate = user.successfulMeetups > 0
    ? Math.round((user.successfulMeetups / (user.successfulMeetups + 1)) * 100)
    : 0;

  // Calculate refund progress
  const refundProgress = tierData?.refund
    ? Math.min((user.successfulMeetups / tierData.refund.meetups) * 100, 100)
    : 0;
  const meetupsToRefund = tierData?.refund
    ? Math.max(0, tierData.refund.meetups - user.successfulMeetups)
    : 0;

  // Get meetups data
  const meetups = user.meetups || [];
  const upcomingMeetups = meetups.filter(m => m.status === 'pending' || m.status === 'confirmed');
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
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <ArrowUpRight size={14} />
                Upgrade
              </button>
            </div>

            {/* Wallet Balance */}
            <div className="bg-black/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm flex items-center gap-2">
                  <Wallet size={16} />
                  Deposit Balance
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{formatNaira(user.depositBalance || 0)}</p>
              <p className="text-white/40 text-xs mt-1">Trust deposit for unlocks & bookings</p>
            </div>

            {/* Refund Progress */}
            {tierData?.refund && (
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Deposit Refund Progress</span>
                  <span className="text-white font-medium text-sm">{user.successfulMeetups}/{tierData.refund.meetups}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${tierColors.solid} transition-all duration-500`}
                    style={{ width: `${refundProgress}%` }}
                  />
                </div>
                {meetupsToRefund > 0 ? (
                  <p className="text-white/40 text-xs">
                    {meetupsToRefund} more successful meetup{meetupsToRefund > 1 ? 's' : ''} to get your {formatNaira(user.depositBalance || 0)} deposit back
                  </p>
                ) : (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <CheckCircle size={12} />
                    Eligible for deposit refund!
                  </p>
                )}
              </div>
            )}
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
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={cancelMeetup} />
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Preview */}
            {favorites.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Heart size={18} className="text-pink-400" />
                    Saved Models
                  </h2>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {favorites.slice(0, 2).map(username => (
                    <FavoriteModelCard key={username} username={username} />
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
            {/* Upcoming Meetups */}
            <div>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-pink-400" />
                Upcoming Meetups ({upcomingMeetups.length})
              </h2>
              {upcomingMeetups.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeetups.map(meetup => (
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={cancelMeetup} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <Calendar size={28} className="text-white/30" />
                  </div>
                  <h3 className="text-white font-medium mb-1">No upcoming meetups</h3>
                  <p className="text-white/50 text-sm mb-4">Book a meetup with a model to see it here</p>
                  <Link
                    to="/explore/all"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    <Users size={16} />
                    Browse Models
                  </Link>
                </div>
              )}
            </div>

            {/* Past Meetups */}
            {pastMeetups.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <History size={18} className="text-white/50" />
                  Past Meetups ({pastMeetups.length})
                </h2>
                <div className="space-y-3">
                  {pastMeetups.map(meetup => (
                    <MeetupCard key={meetup.id} meetup={meetup} onCancel={cancelMeetup} />
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
                <li>• Pay the balance only after code verification</li>
                <li>• If a model asks for full payment upfront, report them</li>
                <li>• Keep your booking confirmation as reference</li>
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
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Heart size={32} className="text-white/30" />
                </div>
                <h3 className="text-white font-medium mb-2">No favorites yet</h3>
                <p className="text-white/50 text-sm mb-4">Save models you like for quick access</p>
                <Link
                  to="/explore/all"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Users size={16} />
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

            {/* Deposit / Upgrade */}
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
            <p className="text-white/60 text-sm mb-4">
              Your trust deposit unlocks full access and is refundable after successful meetups.
            </p>

            {Object.keys(PLATFORM_CONFIG.verificationTiers).map(tierId => (
              <TierSelectionCard
                key={tierId}
                tier={tierId}
                isSelected={selectedTier === tierId}
                onSelect={handleSelectTier}
                isCurrentTier={user.hasPaidTrustDeposit && currentTier === tierId}
              />
            ))}

            <button
              onClick={handleProceedToPayment}
              disabled={!selectedTier || (user.hasPaidTrustDeposit && currentTier === selectedTier)}
              className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
                selectedTier && !(user.hasPaidTrustDeposit && currentTier === selectedTier)
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              Continue to Payment
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
            <p className="text-white/60 text-sm mb-6">
              Your {getTierData(selectedTier)?.name} tier is now active. You can browse models, unlock contacts, and book meetups.
            </p>
            <button
              onClick={closeDepositModal}
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
    </div>
  );
}
