import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Star, MapPin, Camera,
  Video, MessageCircle, Shield, CheckCircle, Lock,
  Copy, Phone, CreditCard, Send,
  Zap, ChevronRight, X, ChevronLeft,
  MessageSquare, ArrowRight, ArrowLeft, Unlock, ThumbsUp,
  Ban, AlertTriangle, Key, Home, Car, DollarSign, Aperture,
  Award, Info, ShieldCheck, EyeOff, Crown, BadgeCheck,
  Smartphone, Target, RefreshCw, Wallet, Sparkles, TrendingUp
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const CONFIG = {
  platform: {
    name: "Hush",
    // Platform's own OPay for trust deposits
    trustDepositAccount: {
      provider: "OPay",
      number: "8001234567",
      name: "Hush Technologies Ltd",
    },
    // Verification Tier Structure
    verificationTiers: {
      visitor: {
        id: "visitor",
        name: "Registered User",
        deposit: 15000,
        tagline: "i'm real",
        color: "gray",
        refund: null, // No refund
        benefits: ["View 1 preview photo", "In-app chat (limited)"],
      },
      verified: {
        id: "verified",
        name: "Verified",
        deposit: 30000,
        tagline: "i'm serious",
        color: "blue",
        refund: { meetups: 3, months: 6 }, // 3 meetups OR 6 months (whichever first)
        benefits: ["View contact info", "View all photos", "Initiate meetups", "Priority response"],
      },
      baller: {
        id: "baller",
        name: "Baller",
        deposit: 100000,
        tagline: "i'm a baller",
        color: "purple",
        refund: { meetups: 10, months: 12 }, // 10 meetups OR 12 months
        benefits: ["All Verified benefits", "VIP badge on profile", "Priority booking", "Exclusive escorts"],
      },
      bossman: {
        id: "bossman",
        name: "Bossman",
        deposit: 1000000,
        tagline: "i'm a fucking boss",
        color: "gold",
        refund: null, // Never refunded, but transferable to credit
        refundNote: "Transferable to credit",
        benefits: ["All Baller benefits", "Bossman badge", "Concierge service", "First access to new models"],
      },
    },
    // Legacy support - default to verified tier
    trustDeposit: {
      amount: 30000,
      meetupsToRefund: 3,      // X successful meetups
      monthsToRefund: 6,       // OR Y months good standing
    },
    // Anti-catfish features
    features: {
      noUserUploads: true,         // Models can't upload photos - must be in-app live or studio
      screenshotProtection: true,  // Like Netflix/WhatsApp - no screenshots
      liveVideoVerification: true, // Video call verification with admins
      phoneRegistration: true,     // Registration with phone number (OPay/PalmPay identity)
      meetupConfirmation: true,    // Code exchange to confirm actual meetups
    },
  },
  
  profile: {
    name: "Destiny",
    username: "destiny_x",
    tagline: "Your favorite girl 💋",
    bio: "Content creator • Available for bookings",
    isVerified: true,
    isVideoVerified: true,
    verifiedDate: "Jan 2025",
    location: "Lagos",
    areas: ["Lekki", "VI", "Ikoyi"],
    isAvailable: true,
    isOnline: true,
    memberSince: "March 2024",
  },
  
  stats: {
    rating: 4.8,
    reviews: 23,
    verifiedMeetups: 47,
    meetupSuccessRate: 89, // Percentage of successful meetups (not ghosted)
    repeatClients: 12,
    responseTime: "~30 min",
  },
  
  // CREATOR'S PAYMENT ACCOUNTS (P2P - clients pay directly)
  creatorPayments: [
    { provider: "OPay", number: "8012345678", isPrimary: true },
    { provider: "PalmPay", number: "8012345678", isPrimary: false },
  ],
  
  contact: {
    whatsapp: "2348012345678",
  },
  
  pricing: {
    unlockContact: 1000,           // ₦1,000 to reveal phone - Must be Verified Client
    unlockPhotos: 5000,            // ₦5,000 to reveal rest of photos - Open to All
    meetupIncall: { 1: 50000, 2: 80000, overnight: 150000 },
    meetupOutcall: { 1: 70000, 2: 100000, overnight: 200000 },
    depositPercent: 0.5,
  },
  
  extras: [
    { name: "Duo (with friend)", price: 120000 },
    { name: "GFE (girlfriend experience)", price: 30000 },
  ],
  
  boundaries: ["No bareback", "No anal", "No overnight on first booking"],
  
  photos: {
    total: 6,
    previewCount: 1,
    source: "studio",
    studioName: "Luxe Studios Lagos",
    captureDate: "Jan 15, 2025",
  },
  
  reviews: [
    { rating: 5, text: "Very professional, exactly as pictured. Arrived on time.", date: "2 days ago", verified: true, author: "John D." },
    { rating: 5, text: "Sweet girl, will definitely book again 💕", date: "1 week ago", verified: true, author: "Mike T." },
    { rating: 4, text: "Good experience overall. Communication was great.", date: "2 weeks ago", verified: true, author: "Anonymous" },
    { rating: 5, text: "10/10 would recommend. Very discreet and professional.", date: "3 weeks ago", verified: true, author: "David K." },
  ],
  
  blacklistedClients: ["08147318959", "07012345678"],
  freeMessages: 3,
};

// Simulated client state (in real app, this comes from auth/backend)
const MOCK_CLIENT = {
  isLoggedIn: true,
  isNewMember: true,           // No successful meetups yet
  hasPaidTrustDeposit: false,  // Haven't paid platform deposit
  tier: null,                  // visitor | verified | baller | bossman
  depositBalance: 0,           // Remaining balance from deposit (for unlocks)
  successfulMeetups: 0,
  meetupSuccessRate: null,     // Percentage once they have enough meetups
  monthsOnPlatform: 0,
  isTrustedMember: false,      // Earned after 3 meetups or 6 months
  phone: "8098765432",
  name: "John D.",
};

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;
const generateCode = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

// ═══════════════════════════════════════════════════════════
// MODAL WRAPPER
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

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════

const Toast = ({ message, type = "success", isVisible, onHide }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full ${colors[type]} shadow-lg animate-slideDown flex items-center gap-2`}>
      {type === 'success' && <CheckCircle size={18} />}
      {type === 'error' && <AlertTriangle size={18} />}
      {type === 'info' && <Info size={18} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PHOTO GALLERY MODAL (Swipeable Full-Screen)
// ═══════════════════════════════════════════════════════════

const PhotoGalleryModal = ({ isOpen, onClose, photos, initialIndex = 0, photosUnlocked, onUnlockPhotos }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  if (!isOpen) return null;

  const totalPhotos = photos.total;
  const previewCount = photos.previewCount;
  const isLocked = !photosUnlocked && currentIndex >= previewCount;

  const goNext = () => setCurrentIndex(prev => Math.min(prev + 1, totalPhotos - 1));
  const goPrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onClose();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <X size={24} />
        </button>
        <span className="text-white font-medium">{currentIndex + 1} / {totalPhotos}</span>
        <div className="w-10" />
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button onClick={goPrev} className="absolute left-2 p-3 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-all z-10">
            <ChevronLeft size={32} />
          </button>
        )}
        {currentIndex < totalPhotos - 1 && (
          <button onClick={goNext} className="absolute right-2 p-3 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-all z-10">
            <ChevronRight size={32} />
          </button>
        )}

        {/* Photo display */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {isLocked ? (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Lock size={48} className="text-white/60" />
              </div>
              <p className="text-white/60 mb-4">This photo is locked</p>
              <button
                onClick={onUnlockPhotos}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-full text-white font-semibold transition-colors"
              >
                Unlock All Photos — {formatNaira(CONFIG.pricing.unlockPhotos)}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl aspect-[3/4] bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-6xl">📸</span>
            </div>
          )}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
        {[...Array(totalPhotos)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-6' :
              (!photosUnlocked && i >= previewCount) ? 'bg-white/20' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/10 rounded ${className}`} />
);

// ═══════════════════════════════════════════════════════════
// PULL TO REFRESH
// ═══════════════════════════════════════════════════════════

const usePullToRefresh = (onRefresh) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = React.useRef(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return { isPulling, isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd };
};

// ═══════════════════════════════════════════════════════════
// AGE VERIFICATION
// ═══════════════════════════════════════════════════════════

const AgeVerification = ({ onVerify }) => (
  <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-pink-500/30 rounded-2xl p-8 max-w-md w-full text-center">
      <Shield className="w-16 h-16 text-pink-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Age Verification</h2>
      <p className="text-gray-400 mb-6">This page contains adult content. You must be 18 or older to enter.</p>
      <button onClick={onVerify} className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all text-lg">
        I am 18+ — Enter
      </button>
      <a href="https://google.com" className="block mt-4 text-gray-500 text-sm hover:text-gray-400">I am under 18 — Exit</a>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// TRUST DEPOSIT MODAL (Platform holds refundable deposit with Tiers)
// ═══════════════════════════════════════════════════════════

const TierBadge = ({ tier, size = "md" }) => {
  const tiers = CONFIG.platform.verificationTiers;
  const tierData = tiers[tier];
  if (!tierData) return null;

  const colors = {
    visitor: "bg-gray-500/20 border-gray-500/30 text-gray-300",
    verified: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    baller: "bg-purple-500/20 border-purple-500/30 text-purple-300",
    bossman: "bg-amber-500/20 border-amber-500/30 text-amber-300",
  };

  const icons = {
    visitor: <BadgeCheck size={size === "sm" ? 12 : 16} />,
    verified: <ShieldCheck size={size === "sm" ? 12 : 16} />,
    baller: <Award size={size === "sm" ? 12 : 16} />,
    bossman: <Crown size={size === "sm" ? 12 : 16} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${colors[tier]}`}>
      {icons[tier]}
      {tierData.name}
    </span>
  );
};

const TrustDepositModal = ({ isOpen, onClose, onDepositPaid }) => {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState('verified');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { verificationTiers, trustDepositAccount } = CONFIG.platform;
  const tiers = Object.values(verificationTiers);
  const currentTier = verificationTiers[selectedTier];

  const copyAccount = () => {
    navigator.clipboard.writeText(trustDepositAccount.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    onDepositPaid(selectedTier);
    setStep(3);
  };

  const resetAndClose = () => {
    onClose();
    setStep(1);
    setConfirmed(false);
  };

  const getTierColor = (tier) => {
    const colors = {
      visitor: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-300", accent: "text-gray-400" },
      verified: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", accent: "text-blue-400" },
      baller: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", accent: "text-purple-400" },
      bossman: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", accent: "text-amber-400" },
    };
    return colors[tier] || colors.visitor;
  };

  const getTierIcon = (tierId) => {
    const icons = {
      visitor: <BadgeCheck size={20} />,
      verified: <ShieldCheck size={20} />,
      baller: <Award size={20} />,
      bossman: <Crown size={20} />,
    };
    return icons[tierId] || icons.visitor;
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="🛡️ Choose Your Verification Level" size="lg">
      {step === 1 && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Info size={18} className="text-blue-400" />
              Why verify?
            </h4>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              Your deposit level shows escorts how serious you are. Higher tiers get better access and priority treatment.
            </p>
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            {tiers.map((tier) => {
              const colors = getTierColor(tier.id);
              const isSelected = selectedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-offset-gray-900 ring-${tier.id === 'bossman' ? 'amber' : tier.id === 'baller' ? 'purple' : tier.id === 'verified' ? 'blue' : 'gray'}-500/50`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-white/10'}`}>
                      <span className={isSelected ? colors.accent : 'text-white/60'}>{getTierIcon(tier.id)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${isSelected ? colors.text : 'text-white'}`}>{tier.name}</span>
                        <span className="text-white font-bold">{formatNaira(tier.deposit)}</span>
                      </div>
                      <p className={`text-sm italic mb-2 ${isSelected ? colors.accent : 'text-white/50'}`}>"{tier.tagline}"</p>
                      <div className="flex flex-wrap gap-1">
                        {tier.benefits.slice(0, 3).map((benefit, i) => (
                          <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{benefit}</span>
                        ))}
                      </div>
                      {tier.refund ? (
                        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Refundable after {tier.refund.meetups} meetups or {tier.refund.months} months
                        </p>
                      ) : tier.refundNote ? (
                        <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                          <Info size={12} />
                          {tier.refundNote}
                        </p>
                      ) : (
                        <p className="text-white/40 text-xs mt-2">Non-refundable</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? `${colors.border} ${colors.bg}` : 'border-white/30'
                    }`}>
                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${
                        tier.id === 'bossman' ? 'bg-amber-400' :
                        tier.id === 'baller' ? 'bg-purple-400' :
                        tier.id === 'verified' ? 'bg-blue-400' : 'bg-gray-400'
                      }`} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Forfeiture warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-amber-200 text-sm">
              <AlertTriangle size={14} className="inline mr-1" />
              Deposits forfeited for no-shows, harassment, or terms violations.
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold transition-all"
          >
            Continue — {formatNaira(currentTier.deposit)}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className={`${getTierColor(selectedTier).bg} ${getTierColor(selectedTier).border} border rounded-xl p-4 text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={getTierColor(selectedTier).accent}>{getTierIcon(selectedTier)}</span>
              <span className={`font-medium ${getTierColor(selectedTier).text}`}>{currentTier.name}</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatNaira(currentTier.deposit)}</p>
            <p className="text-white/50 text-sm mt-1 italic">"{currentTier.tagline}"</p>
          </div>

          <p className="text-white/60 text-sm">Pay to {CONFIG.platform.name}'s account:</p>

          <button
            onClick={copyAccount}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              copied ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="p-3 bg-green-500 rounded-xl">
              <Zap size={20} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold">{trustDepositAccount.provider}</p>
              <p className="text-white/70 font-mono text-lg">{trustDepositAccount.number}</p>
              <p className="text-white/50 text-sm">{trustDepositAccount.name}</p>
            </div>
            {copied ? (
              <span className="text-green-400 font-medium">Copied!</span>
            ) : (
              <Copy size={20} className="text-white/40" />
            )}
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <p className="text-blue-200 text-sm">
              <Info size={14} className="inline mr-1" />
              Use your registered phone number ({MOCK_CLIENT.phone}) as payment reference
            </p>
          </div>

          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer border border-white/10">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 rounded border-white/30 bg-white/10 text-pink-500"
            />
            <span className="text-white/80 text-sm">I have sent {formatNaira(currentTier.deposit)} to the account above</span>
          </label>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2">
              <ArrowLeft size={18} />Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                confirmed ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Confirm<ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-4">
          <div className={`w-20 h-20 ${getTierColor(selectedTier).bg} rounded-full flex items-center justify-center mx-auto`}>
            <span className={getTierColor(selectedTier).accent}>{getTierIcon(selectedTier)}</span>
          </div>
          <div>
            <TierBadge tier={selectedTier} />
          </div>
          <h4 className="text-xl font-bold text-white">Welcome, {currentTier.name}! 🎉</h4>
          <p className="text-white/60 text-sm">
            Your {formatNaira(currentTier.deposit)} deposit is being verified.
          </p>

          {/* Benefits unlocked */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-left">
            <p className="text-white/60 text-sm mb-2">You can now:</p>
            <div className="space-y-1">
              {currentTier.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-white/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {currentTier.refund && (
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 text-left">
              <p className="text-green-300 text-sm mb-2">Refund progress:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-green-500 rounded-full" />
                </div>
                <span className="text-white/60 text-sm">0/{currentTier.refund.meetups}</span>
              </div>
              <p className="text-white/40 text-xs mt-2">Complete {currentTier.refund.meetups} meetups to get your deposit back</p>
            </div>
          )}

          <button
            onClick={resetAndClose}
            className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold"
          >
            Start Exploring
          </button>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// P2P PAYMENT STEP (Client pays Creator directly)
// ═══════════════════════════════════════════════════════════

const P2PPaymentStep = ({ amount, serviceName, onBack, onConfirm }) => {
  const [copied, setCopied] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  
  const primaryAccount = CONFIG.creatorPayments.find(p => p.isPrimary) || CONFIG.creatorPayments[0];

  const copyAccount = (number, index) => {
    navigator.clipboard.writeText(number);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 text-center">
        <p className="text-pink-300 text-sm mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-white">{formatNaira(amount)}</p>
        <p className="text-white/50 text-sm mt-1">{serviceName}</p>
      </div>
      
      <p className="text-white/60 text-sm">Pay {CONFIG.profile.name} directly:</p>
      
      <div className="space-y-2">
        {CONFIG.creatorPayments.map((account, i) => (
          <button
            key={i}
            onClick={() => copyAccount(account.number, i)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              copied === i ? 'bg-green-500/20 border-green-500/50' : 
              account.isPrimary ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' :
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`p-2 rounded-lg ${account.provider === 'OPay' ? 'bg-green-500' : 'bg-purple-500'}`}>
              {account.provider === 'OPay' ? <Zap size={16} className="text-white" /> : <CreditCard size={16} className="text-white" />}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{account.provider}</p>
                {account.isPrimary && <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">Preferred</span>}
              </div>
              <p className="text-white/60 font-mono">{account.number}</p>
            </div>
            {copied === i ? (
              <span className="text-green-400 text-sm">Copied!</span>
            ) : (
              <Copy size={16} className="text-white/40" />
            )}
          </button>
        ))}
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
        <p className="text-amber-200 text-sm">
          <AlertTriangle size={14} className="inline mr-1" />
          Payment goes directly to {CONFIG.profile.name}. {CONFIG.platform.name} does not process this payment.
        </p>
      </div>
      
      <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer border border-white/10">
        <input 
          type="checkbox" 
          checked={confirmed} 
          onChange={(e) => setConfirmed(e.target.checked)} 
          className="w-5 h-5 rounded border-white/30 bg-white/10 text-pink-500" 
        />
        <span className="text-white/80 text-sm">I have sent the payment</span>
      </label>
      
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2">
          <ArrowLeft size={18} />Back
        </button>
        <button 
          onClick={() => confirmed && onConfirm()} 
          disabled={!confirmed}
          className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            confirmed ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          I've Paid<ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// CLIENT VERIFICATION MODAL
// ═══════════════════════════════════════════════════════════

const ClientVerificationModal = ({ isOpen, onClose, onVerified, nextAction }) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('input');

  const checkBlacklist = () => {
    setStatus('checking');
    setTimeout(() => {
      const cleanPhone = phone.replace(/\D/g, '');
      setStatus(CONFIG.blacklistedClients.some(b => cleanPhone.includes(b.replace(/\D/g, ''))) ? 'blocked' : 'verified');
    }, 800);
  };

  const handleContinue = () => { onVerified(phone); onClose(); setPhone(''); setStatus('input'); };
  const resetAndClose = () => { onClose(); setPhone(''); setStatus('input'); };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="🔒 Quick Verification">
      {status === 'input' && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-200/80 text-sm">We check your number against our community blacklist to protect creators.</p>
          </div>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-pink-500 focus:outline-none" />
          <button onClick={checkBlacklist} disabled={phone.length < 11} className={`w-full py-4 rounded-xl font-semibold ${phone.length >= 11 ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>Verify & Continue</button>
        </div>
      )}
      {status === 'checking' && <div className="text-center py-8"><div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-white/60">Checking...</p></div>}
      {status === 'blocked' && (
        <div className="text-center space-y-4 py-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto"><Ban size={40} className="text-red-400" /></div>
          <h4 className="text-xl font-bold text-white">Access Denied</h4>
          <p className="text-white/60 text-sm">This number has been flagged.</p>
        </div>
      )}
      {status === 'verified' && (
        <div className="text-center space-y-4 py-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"><CheckCircle size={40} className="text-green-400" /></div>
          <h4 className="text-xl font-bold text-white">Verified! ✓</h4>
          <button onClick={handleContinue} className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold">Continue</button>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// MEETUP MODAL (with Trust Deposit check + P2P payment)
// ═══════════════════════════════════════════════════════════

const MeetupModal = ({ isOpen, onClose, clientState, onNeedsTrustDeposit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', age: '', twitter: '', date: '', time: '', locationType: 'incall', location: '', duration: '1' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [codes, setCodes] = useState({ client: '', creator: '' });

  const hasOutcall = CONFIG.pricing.meetupOutcall !== null;
  const getMeetupPrice = () => {
    const rates = formData.locationType === 'outcall' && hasOutcall ? CONFIG.pricing.meetupOutcall : CONFIG.pricing.meetupIncall;
    return formData.duration === 'overnight' ? rates.overnight : rates[formData.duration] || rates[1];
  };
  const depositAmount = Math.round(getMeetupPrice() * CONFIG.pricing.depositPercent);
  const balanceAmount = getMeetupPrice() - depositAmount;
  const isFormValid = formData.name && formData.age && formData.date && formData.time && formData.location && agreedToTerms;

  const handleStartBooking = () => {
    // Check if client has any verification tier (required to initiate meetups)
    if (!clientState.tier) {
      onNeedsTrustDeposit();
      onClose();
      return;
    }
    setStep(2);
  };

  const handlePaymentConfirm = () => { 
    setCodes({ client: generateCode('C'), creator: generateCode('X') }); 
    setStep(4); 
  };
  
  const handleComplete = () => {
    window.open(`https://wa.me/${CONFIG.contact.whatsapp}?text=${encodeURIComponent(`🌹 MEETUP BOOKING\n\nName: ${formData.name}\nDate: ${formData.date}\nTime: ${formData.time}\nType: ${formData.locationType === 'incall' ? 'Incall' : 'Outcall'}\nArea: ${formData.location}\nDuration: ${formData.duration === 'overnight' ? 'Overnight' : formData.duration + 'hr'}\n\nTotal: ${formatNaira(getMeetupPrice())}\nDeposit: ${formatNaira(depositAmount)} sent to your ${CONFIG.creatorPayments[0].provider}\nBalance: ${formatNaira(balanceAmount)} at meetup\n\n🔐 MY CODE: ${codes.client}`)}`, '_blank');
    resetAndClose();
  };
  
  const resetAndClose = () => { 
    onClose(); 
    setStep(1); 
    setFormData({ name: '', age: '', twitter: '', date: '', time: '', locationType: 'incall', location: '', duration: '1' }); 
    setAgreedToTerms(false); 
    setCodes({ client: '', creator: '' }); 
  };

  const incallRates = CONFIG.pricing.meetupIncall;
  const outcallRates = CONFIG.pricing.meetupOutcall;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="🌹 Book Meetup" size="lg">
      {step === 1 && (
        <div className="space-y-4">
          {/* Trust status banner with tier */}
          {clientState.tier ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TierBadge tier={clientState.tier} />
                  {clientState.meetupSuccessRate && (
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <Target size={12} />{clientState.meetupSuccessRate}% success
                    </span>
                  )}
                </div>
                {CONFIG.platform.verificationTiers[clientState.tier]?.refund && (
                  <p className="text-white/50 text-xs">{clientState.successfulMeetups}/{CONFIG.platform.verificationTiers[clientState.tier].refund.meetups} to refund</p>
                )}
              </div>
              {CONFIG.platform.verificationTiers[clientState.tier]?.refund && (
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(clientState.successfulMeetups / CONFIG.platform.verificationTiers[clientState.tier].refund.meetups) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-200 text-sm flex items-center gap-2">
                <Shield size={16} />
                Verification required to initiate meetups. Choose your tier.
              </p>
            </div>
          )}

          {/* Code system explanation */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/70 text-sm"><Key size={14} className="inline mr-1" /><strong>Code verification:</strong> Get a code after paying. Exchange codes when you meet.</p>
          </div>

          {/* Location type */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFormData({...formData, locationType: 'incall'})} className={`p-4 rounded-xl border text-left ${formData.locationType === 'incall' ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              <div className="flex items-center gap-2 mb-1"><Home size={18} className={formData.locationType === 'incall' ? 'text-pink-400' : 'text-white/60'} /><span className={formData.locationType === 'incall' ? 'text-white font-medium' : 'text-white/70'}>Incall</span></div>
              <p className="text-white/50 text-xs">You come to her</p>
              <p className="text-pink-300 text-sm mt-1">From {formatNaira(incallRates[1])}</p>
            </button>
            {hasOutcall ? (
              <button type="button" onClick={() => setFormData({...formData, locationType: 'outcall'})} className={`p-4 rounded-xl border text-left ${formData.locationType === 'outcall' ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="flex items-center gap-2 mb-1"><Car size={18} className={formData.locationType === 'outcall' ? 'text-pink-400' : 'text-white/60'} /><span className={formData.locationType === 'outcall' ? 'text-white font-medium' : 'text-white/70'}>Outcall</span></div>
                <p className="text-white/50 text-xs">She comes to you</p>
                <p className="text-pink-300 text-sm mt-1">From {formatNaira(outcallRates[1])}</p>
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 opacity-50">
                <div className="flex items-center gap-2 mb-1"><Car size={18} className="text-white/40" /><span className="text-white/40">Outcall</span></div>
                <p className="text-white/30 text-xs">Not available</p>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="grid grid-cols-3 gap-2">
            {[{ value: '1', label: '1 Hr' }, { value: '2', label: '2 Hrs' }, { value: 'overnight', label: 'Overnight' }].map((opt) => {
              const rates = formData.locationType === 'outcall' && hasOutcall ? outcallRates : incallRates;
              const price = opt.value === 'overnight' ? rates.overnight : rates[opt.value];
              return (
                <button key={opt.value} type="button" onClick={() => setFormData({...formData, duration: opt.value})} className={`p-3 rounded-xl border text-center ${formData.duration === opt.value ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs mt-1">{formatNaira(price)}</p>
                </button>
              );
            })}
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your name *" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none" />
            <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="Age *" min="18" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} min={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none" />
            <select value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none">
              <option value="">Time *</option>
              {['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none">
            <option value="">Area *</option>
            {(formData.locationType === 'incall' ? CONFIG.profile.areas : ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Mainland']).map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <label className="flex items-start gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/10">
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-white/30 bg-white/10 text-pink-500" />
            <span className="text-white/70 text-xs">I agree: 50% deposit required • Pay {CONFIG.profile.name} directly • Code exchange at meetup</span>
          </label>

          {/* Price summary */}
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">{formData.locationType === 'incall' ? '🏠 Incall' : '🚗 Outcall'} • {formData.duration === 'overnight' ? 'Overnight' : formData.duration + 'hr'}</span>
              <span className="text-white font-bold text-lg">{formatNaira(getMeetupPrice())}</span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Deposit (pay now):</span><span className="text-pink-300 font-bold">{formatNaira(depositAmount)}</span></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-white/60">Balance (at meetup):</span><span className="text-white/80">{formatNaira(balanceAmount)}</span></div>
          </div>

          <button
            onClick={handleStartBooking}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-xl font-semibold ${isFormValid ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {!clientState.tier ? 'Get Verified to Book' : 'Pay Deposit'}
          </button>
        </div>
      )}

      {step === 2 && (
        <P2PPaymentStep 
          amount={depositAmount} 
          serviceName={`Meetup deposit (${CONFIG.profile.name})`} 
          onBack={() => setStep(1)} 
          onConfirm={handlePaymentConfirm} 
        />
      )}

      {step === 4 && (
        <div className="space-y-4 py-2">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-green-400" /></div>
            <h4 className="text-xl font-bold text-white mb-2">Deposit Sent! 🌹</h4>
            <p className="text-white/60 text-sm">{CONFIG.profile.name} will confirm receipt</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl p-5 text-center">
            <p className="text-blue-300 font-medium mb-2"><Key size={16} className="inline mr-1" />YOUR CODE</p>
            <div className="bg-black/40 rounded-xl p-4 mb-2"><p className="text-4xl font-mono font-bold text-white tracking-widest">{codes.client}</p></div>
            <p className="text-white/60 text-sm">Give this to {CONFIG.profile.name} when you meet</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-white/60">Type:</div><div className="text-white">{formData.locationType === 'incall' ? '🏠 Incall' : '🚗 Outcall'}</div>
              <div className="text-white/60">Date:</div><div className="text-white">{formData.date}</div>
              <div className="text-white/60">Time:</div><div className="text-white">{formData.time}</div>
              <div className="text-white/60">Area:</div><div className="text-white">{formData.location}</div>
            </div>
            <div className="border-t border-white/10 mt-3 pt-3">
              <div className="flex justify-between"><span className="text-white/60">Deposit:</span><span className="text-yellow-400">{formatNaira(depositAmount)} (pending)</span></div>
              <div className="flex justify-between"><span className="text-white/60">Balance:</span><span className="text-white">{formatNaira(balanceAmount)}</span></div>
            </div>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-amber-200 text-sm"><strong>⚠️</strong> Exchange codes at meetup, then pay balance</p>
          </div>
          
          <button onClick={handleComplete} className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"><Send size={18} />Notify on WhatsApp</button>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// SIMPLIFIED MODALS
// ═══════════════════════════════════════════════════════════

const UnlockPhotosModal = ({ isOpen, onClose, onUnlock, clientState, onDeductBalance, onNeedsTrustDeposit }) => {
  const resetAndClose = () => { onClose(); };
  const lockedCount = CONFIG.photos.total - CONFIG.photos.previewCount;
  const price = CONFIG.pricing.unlockPhotos;
  const hasEnoughBalance = clientState?.depositBalance >= price;
  const shortfall = price - (clientState?.depositBalance || 0);

  const handlePayFromBalance = () => {
    onDeductBalance(price);
    onUnlock();
    resetAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="📸 Unlock Photos">
      <div className="space-y-4">
        <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 text-center">
          <Camera size={32} className="text-pink-400 mx-auto mb-2" />
          <p className="text-white font-medium">Unlock {lockedCount} more photos</p>
          <p className="text-3xl font-bold text-white mt-2">{formatNaira(price)}</p>
          <p className="text-white/50 text-sm mt-2">Deducted from deposit balance</p>
        </div>

        {/* Balance status */}
        <div className={`rounded-xl p-4 ${hasEnoughBalance ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-sm">Your Balance</span>
            <span className={`font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>{formatNaira(clientState?.depositBalance || 0)}</span>
          </div>
          {!hasEnoughBalance && (
            <p className="text-red-300 text-sm mt-2">
              You need {formatNaira(shortfall)} more. Top up your deposit to continue.
            </p>
          )}
        </div>

        {hasEnoughBalance ? (
          <button onClick={handlePayFromBalance} className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            <Zap size={18} />
            Pay from Deposit
          </button>
        ) : (
          <button onClick={() => { resetAndClose(); onNeedsTrustDeposit(); }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold">
            Top Up Deposit
          </button>
        )}
      </div>
    </Modal>
  );
};

const UnlockContactModal = ({ isOpen, onClose, onUnlock, clientState, onNeedsTrustDeposit, onDeductBalance }) => {
  const resetAndClose = () => { onClose(); };
  const price = CONFIG.pricing.unlockContact;
  const hasEnoughBalance = clientState?.depositBalance >= price;
  const shortfall = price - (clientState?.depositBalance || 0);

  const handlePayFromBalance = () => {
    onDeductBalance(price);
    onUnlock();
    resetAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="📱 Get Phone Number">
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-white font-medium mb-2">What you get:</p>
          <p className="text-white/70 text-sm">✓ Direct WhatsApp number • ✓ Lifetime access</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
          <p className="text-4xl font-bold text-white">{formatNaira(price)}</p>
          <p className="text-white/50 text-sm mt-2">Deducted from deposit balance</p>
        </div>

        {/* Balance status */}
        <div className={`rounded-xl p-4 ${hasEnoughBalance ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-sm">Your Balance</span>
            <span className={`font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>{formatNaira(clientState?.depositBalance || 0)}</span>
          </div>
          {!hasEnoughBalance && (
            <p className="text-red-300 text-sm mt-2">
              You need {formatNaira(shortfall)} more. Top up your deposit to continue.
            </p>
          )}
        </div>

        {hasEnoughBalance ? (
          <button onClick={handlePayFromBalance} className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            <Zap size={18} />
            Pay from Deposit
          </button>
        ) : (
          <button onClick={() => { resetAndClose(); onNeedsTrustDeposit(); }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold">
            Top Up Deposit
          </button>
        )}
      </div>
    </Modal>
  );
};

const ContactRevealedModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(CONFIG.contact.whatsapp); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📱 Phone Number">
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
          <Phone size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">{CONFIG.profile.name}'s WhatsApp</p>
          <p className="text-green-300 font-mono text-2xl">+{CONFIG.contact.whatsapp}</p>
        </div>
        <button onClick={copy} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          {copied ? <><CheckCircle size={18} />Copied!</> : <><Copy size={18} />Copy Number</>}
        </button>
        <a href={`https://wa.me/${CONFIG.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold text-center">
          Open WhatsApp
        </a>
      </div>
    </Modal>
  );
};

const InAppChatModal = ({ isOpen, onClose, onUpgrade }) => {
  const [messages, setMessages] = useState([{ from: 'creator', text: "Hey! 💕 Check my rates above. What interests you?" }]);
  const [input, setInput] = useState('');
  const [msgCount, setMsgCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const replies = ["Nice! Ready to book? 😊", "I'm available. Let's set it up!", "Sure! 💕"];
  const send = () => {
    if (!input.trim() || locked) return;
    const count = msgCount + 1;
    setMessages(m => [...m, { from: 'user', text: input }]);
    setInput('');
    setMsgCount(count);
    setTimeout(() => {
      if (count >= CONFIG.freeMessages) { setLocked(true); setMessages(m => [...m, { from: 'system', text: 'Free messages used. Upgrade!' }]); }
      else { setMessages(m => [...m, { from: 'creator', text: replies[count - 1] || replies[0] }]); }
    }, 800);
  };
  const reset = () => { setMessages([{ from: 'creator', text: "Hey! 💕 Check my rates above. What interests you?" }]); setMsgCount(0); setLocked(false); onClose(); };
  return (
    <Modal isOpen={isOpen} onClose={reset} title="💬 Chat" size="lg">
      <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">DE</div>
        <div className="flex-1"><p className="text-white font-medium">{CONFIG.profile.name}</p><p className="text-green-400 text-xs">● Online</p></div>
        <div className="bg-white/5 px-3 py-1 rounded-lg"><p className={`font-bold ${msgCount >= CONFIG.freeMessages ? 'text-red-400' : 'text-green-400'}`}>{Math.max(0, CONFIG.freeMessages - msgCount)}</p></div>
      </div>
      <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'system' ? <div className="bg-amber-500/20 rounded-xl p-3"><p className="text-amber-200 text-sm"><Lock size={14} className="inline mr-1" />{m.text}</p></div>
            : <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.from === 'user' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white'}`}><p className="text-sm">{m.text}</p></div>}
          </div>
        ))}
      </div>
      {locked ? (
        <div className="p-4 bg-white/5 rounded-xl text-center">
          <button onClick={() => onUpgrade('contact')} className="w-full py-3 bg-pink-500 rounded-xl text-white font-semibold">Unlock WhatsApp — {formatNaira(CONFIG.pricing.unlockContact)}</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && send()} placeholder="Type..." className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
          <button onClick={send} className="px-4 bg-pink-500 rounded-xl text-white"><Send size={20} /></button>
        </div>
      )}
    </Modal>
  );
};

const AllReviewsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="⭐ Reviews" size="lg">
    <div className="space-y-3">
      {CONFIG.reviews.map((r, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={14} className={j < r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />)}</div>
            {r.verified && <span className="text-xs text-green-400"><CheckCircle size={10} className="inline mr-1" />Verified</span>}
          </div>
          <p className="text-white/80 text-sm">"{r.text}"</p>
          <p className="text-white/40 text-xs mt-2">{r.author} • {r.date}</p>
        </div>
      ))}
    </div>
  </Modal>
);

const VideoVerificationModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="📹 Video Verified">
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
        <Video size={32} className="text-blue-400 mx-auto mb-2" />
        <p className="text-white font-medium">Live Video Call Verification</p>
        <p className="text-blue-300/70 text-sm mt-1">Verified by {CONFIG.platform.name} Admins</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Live video call with our verification team</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Face matches profile photos exactly</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />100% anti-catfish guarantee</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Last verified: {CONFIG.profile.verifiedDate}</div>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
        <p className="text-green-300 text-sm flex items-center gap-2">
          <ShieldCheck size={16} />
          This model is who they say they are. Verified in real-time.
        </p>
      </div>
      <button onClick={onClose} className="w-full py-3 bg-white/10 rounded-xl text-white">Got it</button>
    </div>
  </Modal>
);

const PhotoVerificationModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="📷 Verified Photos">
    <div className="space-y-4">
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
        <Aperture size={32} className="text-cyan-400 mx-auto mb-2" />
        <p className="text-white font-medium">Anti-Catfish Photo System</p>
        <p className="text-cyan-300/70 text-sm mt-1">Photos by {CONFIG.photos.studioName}</p>
      </div>

      {/* How it works */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Camera size={16} className="text-cyan-400" />
          How Photos Work on {CONFIG.platform.name}
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Ban size={12} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium">No User Uploads</p>
              <p className="text-white/60 text-xs">Models cannot upload their own photos. Period.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Camera size={12} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-medium">In-App Live Photos</p>
              <p className="text-white/60 text-xs">All photos must be taken live within the app.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Aperture size={12} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">Professional Studio Option</p>
              <p className="text-white/60 text-xs">For those who can't take good photos, our partner studios take and upload directly to profiles.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Identity verified at capture</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Watermarked with {CONFIG.platform.name}</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Taken: {CONFIG.photos.captureDate}</div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
        <p className="text-green-300 text-sm flex items-center gap-2">
          <ShieldCheck size={16} />
          What you see is exactly what you get. No catfishing.
        </p>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-white/10 rounded-xl text-white">Got it</button>
    </div>
  </Modal>
);

const ReportModal = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ phone: '', reason: '' });
  const reset = () => { onClose(); setSubmitted(false); setForm({ phone: '', reason: '' }); };
  return (
    <Modal isOpen={isOpen} onClose={reset} title="⚠️ Report">
      {!submitted ? (
        <div className="space-y-4">
          <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Their phone *" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
          <select value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white">
            <option value="">Reason *</option><option>Time waster</option><option>No-show</option><option>Fake payment</option><option>Harassment</option>
          </select>
          <button onClick={() => setSubmitted(true)} disabled={!form.phone || !form.reason} className={`w-full py-4 rounded-xl font-semibold ${form.phone && form.reason ? 'bg-red-500 text-white' : 'bg-white/10 text-white/40'}`}>Submit</button>
        </div>
      ) : (
        <div className="text-center py-4"><CheckCircle size={48} className="text-green-400 mx-auto mb-4" /><p className="text-white font-bold">Submitted</p><button onClick={reset} className="mt-4 w-full py-3 bg-white/10 rounded-xl text-white">Close</button></div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [photosUnlocked, setPhotosUnlocked] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(null);
  const [modal, setModal] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [photoGalleryIndex, setPhotoGalleryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  // Client state (simulated - would come from auth in real app)
  const [clientState, setClientState] = useState(MOCK_CLIENT);

  const { profile, stats, pricing, photos } = CONFIG;
  const hasOutcall = pricing.meetupOutcall !== null;

  // Pull to refresh
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('Profile refreshed', 'info');
  };
  const { isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(handleRefresh);

  const protectedAction = (action) => {
    if (verifiedPhone) { setModal(action); }
    else { setPendingAction(action); setModal('verify'); }
  };

  const onVerified = (phone) => {
    setVerifiedPhone(phone);
    if (pendingAction) { setModal(pendingAction); setPendingAction(null); }
  };

  const chatUpgrade = (type) => {
    setModal(null);
    setTimeout(() => setModal(type === 'contact' ? 'unlockContact' : null), 100);
  };

  const handleTrustDepositPaid = (tier = 'verified') => {
    const tierDeposit = CONFIG.platform.verificationTiers[tier]?.deposit || 0;
    setClientState(prev => ({
      ...prev,
      hasPaidTrustDeposit: true,
      tier: tier,
      depositBalance: tierDeposit,
      isNewMember: false,
    }));
    showToast(`Welcome! ${formatNaira(tierDeposit)} deposited`, 'success');
    setBalanceAnimating(true);
    setTimeout(() => setBalanceAnimating(false), 500);
  };

  // Deduct from deposit balance for unlocks
  const deductFromBalance = (amount) => {
    setClientState(prev => ({
      ...prev,
      depositBalance: Math.max(0, prev.depositBalance - amount),
    }));
    showToast(`${formatNaira(amount)} deducted from balance`, 'success');
    setBalanceAnimating(true);
    setTimeout(() => setBalanceAnimating(false), 500);
  };

  // Open photo gallery
  const openPhotoGallery = (index) => {
    setPhotoGalleryIndex(index);
    setModal('photoGallery');
  };

  if (!ageVerified) return <AgeVerification onVerify={() => setAgeVerified(true)} />;

  const lockedPhotoCount = photos.total - photos.previewCount;
  const totalUnlockCost = pricing.unlockPhotos + pricing.unlockContact;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toast notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onHide={hideToast} />

      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-4" style={{ transform: `translateY(${Math.min(pullDistance / 2, 40)}px)` }}>
          <div className={`p-2 bg-white/10 rounded-full ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={20} className="text-white/60" />
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-8 pb-24">

        {/* 1. PROFILE + TRUST */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-1">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{profile.name.slice(0,2).toUpperCase()}</span>
              </div>
            </div>
            {profile.isOnline && <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse-green" />}
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
          <p className="text-pink-300 mb-3">{profile.tagline}</p>

          {/* PROMINENT TRUST INDICATOR */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40 mb-3 animate-scaleIn">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-green-300 font-bold text-lg">{stats.meetupSuccessRate}%</span>
            <span className="text-green-300/70 text-sm">Meetup Success</span>
            <span className="text-green-400/60 text-xs">({stats.verifiedMeetups} meetups)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Available
            </span>
            <Link
              to={`/explore/${profile.location.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-sm hover:bg-white/20 hover:border-white/20 hover:text-white transition-all cursor-pointer"
            >
              <MapPin size={12} /> {profile.location}
              <ChevronRight size={12} className="opacity-50" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <button onClick={() => setModal('videoVerify')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30">
              <Video size={12} className="text-blue-400" />
              <span className="text-blue-300 text-xs font-medium">Video Verified</span>
              <CheckCircle size={12} className="text-blue-400" />
            </button>
            <button onClick={() => setModal('photoVerify')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30">
              <Aperture size={12} className="text-cyan-400" />
              <span className="text-cyan-300 text-xs font-medium">Studio Photos</span>
              <CheckCircle size={12} className="text-cyan-400" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /><span className="text-white font-bold">{stats.rating}</span></div>
              <p className="text-white/40 text-xs">{stats.reviews} reviews</p>
            </div>
            <div className="text-center border-l border-white/10"><p className="text-white font-bold">{stats.verifiedMeetups}</p><p className="text-white/40 text-xs">Meetups</p></div>
            <div className="text-center border-l border-white/10">
              <div className="flex items-center justify-center gap-1"><Target size={12} className="text-green-400" /><span className="text-green-400 font-bold">{stats.meetupSuccessRate}%</span></div>
              <p className="text-white/40 text-xs">Success</p>
            </div>
            <div className="text-center border-l border-white/10"><p className="text-white font-bold">{stats.repeatClients}</p><p className="text-white/40 text-xs">Repeat</p></div>
            <div className="text-center border-l border-white/10"><p className="text-white font-bold">{stats.responseTime}</p><p className="text-white/40 text-xs">Reply</p></div>
          </div>
        </div>

        {/* 2. PHOTOS - Clickable gallery */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2">
              <Camera size={14} className="text-pink-400" />
              Photos
              <span className="text-white/40 text-xs">({photos.total})</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-xs flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                <EyeOff size={10} />No Screenshots
              </span>
              <button onClick={() => setModal('photoVerify')} className="text-cyan-400 text-xs flex items-center gap-1"><Aperture size={12} />Verified</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[...Array(photos.total)].map((_, i) => {
              const isVisible = i < photos.previewCount || photosUnlocked;
              return (
                <button
                  key={i}
                  onClick={() => isVisible ? openPhotoGallery(i) : setModal('unlockPhotos')}
                  className={`relative aspect-square rounded-xl overflow-hidden group transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                    isVisible
                      ? 'bg-gradient-to-br from-pink-500/40 to-purple-500/40'
                      : 'bg-gradient-to-br from-pink-500/30 to-purple-500/30'
                  }`}
                >
                  {isVisible ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white/40 text-xs mb-2">Photo {i + 1}</span>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-1">
                        <p className="text-white/50 text-[7px] text-center truncate">{CONFIG.platform.name} • @{profile.username}</p>
                      </div>
                      {i === 0 && <div className="absolute top-2 left-2 bg-cyan-500/80 rounded-full p-1"><Aperture size={10} className="text-white" /></div>}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    /* Locked photo - lighter blur so they can see what they're paying for */
                    <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px]">
                      <div className="text-white/60 text-xs mb-1">Photo {i + 1}</div>
                      <Lock size={18} className="text-white/50 group-hover:scale-110 transition-all" />
                      <span className="text-pink-300/60 text-[9px] mt-1">Tap to unlock</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!photosUnlocked && lockedPhotoCount > 0 && (
            <button onClick={() => setModal('unlockPhotos')} className="w-full mt-3 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-xl text-pink-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              <Unlock size={14} />Unlock {lockedPhotoCount} more — {formatNaira(pricing.unlockPhotos)}
            </button>
          )}
          <p className="text-white/30 text-[10px] text-center mt-2">Photos by {photos.studioName} • Tap any photo to view full-screen</p>
        </div>

        {/* 3. RATES */}
        <div className="mb-6">
          <h3 className="text-white/60 text-sm font-medium flex items-center gap-2 mb-3"><DollarSign size={14} className="text-green-400" />Rates</h3>
          
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3"><Home size={16} className="text-pink-400" /><span className="text-white font-medium">Incall</span><span className="text-white/40 text-xs">(you come to me)</span></div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-white/60">1 hour</span><span className="text-white">{formatNaira(pricing.meetupIncall[1])}</span></div>
                <div className="flex justify-between"><span className="text-white/60">2 hours</span><span className="text-white">{formatNaira(pricing.meetupIncall[2])}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Overnight</span><span className="text-white">{formatNaira(pricing.meetupIncall.overnight)}</span></div>
              </div>
            </div>

            {hasOutcall && (
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3"><Car size={16} className="text-blue-400" /><span className="text-white font-medium">Outcall</span><span className="text-white/40 text-xs">(I come to you)</span></div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-white/60">1 hour</span><span className="text-white">{formatNaira(pricing.meetupOutcall[1])}</span></div>
                  <div className="flex justify-between"><span className="text-white/60">2 hours</span><span className="text-white">{formatNaira(pricing.meetupOutcall[2])}</span></div>
                  <div className="flex justify-between"><span className="text-white/60">Overnight</span><span className="text-white">{formatNaira(pricing.meetupOutcall.overnight)}</span></div>
                </div>
              </div>
            )}

            {CONFIG.extras?.length > 0 && (
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3"><Star size={16} className="text-amber-400" /><span className="text-white font-medium">Extras</span></div>
                <div className="space-y-1 text-sm">
                  {CONFIG.extras.map((e, i) => <div key={i} className="flex justify-between"><span className="text-white/60">{e.name}</span><span className="text-white">+{formatNaira(e.price)}</span></div>)}
                </div>
              </div>
            )}

            {CONFIG.boundaries?.length > 0 && (
              <div className="p-4 border-b border-white/10 bg-red-500/5">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-red-400" /><span className="text-red-300 text-sm">Not offered</span></div>
                <p className="text-white/40 text-xs">{CONFIG.boundaries.join(' • ')}</p>
              </div>
            )}

            <div className="p-3 bg-green-500/5">
              <p className="text-green-300 text-xs flex items-center gap-2"><Shield size={12} />Pay {profile.name} directly via OPay/PalmPay • 50% deposit</p>
            </div>
          </div>
        </div>

        {/* 4. BOOK NOW */}
        <div className="mb-6 space-y-3">
          {/* Show client tier status and balance with animation */}
          {clientState.tier ? (
            <div className={`flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 transition-all ${balanceAnimating ? 'animate-scaleIn' : ''}`}>
              <div className="flex items-center gap-2">
                <TierBadge tier={clientState.tier} />
              </div>
              <div className="text-right flex items-center gap-2">
                <Wallet size={14} className="text-green-400/60" />
                <span className={`text-green-400 font-bold transition-all ${balanceAnimating ? 'animate-number-change' : ''}`}>
                  {formatNaira(clientState.depositBalance)}
                </span>
              </div>
            </div>
          ) : (
            /* Empty state for zero balance - better illustration */
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center animate-bounce-slow">
                <Sparkles size={28} className="text-blue-400" />
              </div>
              <p className="text-white font-medium mb-1">Get Verified to Unlock</p>
              <p className="text-white/50 text-sm mb-3">
                Photos + Phone = <span className="text-green-400 font-medium">{formatNaira(totalUnlockCost)}</span> from your deposit
              </p>
              <button onClick={() => setModal('trustDeposit')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white font-medium text-sm transition-colors">
                Start with {formatNaira(CONFIG.platform.verificationTiers.verified.deposit)}
              </button>
            </div>
          )}

          {/* Price comparison - show what deposit unlocks */}
          {clientState.tier && !photosUnlocked && !contactUnlocked && (
            <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between">
                <span className="text-green-300/80 text-sm">Unlock everything:</span>
                <div className="text-right">
                  <span className="text-green-400 font-bold">{formatNaira(totalUnlockCost)}</span>
                  <span className="text-green-300/50 text-xs ml-1">from balance</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-green-300/60">
                <span>Photos ({formatNaira(pricing.unlockPhotos)})</span>
                <span>+</span>
                <span>Phone ({formatNaira(pricing.unlockContact)})</span>
              </div>
            </div>
          )}

          {/* Two buttons in a row */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => protectedAction('meetup')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Heart size={24} className="text-pink-400" />
              <span className="text-white font-medium text-xs text-center">Book Meetup</span>
            </button>
            {contactUnlocked ? (
              <button onClick={() => setModal('contactRevealed')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500/20 border border-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Phone size={24} className="text-green-400" />
                <span className="text-green-300 font-medium text-xs text-center">Unlocked</span>
              </button>
            ) : (
              <button onClick={() => setModal('unlockContact')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:border-green-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Phone size={24} className="text-green-400" />
                <span className="text-green-300 font-medium text-xs text-center">{formatNaira(pricing.unlockContact)}</span>
              </button>
            )}
          </div>

          {/* Get Verified CTA if not verified - shown only if they skipped the empty state above */}
          {!clientState.tier && (
            <button onClick={() => setModal('trustDeposit')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-colors">
              <ShieldCheck size={18} className="text-blue-400" />
              <span className="flex-1 text-left">
                <span className="text-blue-300 font-medium text-sm">Get Verified</span>
                <span className="text-blue-300/60 text-xs ml-2">Unlock all features</span>
              </span>
              <ChevronRight size={16} className="text-blue-400" />
            </button>
          )}
        </div>

        {/* 5. REVIEWS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2"><ThumbsUp size={14} className="text-green-400" />Reviews</h3>
            <button onClick={() => setModal('allReviews')} className="text-pink-400 text-xs">View all</button>
          </div>
          <div className="space-y-2">
            {CONFIG.reviews.slice(0, 2).map((r, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={12} className={j < r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />)}</div>
                  {r.verified && <span className="text-xs text-green-400"><CheckCircle size={10} className="inline" /> Verified</span>}
                </div>
                <p className="text-white/70 text-sm">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>


        {/* Footer */}
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-white/30 text-xs mb-3">
            <span className="flex items-center gap-1"><Video size={12} />Video Verified</span>
            <span className="flex items-center gap-1"><Aperture size={12} />Studio Photos</span>
            <span className="flex items-center gap-1"><EyeOff size={12} />No Screenshots</span>
            <span className="flex items-center gap-1"><Smartphone size={12} />Phone Identity</span>
            <span className="flex items-center gap-1"><Key size={12} />Meetup Codes</span>
          </div>
          <p className="text-white/20 text-xs mb-3">{CONFIG.platform.name} • 18+ Only • Anti-Catfish Platform</p>
          <button onClick={() => setModal('report')} className="text-white/30 text-xs hover:text-red-400 flex items-center gap-1 mx-auto"><AlertTriangle size={12} />Report</button>
        </div>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => protectedAction('meetup')}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Heart size={22} className="fill-white" />
            Book Meetup with {profile.name}
          </button>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/40">
            <span className="flex items-center gap-1"><Shield size={10} />Protected</span>
            <span className="flex items-center gap-1"><Target size={10} />{stats.meetupSuccessRate}% success</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} />Verified</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientVerificationModal isOpen={modal === 'verify'} onClose={() => { setModal(null); setPendingAction(null); }} onVerified={onVerified} nextAction={pendingAction} />
      <TrustDepositModal isOpen={modal === 'trustDeposit'} onClose={() => setModal(null)} onDepositPaid={handleTrustDepositPaid} />
      <InAppChatModal isOpen={modal === 'chat'} onClose={() => setModal(null)} onUpgrade={chatUpgrade} />
      <UnlockContactModal isOpen={modal === 'unlockContact'} onClose={() => setModal(null)} onUnlock={() => { setContactUnlocked(true); setModal('contactRevealed'); }} clientState={clientState} onNeedsTrustDeposit={() => setModal('trustDeposit')} onDeductBalance={deductFromBalance} />
      <ContactRevealedModal isOpen={modal === 'contactRevealed'} onClose={() => setModal(null)} />
      <MeetupModal isOpen={modal === 'meetup'} onClose={() => setModal(null)} clientState={clientState} onNeedsTrustDeposit={() => setModal('trustDeposit')} />
      <UnlockPhotosModal isOpen={modal === 'unlockPhotos'} onClose={() => setModal(null)} onUnlock={() => setPhotosUnlocked(true)} clientState={clientState} onDeductBalance={deductFromBalance} onNeedsTrustDeposit={() => setModal('trustDeposit')} />
      <AllReviewsModal isOpen={modal === 'allReviews'} onClose={() => setModal(null)} />
      <VideoVerificationModal isOpen={modal === 'videoVerify'} onClose={() => setModal(null)} />
      <PhotoVerificationModal isOpen={modal === 'photoVerify'} onClose={() => setModal(null)} />
      <PhotoGalleryModal
        isOpen={modal === 'photoGallery'}
        onClose={() => setModal(null)}
        photos={photos}
        initialIndex={photoGalleryIndex}
        photosUnlocked={photosUnlocked}
        onUnlockPhotos={() => { setModal(null); setTimeout(() => setModal('unlockPhotos'), 100); }}
      />
      <ReportModal isOpen={modal === 'report'} onClose={() => setModal(null)} />
    </div>
  );
}
