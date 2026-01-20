import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, CreditCard, History, Calendar, Clock, MapPin,
  Shield, ShieldCheck, Award, Crown, BadgeCheck, ChevronRight,
  Heart, Star, CheckCircle, AlertTriangle, Copy, ArrowUpRight,
  X, Plus, Minus, RefreshCw, Target, Users, Sparkles, Home,
  MessageCircle, Phone, Eye, Lock, Unlock, TrendingUp, Gift
} from 'lucide-react';
import { PLATFORM_CONFIG, getModelByUsername } from '../data/models';

// ═══════════════════════════════════════════════════════════
// MOCK CLIENT DATA (in real app, this comes from auth/backend)
// ═══════════════════════════════════════════════════════════

const MOCK_CLIENT_DATA = {
  id: "client_001",
  name: "John D.",
  phone: "08098765432",
  email: "john.d@email.com",
  memberSince: "October 2024",

  // Verification & Tier
  tier: "verified", // visitor | verified | baller | bossman
  isVerified: true,
  depositPaid: 30000,

  // Balance & Financials
  walletBalance: 12500, // Remaining from deposit after unlocks
  totalSpent: 485000,

  // Stats
  successfulMeetups: 2,
  totalBookings: 3,
  meetupSuccessRate: 67,

  // Active bookings
  activeBookings: [
    {
      id: "booking_001",
      modelUsername: "destiny_x",
      modelName: "Destiny",
      type: "incall",
      duration: "1hr",
      date: "Today",
      time: "8:00 PM",
      location: "Lekki, Lagos",
      status: "confirmed", // pending | confirmed | completed | cancelled
      depositPaid: 25000,
      totalAmount: 50000,
      meetupCode: "HUSH-4782",
      createdAt: "2025-01-20T10:30:00",
    },
    {
      id: "booking_002",
      modelUsername: "bella_luxe",
      modelName: "Bella",
      type: "outcall",
      duration: "2hrs",
      date: "Tomorrow",
      time: "7:00 PM",
      location: "Your location",
      status: "pending",
      depositPaid: 40000,
      totalAmount: 130000,
      meetupCode: null, // Not yet generated
      createdAt: "2025-01-19T15:45:00",
    },
  ],

  // Transaction history
  transactions: [
    { id: "txn_001", type: "deposit", amount: 30000, description: "Trust deposit (Verified tier)", date: "Oct 15, 2024", status: "completed" },
    { id: "txn_002", type: "unlock", amount: -1000, description: "Contact unlock - Destiny", date: "Oct 20, 2024", status: "completed" },
    { id: "txn_003", type: "unlock", amount: -5000, description: "Photos unlock - Destiny", date: "Oct 20, 2024", status: "completed" },
    { id: "txn_004", type: "booking", amount: -25000, description: "Booking deposit - Destiny (1hr incall)", date: "Jan 20, 2025", status: "completed" },
    { id: "txn_005", type: "unlock", amount: -2000, description: "Contact unlock - Bella", date: "Jan 19, 2025", status: "completed" },
    { id: "txn_006", type: "booking", amount: -40000, description: "Booking deposit - Bella (2hrs outcall)", date: "Jan 19, 2025", status: "pending" },
    { id: "txn_007", type: "refund", amount: 5500, description: "Partial refund - Cancelled booking", date: "Dec 10, 2024", status: "completed" },
  ],

  // Saved/favorited models
  favorites: [
    { username: "destiny_x", addedAt: "2024-10-18" },
    { username: "bella_luxe", addedAt: "2025-01-15" },
    { username: "chioma_vip", addedAt: "2025-01-10" },
  ],

  // Unlocked content
  unlockedContacts: ["destiny_x", "bella_luxe"],
  unlockedPhotos: ["destiny_x"],
};

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

const StatCard = ({ icon: Icon, label, value, subValue, color = "pink" }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-500/20`}>
        <Icon size={20} className={`text-${color}-400`} />
      </div>
      <div className="flex-1">
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white font-bold text-lg">{value}</p>
        {subValue && <p className="text-white/40 text-xs">{subValue}</p>}
      </div>
    </div>
  </div>
);

const BookingCard = ({ booking, onViewCode }) => {
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
            <span className="text-lg font-bold text-white/50">{booking.modelName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <Link to={`/model/${booking.modelUsername}`} className="text-white font-semibold hover:text-pink-300 transition-colors">
              {booking.modelName}
            </Link>
            <p className="text-white/50 text-sm">{booking.duration} {booking.type}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status]}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Calendar size={14} />
          <span>{booking.date} at {booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <MapPin size={14} />
          <span>{booking.location}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Deposit paid</span>
          <span className="text-green-400 font-medium">{formatNaira(booking.depositPaid)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Balance due</span>
          <span className="text-white font-medium">{formatNaira(booking.totalAmount - booking.depositPaid)}</span>
        </div>
      </div>

      {booking.status === 'confirmed' && booking.meetupCode && (
        <button
          onClick={() => onViewCode(booking)}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Eye size={18} />
          View Meetup Code
        </button>
      )}

      {booking.status === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <p className="text-yellow-300 text-sm flex items-center gap-2">
            <Clock size={14} />
            Awaiting model confirmation
          </p>
        </div>
      )}
    </div>
  );
};

const TransactionItem = ({ transaction }) => {
  const typeConfig = {
    deposit: { icon: Plus, color: "text-green-400", sign: "+" },
    refund: { icon: RefreshCw, color: "text-green-400", sign: "+" },
    unlock: { icon: Unlock, color: "text-pink-400", sign: "-" },
    booking: { icon: Calendar, color: "text-blue-400", sign: "-" },
  };

  const config = typeConfig[transaction.type] || typeConfig.unlock;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`p-2 rounded-lg bg-white/5`}>
        <Icon size={16} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{transaction.description}</p>
        <p className="text-white/40 text-xs">{transaction.date}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-400' : 'text-white'}`}>
          {transaction.amount > 0 ? '+' : ''}{formatNaira(transaction.amount)}
        </p>
        {transaction.status === 'pending' && (
          <span className="text-yellow-400 text-xs">Pending</span>
        )}
      </div>
    </div>
  );
};

const FavoriteModelCard = ({ username, unlockedContact, unlockedPhotos }) => {
  const modelData = getModelByUsername(username);
  if (!modelData) return null;

  const { profile, stats, pricing } = modelData;

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
        <div className="flex items-center gap-2 mt-1">
          {unlockedContact && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Phone size={10} /> Contact
            </span>
          )}
          {unlockedPhotos && (
            <span className="text-xs text-cyan-400 flex items-center gap-1">
              <Eye size={10} /> Photos
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="text-white/30 flex-shrink-0" />
    </Link>
  );
};

const UpgradeTierCard = ({ currentTier, targetTier, onUpgrade }) => {
  const currentData = getTierData(currentTier);
  const targetData = getTierData(targetTier);
  const colors = getTierColor(targetTier);

  if (!targetData) return null;

  const upgradeCost = targetData.deposit - (currentData?.deposit || 0);

  return (
    <button
      onClick={() => onUpgrade(targetTier)}
      className={`w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <span className={colors.accent}>{getTierIcon(targetTier)}</span>
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${colors.text}`}>{targetData.name}</p>
          <p className={`text-xs ${colors.accent}`}>"{targetData.tagline}"</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">+{formatNaira(upgradeCost)}</p>
          <p className="text-white/40 text-xs">to upgrade</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {targetData.benefits.slice(0, 2).map((benefit, i) => (
          <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{benefit}</span>
        ))}
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

export default function ClientDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | bookings | history | favorites
  const [showMeetupCodeModal, setShowMeetupCodeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const client = MOCK_CLIENT_DATA;
  const tierData = getTierData(client.tier);
  const tierColors = getTierColor(client.tier);

  const handleViewMeetupCode = (booking) => {
    setSelectedBooking(booking);
    setShowMeetupCodeModal(true);
  };

  const copyMeetupCode = () => {
    if (selectedBooking?.meetupCode) {
      navigator.clipboard.writeText(selectedBooking.meetupCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  // Calculate refund progress
  const refundProgress = tierData?.refund
    ? Math.min((client.successfulMeetups / tierData.refund.meetups) * 100, 100)
    : 0;
  const meetupsToRefund = tierData?.refund?.meetups - client.successfulMeetups;

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
          <div>
            <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            <p className="text-white/50 text-sm">Welcome back, {client.name}</p>
          </div>
          <Link to="/explore/all" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Users size={20} className="text-white" />
          </Link>
        </div>

        {/* Tier & Balance Card */}
        <div className={`${tierColors.bg} ${tierColors.border} border rounded-2xl p-4 mb-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <TierBadge tier={client.tier} size="lg" />
              <p className="text-white/50 text-xs mt-2">Member since {client.memberSince}</p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
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
                Wallet Balance
              </span>
              <button className="text-white/40 hover:text-white transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            <p className="text-3xl font-bold text-white">{formatNaira(client.walletBalance)}</p>
            <p className="text-white/40 text-xs mt-1">Available for unlocks & deposits</p>
          </div>

          {/* Refund Progress */}
          {tierData?.refund && (
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Deposit Refund Progress</span>
                <span className="text-white font-medium text-sm">{client.successfulMeetups}/{tierData.refund.meetups}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${tierColors.solid} transition-all duration-500`}
                  style={{ width: `${refundProgress}%` }}
                />
              </div>
              {meetupsToRefund > 0 ? (
                <p className="text-white/40 text-xs">
                  {meetupsToRefund} more successful meetup{meetupsToRefund > 1 ? 's' : ''} to get your {formatNaira(client.depositPaid)} deposit back
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

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
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
                label="Success Rate"
                value={`${client.meetupSuccessRate}%`}
                subValue={`${client.successfulMeetups} of ${client.totalBookings} meetups`}
                color="green"
              />
              <StatCard
                icon={CreditCard}
                label="Total Spent"
                value={formatNaira(client.totalSpent)}
                subValue="All time"
                color="purple"
              />
            </div>

            {/* Active Bookings Preview */}
            {client.activeBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Calendar size={18} className="text-pink-400" />
                    Active Bookings
                  </h2>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                <BookingCard
                  booking={client.activeBookings[0]}
                  onViewCode={handleViewMeetupCode}
                />
              </div>
            )}

            {/* Favorites Preview */}
            {client.favorites.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Heart size={18} className="text-pink-400" />
                    Favorites
                  </h2>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {client.favorites.slice(0, 2).map(fav => (
                    <FavoriteModelCard
                      key={fav.username}
                      username={fav.username}
                      unlockedContact={client.unlockedContacts.includes(fav.username)}
                      unlockedPhotos={client.unlockedPhotos.includes(fav.username)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <History size={18} className="text-pink-400" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                >
                  See all <ChevronRight size={14} />
                </button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                {client.transactions.slice(0, 3).map(txn => (
                  <TransactionItem key={txn.id} transaction={txn} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Your Bookings</h2>
            {client.activeBookings.length > 0 ? (
              client.activeBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewCode={handleViewMeetupCode}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar size={32} className="text-white/30" />
                </div>
                <h3 className="text-white font-medium mb-2">No active bookings</h3>
                <p className="text-white/50 text-sm mb-4">Browse models to make a booking</p>
                <Link
                  to="/explore/all"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Users size={16} />
                  Explore Models
                </Link>
              </div>
            )}

            {/* Booking Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Meetup Tips
              </h4>
              <ul className="text-blue-200/70 text-sm space-y-1">
                <li>• Always verify the meetup code with the model</li>
                <li>• Pay remaining balance directly to the model</li>
                <li>• Confirm the meetup after to maintain your success rate</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-white font-semibold mb-4">Transaction History</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {client.transactions.length > 0 ? (
                client.transactions.map(txn => (
                  <TransactionItem key={txn.id} transaction={txn} />
                ))
              ) : (
                <div className="text-center py-8">
                  <History size={32} className="text-white/30 mx-auto mb-2" />
                  <p className="text-white/50">No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-white font-semibold mb-4">Saved Models ({client.favorites.length})</h2>
            {client.favorites.length > 0 ? (
              <div className="space-y-2">
                {client.favorites.map(fav => (
                  <FavoriteModelCard
                    key={fav.username}
                    username={fav.username}
                    unlockedContact={client.unlockedContacts.includes(fav.username)}
                    unlockedPhotos={client.unlockedPhotos.includes(fav.username)}
                  />
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <Link to="/" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/explore/all" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Users size={20} />
            <span className="text-xs">Explore</span>
          </Link>
          <Link to="/dashboard" className="flex flex-col items-center gap-1 text-pink-400">
            <Wallet size={20} />
            <span className="text-xs">Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Meetup Code Modal */}
      <Modal
        isOpen={showMeetupCodeModal}
        onClose={() => setShowMeetupCodeModal(false)}
        title="🔐 Meetup Code"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6 text-center">
              <p className="text-white/60 text-sm mb-2">Your unique meetup code</p>
              <p className="text-4xl font-mono font-bold text-white tracking-wider mb-4">
                {selectedBooking.meetupCode}
              </p>
              <button
                onClick={copyMeetupCode}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto ${
                  codeCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {codeCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {codeCopied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-blue-300 font-medium mb-2">How to use</h4>
              <ol className="text-blue-200/70 text-sm space-y-2">
                <li>1. Meet {selectedBooking.modelName} at the agreed location</li>
                <li>2. Share this code with {selectedBooking.modelName}</li>
                <li>3. {selectedBooking.modelName} will confirm the code on their end</li>
                <li>4. Pay the remaining balance ({formatNaira(selectedBooking.totalAmount - selectedBooking.depositPaid)})</li>
              </ol>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-300 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                Do not share this code with anyone except {selectedBooking.modelName}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Upgrade Tier Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="⬆️ Upgrade Your Tier"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={tierColors.accent}>{getTierIcon(client.tier)}</span>
              <div>
                <p className="text-white/50 text-xs">Current tier</p>
                <p className={`font-semibold ${tierColors.text}`}>{tierData?.name}</p>
              </div>
            </div>
          </div>

          <p className="text-white/60 text-sm">Upgrade to unlock more benefits:</p>

          {/* Available upgrades */}
          {client.tier === 'visitor' && (
            <>
              <UpgradeTierCard currentTier="visitor" targetTier="verified" onUpgrade={() => {}} />
              <UpgradeTierCard currentTier="visitor" targetTier="baller" onUpgrade={() => {}} />
              <UpgradeTierCard currentTier="visitor" targetTier="bossman" onUpgrade={() => {}} />
            </>
          )}
          {client.tier === 'verified' && (
            <>
              <UpgradeTierCard currentTier="verified" targetTier="baller" onUpgrade={() => {}} />
              <UpgradeTierCard currentTier="verified" targetTier="bossman" onUpgrade={() => {}} />
            </>
          )}
          {client.tier === 'baller' && (
            <UpgradeTierCard currentTier="baller" targetTier="bossman" onUpgrade={() => {}} />
          )}
          {client.tier === 'bossman' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <Crown size={32} className="text-amber-400 mx-auto mb-2" />
              <p className="text-amber-300 font-medium">You're at the highest tier!</p>
              <p className="text-amber-300/60 text-sm">Enjoy all Bossman benefits</p>
            </div>
          )}

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <p className="text-green-300 text-sm flex items-center gap-2">
              <Gift size={14} />
              Your deposit difference will be adjusted automatically
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
