import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Heart, Star, MapPin, Camera,
  Video, MessageCircle, Shield, CheckCircle, Lock,
  Copy, Phone, CreditCard, Send,
  Zap, ChevronRight, X, ChevronLeft,
  MessageSquare, ArrowRight, ArrowLeft, Unlock, ThumbsUp,
  Ban, AlertTriangle, Key, Home, Car, DollarSign, Aperture,
  Award, Info, ShieldCheck, EyeOff, Crown, BadgeCheck,
  Smartphone, Target, RefreshCw, Wallet, Sparkles, TrendingUp, Users, Clock, Calendar
} from 'lucide-react';
import { PLATFORM_CONFIG, getModelByUsername, MODELS } from './data/models';
import useFavorites, { useFavoriteCount } from './hooks/useFavorites';
import { useAuth } from './context/AuthContext';
import { creatorService } from './services/creatorService';
import { userService } from './services/userService';
import { storageService } from './services/storageService';
import { transformDbCreatorToConfig } from './utils/transformDbCreator';

// ═══════════════════════════════════════════════════════════
// DEFAULT MODEL (fallback)
// ═══════════════════════════════════════════════════════════
const DEFAULT_USERNAME = 'destiny_x';

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

const PhotoGalleryModal = ({ isOpen, onClose, photos, initialIndex = 0, photosUnlocked, onUnlockPhotos, modelConfig }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);

  const totalPhotos = photos?.total || 0;
  const previewCount = photos?.previewCount || 0;

  const goNext = useCallback(() => setCurrentIndex(prev => Math.min(prev + 1, totalPhotos - 1)), [totalPhotos]);
  const goPrev = useCallback(() => setCurrentIndex(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onClose();
  }, [isOpen, goNext, goPrev, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isLocked = !photosUnlocked && currentIndex >= previewCount;

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
                Unlock All Photos — {formatNaira(modelConfig?.pricing?.unlockPhotos || 0)}
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
// TRUST DEPOSIT MODAL (Platform holds store-credit deposit with Tiers)
// ═══════════════════════════════════════════════════════════

const TierBadge = ({ tier, size = "md" }) => {
  const tiers = PLATFORM_CONFIG.verificationTiers;
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

  const { verificationTiers, trustDepositAccount } = PLATFORM_CONFIG;
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
              Lifetime Verification
            </h4>
            <p className="text-blue-200/80 text-sm leading-relaxed mb-2">
              Your deposit is a <strong>one-time</strong> verification that lasts forever. The full amount becomes your <strong>store credit</strong> for unlocking photos, contacts, and other premium features.
            </p>
            <p className="text-blue-200/60 text-xs">
              Higher tiers show models you're serious and give you priority access.
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
                      <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Deposit becomes store credit for unlocks &amp; bookings
                      </p>
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

          <p className="text-white/60 text-sm">Pay to {PLATFORM_CONFIG.name}'s account:</p>

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
              Use your registered phone number ({clientState.phone || 'your number'}) as payment reference
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

          {/* Store credit info */}
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-green-400" />
              <p className="text-green-300 font-medium">Store Credit: {formatNaira(currentTier.deposit)}</p>
            </div>
            <p className="text-green-200/70 text-sm">
              Your deposit is now store credit. Use it to unlock photos, contacts, and premium features.
            </p>
          </div>

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

const P2PPaymentStep = ({ amount, serviceName, onBack, onConfirm, creatorPayments, creatorName }) => {
  const [copied, setCopied] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

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

      <p className="text-white/60 text-sm">Pay {creatorName} directly:</p>

      <div className="space-y-2">
        {creatorPayments.map((account, i) => (
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
          Payment goes directly to {creatorName}. {PLATFORM_CONFIG.name} does not process this payment.
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
// MEETUP MODAL (with Trust Deposit check + P2P payment)
// ═══════════════════════════════════════════════════════════

const MeetupModal = ({ isOpen, onClose, clientState, onNeedsTrustDeposit, modelConfig, onMeetupBooked, onDeductBalance }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const todayDate = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ date: todayDate, time: '', locationType: 'incall', location: '', duration: '1', specialRequests: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [codes, setCodes] = useState({ client: '', creator: '' });

  if (!modelConfig) return null;

  const hasOutcall = modelConfig.pricing.meetupOutcall !== null;
  const getMeetupPrice = () => {
    const rates = formData.locationType === 'outcall' && hasOutcall ? modelConfig.pricing.meetupOutcall : modelConfig.pricing.meetupIncall;
    return formData.duration === 'overnight' ? rates.overnight : rates[formData.duration] || rates[1];
  };
  const isFormValid = formData.date && formData.time && formData.location && agreedToTerms;

  // Get available time slots based on model's schedule and selected date
  const getAvailableTimeSlots = () => {
    if (!formData.date) return [];

    const schedule = modelConfig.schedule;
    if (!schedule) {
      // Default time slots if no schedule set - include all 24 hours
      return [
        '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
        '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
        '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
      ];
    }

    const selectedDate = new Date(formData.date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const daySchedule = schedule[dayName];

    if (!daySchedule?.active) return [];

    // Parse start and end times
    const [startHour] = daySchedule.start.split(':').map(Number);
    let [endHour] = daySchedule.end.split(':').map(Number);

    // Handle overnight (e.g., end at 02:00 means 2 AM next day)
    if (endHour < startHour) endHour += 24;

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const displayHour = hour % 24;
      const period = displayHour >= 12 ? 'PM' : 'AM';
      const hour12 = displayHour === 0 ? 12 : displayHour > 12 ? displayHour - 12 : displayHour;
      slots.push(`${hour12}:00 ${period}`);
    }
    return slots;
  };

  const availableTimeSlots = getAvailableTimeSlots();
  const isDateUnavailable = formData.date && availableTimeSlots.length === 0;

  const depositAmount = Math.round(getMeetupPrice() * 0.5);
  const hasEnoughBalance = (clientState?.depositBalance || 0) >= depositAmount;

  const handleStartBooking = () => {
    // Check if client has any verification tier (required to initiate meetups)
    if (!clientState.tier) {
      onNeedsTrustDeposit();
      onClose();
      return;
    }
    // Skip payment step, go directly to confirmation
    handleConfirmBooking();
  };

  const handleConfirmBooking = () => {
    const clientCode = generateCode('C');
    const creatorCode = generateCode('X');
    setCodes({ client: clientCode, creator: creatorCode });

    // Deduct 50% deposit from client balance
    if (onDeductBalance) {
      onDeductBalance(depositAmount);
    }

    // Save the meetup booking immediately when confirmed
    if (onMeetupBooked) {
      onMeetupBooked({
        creatorId: modelConfig.creatorId, // Important for database creators
        creatorUsername: modelConfig.profile.username,
        creatorName: modelConfig.profile.name,
        date: formData.date,
        time: formData.time,
        locationType: formData.locationType,
        location: formData.location,
        duration: formData.duration,
        specialRequests: formData.specialRequests,
        totalPrice: getMeetupPrice(),
        depositAmount: depositAmount,
        clientCode: clientCode,
      });
    }

    setStep(4);
  };

  const handleSendWhatsApp = () => {
    // Build WhatsApp message with special requests if provided
    let message = `🌹 MEETUP BOOKING\n\nName: ${clientState.name || 'Client'}\nDate: ${formData.date}\nTime: ${formData.time}\nType: ${formData.locationType === 'incall' ? 'Incall' : 'Outcall'}\nArea: ${formData.location}\nDuration: ${formData.duration === 'overnight' ? 'Overnight' : formData.duration + 'hr'}\nRate: ${formatNaira(getMeetupPrice())}`;

    if (formData.specialRequests.trim()) {
      message += `\n\n📝 SPECIAL REQUESTS:\n${formData.specialRequests.trim()}`;
    }

    window.open(`https://wa.me/${modelConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    resetAndClose();
  };

  const resetAndClose = () => {
    onClose();
    setStep(1);
    setFormData({ date: todayDate, time: '', locationType: 'incall', location: '', duration: '1', specialRequests: '' });
    setAgreedToTerms(false);
    setCodes({ client: '', creator: '' });
  };

  const incallRates = modelConfig.pricing.meetupIncall;
  const outcallRates = modelConfig.pricing.meetupOutcall;

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
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-500/20">
                  <Shield size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">You're so close to booking!</p>
                  <p className="text-white/60 text-sm mb-3">Just one quick step - verify your account to unlock meetup bookings and build trust with models.</p>
                  <button
                    onClick={() => { onNeedsTrustDeposit(); onClose(); }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    Choose Verification Tier →
                  </button>
                </div>
              </div>
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

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <select
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                disabled={!formData.date || isDateUnavailable}
                className={`w-full bg-white/5 border rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none ${
                  !formData.date || isDateUnavailable ? 'border-white/5 opacity-50' : 'border-white/10'
                }`}
              >
                <option value="">{isDateUnavailable ? 'Unavailable' : 'Time *'}</option>
                {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Unavailable date warning */}
          {isDateUnavailable && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-200 text-sm flex items-center gap-2">
                <Clock size={14} />
                {modelConfig.profile.name} is not available on this day. Please select another date.
              </p>
            </div>
          )}

          <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 focus:outline-none">
            <option value="">Area *</option>
            {(formData.locationType === 'incall' ? modelConfig.profile.areas : ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Mainland']).map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Special Requests */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white/70 text-sm flex items-center gap-1">
                <MessageCircle size={14} />
                Special Requests
                <span className="text-white/40 text-xs">(optional but recommended)</span>
              </label>
              <span className="text-white/40 text-xs">{formData.specialRequests.length}/300</span>
            </div>

            {/* Quick suggestion chips */}
            <div className="flex flex-wrap gap-1.5">
              {['Dinner first', 'Movie/Netflix', 'GFE experience', 'Roleplay', 'Massage', 'Drinks/Party', 'Overnight cuddles', 'Specific outfit'].map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    const current = formData.specialRequests;
                    const newText = current ? `${current}, ${suggestion.toLowerCase()}` : suggestion;
                    if (newText.length <= 300) {
                      setFormData({...formData, specialRequests: newText});
                    }
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 text-xs transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>

            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value.slice(0, 300)})}
              placeholder="Be explicit about what you want so there are no surprises. E.g.: I'd like us to watch a movie first, then dinner... or I'm interested in roleplay... or I have specific preferences for..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-pink-500 focus:outline-none resize-none h-20 text-sm"
            />
            <p className="text-white/40 text-xs">
              Being clear helps {modelConfig.profile.name} prepare and ensures a better experience for both of you.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/10">
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-white/30 bg-white/10 text-pink-500" />
            <span className="text-white/70 text-xs">I agree to exchange codes with {modelConfig.profile.name} at the meetup for verification</span>
          </label>

          {/* Price summary */}
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">{formData.locationType === 'incall' ? '🏠 Incall' : '🚗 Outcall'} • {formData.duration === 'overnight' ? 'Overnight' : formData.duration + 'hr'}</span>
              <span className="text-white font-bold text-lg">{formatNaira(getMeetupPrice())}</span>
            </div>
            <p className="text-white/40 text-xs mt-2">50% deposit ({formatNaira(depositAmount)}) deducted from your balance</p>
          </div>

          {clientState.tier && !hasEnoughBalance && (
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/30">
              <p className="text-red-300 text-sm">
                Insufficient balance. You need {formatNaira(depositAmount)} but have {formatNaira(clientState?.depositBalance || 0)}.
              </p>
            </div>
          )}

          <button
            onClick={handleStartBooking}
            disabled={!isFormValid || (clientState.tier && !hasEnoughBalance)}
            className={`w-full py-4 rounded-xl font-semibold ${isFormValid && (!clientState.tier || hasEnoughBalance) ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {!clientState.tier ? 'Get Verified to Book' : 'Confirm Booking'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 py-2">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={40} className="text-amber-400" /></div>
            <h4 className="text-xl font-bold text-white mb-2">Booking Request Sent! 🌹</h4>
            <p className="text-white/60 text-sm">Notify {modelConfig.profile.name} on WhatsApp and wait for confirmation</p>
          </div>

          {/* Pending confirmation notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-amber-200 text-sm text-center">
              <strong>Note:</strong> {modelConfig.profile.name} still needs to confirm this booking. You'll see the status update in your dashboard.
            </p>
          </div>

          {/* Verification Code Section - shows countdown until meetup time */}
          {(() => {
            const codeInfo = getCodeUnlockInfo(formData.date, formData.time);
            return (
              <div className={`border-2 rounded-xl p-5 text-center ${codeInfo.isUnlocked ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50' : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30'}`}>
                <p className="text-blue-300 font-medium mb-2"><Key size={16} className="inline mr-1" />YOUR VERIFICATION CODE</p>
                {codeInfo.isUnlocked ? (
                  <>
                    <div className="bg-black/40 rounded-xl p-4 mb-2">
                      <p className="text-4xl font-mono font-bold text-white tracking-widest">{codes.client}</p>
                    </div>
                    <p className="text-white/60 text-sm">Share this with {modelConfig.profile.name} when you meet</p>
                  </>
                ) : (
                  <>
                    <div className="bg-black/40 rounded-xl p-4 mb-2">
                      <div className="flex items-center justify-center gap-2 text-purple-300">
                        <Lock size={20} />
                        <p className="text-lg font-medium">Code unlocks in {codeInfo.timeRemaining}</p>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm">Your code will be available at your scheduled meetup time</p>
                  </>
                )}
              </div>
            );
          })()}

          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-white/60">Type:</div><div className="text-white">{formData.locationType === 'incall' ? '🏠 Incall' : '🚗 Outcall'}</div>
              <div className="text-white/60">Date:</div><div className="text-white">{formData.date}</div>
              <div className="text-white/60">Time:</div><div className="text-white">{formData.time}</div>
              <div className="text-white/60">Area:</div><div className="text-white">{formData.location}</div>
              <div className="text-white/60">Rate:</div><div className="text-white">{formatNaira(getMeetupPrice())}</div>
            </div>
            {formData.specialRequests.trim() && (
              <div className="border-t border-white/10 mt-3 pt-3">
                <div className="text-white/60 mb-1 flex items-center gap-1"><MessageCircle size={12} />Special Requests:</div>
                <p className="text-white text-xs">{formData.specialRequests.trim()}</p>
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-amber-200 text-sm"><strong>⚠️</strong> Exchange verification codes when you meet. Handle payment directly with {modelConfig.profile.name}.</p>
          </div>

          <button onClick={handleSendWhatsApp} className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"><Send size={18} />Notify on WhatsApp</button>

          <div className="flex gap-3">
            <button onClick={() => { resetAndClose(); navigate('/dashboard?tab=meetups'); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2 border border-white/20"><Calendar size={16} />View My Bookings</button>
            <button onClick={resetAndClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium border border-white/10">Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// SIMPLIFIED MODALS
// ═══════════════════════════════════════════════════════════

const UnlockPhotosModal = ({ isOpen, onClose, onUnlock, clientState, onDeductBalance, onNeedsTrustDeposit, modelConfig, onSwitchToBundle, contactAlreadyUnlocked }) => {
  const resetAndClose = () => { onClose(); };
  if (!modelConfig) return null;
  const lockedCount = modelConfig.photos.total - modelConfig.photos.previewCount;
  const price = modelConfig.pricing.unlockPhotos;
  const contactPrice = modelConfig.pricing.unlockContact;
  const totalSeparate = price + contactPrice;
  const bundleDiscount = Math.round(totalSeparate * 0.1);
  const bundlePrice = totalSeparate - bundleDiscount;
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

        {/* Bundle upsell - only show if contact not already unlocked */}
        {!contactAlreadyUnlocked && (
          <button
            onClick={() => { resetAndClose(); onSwitchToBundle(); }}
            className="w-full p-3 bg-gradient-to-r from-pink-500/10 to-green-500/10 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <div className="text-left">
                  <span className="text-white font-medium text-sm">Want phone number too?</span>
                  <p className="text-amber-300/80 text-xs">Get both for {formatNaira(bundlePrice)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  Save {formatNaira(bundleDiscount)}
                </span>
              </div>
            </div>
          </button>
        )}

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
          <button onClick={handlePayFromBalance} className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            <Zap size={18} />
            Unlock Photos Only
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

const UnlockContactModal = ({ isOpen, onClose, onUnlock, clientState, onNeedsTrustDeposit, onDeductBalance, modelConfig, onSwitchToBundle, photosAlreadyUnlocked }) => {
  const resetAndClose = () => { onClose(); };
  if (!modelConfig) return null;
  const price = modelConfig.pricing.unlockContact;
  const photosPrice = modelConfig.pricing.unlockPhotos;
  const lockedCount = modelConfig.photos.total - modelConfig.photos.previewCount;
  const totalSeparate = price + photosPrice;
  const bundleDiscount = Math.round(totalSeparate * 0.1);
  const bundlePrice = totalSeparate - bundleDiscount;
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

        {/* Bundle upsell - only show if photos not already unlocked */}
        {!photosAlreadyUnlocked && (
          <button
            onClick={() => { resetAndClose(); onSwitchToBundle(); }}
            className="w-full p-3 bg-gradient-to-r from-pink-500/10 to-green-500/10 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <div className="text-left">
                  <span className="text-white font-medium text-sm">Want {lockedCount} photos too?</span>
                  <p className="text-amber-300/80 text-xs">Get both for {formatNaira(bundlePrice)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  Save {formatNaira(bundleDiscount)}
                </span>
              </div>
            </div>
          </button>
        )}

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
            Unlock Phone Only
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

// Bundle Unlock Modal - Unlock both photos and contact with discount
const UnlockBundleModal = ({ isOpen, onClose, onUnlock, clientState, onNeedsTrustDeposit, onDeductBalance, modelConfig }) => {
  const resetAndClose = () => { onClose(); };
  if (!modelConfig) return null;

  const photosPrice = modelConfig.pricing.unlockPhotos;
  const contactPrice = modelConfig.pricing.unlockContact;
  const totalPrice = photosPrice + contactPrice;
  const discount = Math.round(totalPrice * 0.1); // 10% discount
  const bundlePrice = totalPrice - discount;
  const lockedCount = modelConfig.photos.total - modelConfig.photos.previewCount;

  const hasEnoughBalance = clientState?.depositBalance >= bundlePrice;
  const shortfall = bundlePrice - (clientState?.depositBalance || 0);

  const handlePayFromBalance = () => {
    onDeductBalance(bundlePrice);
    onUnlock();
    resetAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="✨ Unlock Everything">
      <div className="space-y-4">
        {/* Bundle contents */}
        <div className="bg-gradient-to-br from-pink-500/10 to-green-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-amber-400" />
            <span className="text-white font-medium">Bundle Includes:</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70 flex items-center gap-2">
                <Camera size={16} className="text-pink-400" />
                {lockedCount} Premium Photos
              </span>
              <span className="text-white/50 line-through">{formatNaira(photosPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70 flex items-center gap-2">
                <Phone size={16} className="text-green-400" />
                Direct WhatsApp Number
              </span>
              <span className="text-white/50 line-through">{formatNaira(contactPrice)}</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-white/50 line-through text-lg">{formatNaira(totalPrice)}</span>
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">
              Save {formatNaira(discount)}
            </span>
          </div>
          <p className="text-4xl font-bold text-white">{formatNaira(bundlePrice)}</p>
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
          <button onClick={handlePayFromBalance} className="w-full py-4 bg-gradient-to-r from-pink-500 to-green-500 hover:from-pink-600 hover:to-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            <Zap size={18} />
            Unlock Everything
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

const ContactRevealedModal = ({ isOpen, onClose, modelConfig }) => {
  const [copied, setCopied] = useState(false);
  if (!modelConfig) return null;
  const copy = () => { navigator.clipboard.writeText(modelConfig.contact.whatsapp); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📱 Phone Number">
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
          <Phone size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">{modelConfig.profile.name}'s WhatsApp</p>
          <p className="text-green-300 font-mono text-2xl">+{modelConfig.contact.whatsapp}</p>
        </div>
        <button onClick={copy} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          {copied ? <><CheckCircle size={18} />Copied!</> : <><Copy size={18} />Copy Number</>}
        </button>
        <a href={`https://wa.me/${modelConfig.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold text-center">
          Open WhatsApp
        </a>
      </div>
    </Modal>
  );
};

const InAppChatModal = ({ isOpen, onClose, onUpgrade, modelConfig }) => {
  const [messages, setMessages] = useState([{ from: 'creator', text: "Hey! 💕 Check my rates above. What interests you?" }]);
  const [input, setInput] = useState('');
  const [msgCount, setMsgCount] = useState(0);
  const [locked, setLocked] = useState(false);
  if (!modelConfig) return null;
  const freeMessages = modelConfig.freeMessages || 3;
  const replies = ["Nice! Ready to book? 😊", "I'm available. Let's set it up!", "Sure! 💕"];
  const send = () => {
    if (!input.trim() || locked) return;
    const count = msgCount + 1;
    setMessages(m => [...m, { from: 'user', text: input }]);
    setInput('');
    setMsgCount(count);
    setTimeout(() => {
      if (count >= freeMessages) { setLocked(true); setMessages(m => [...m, { from: 'system', text: 'Free messages used. Upgrade!' }]); }
      else { setMessages(m => [...m, { from: 'creator', text: replies[count - 1] || replies[0] }]); }
    }, 800);
  };
  const reset = () => { setMessages([{ from: 'creator', text: "Hey! 💕 Check my rates above. What interests you?" }]); setMsgCount(0); setLocked(false); onClose(); };
  return (
    <Modal isOpen={isOpen} onClose={reset} title="💬 Chat" size="lg">
      <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{modelConfig.profile.name.slice(0,2).toUpperCase()}</div>
        <div className="flex-1"><p className="text-white font-medium">{modelConfig.profile.name}</p><p className="text-green-400 text-xs">● Online</p></div>
        <div className="bg-white/5 px-3 py-1 rounded-lg"><p className={`font-bold ${msgCount >= freeMessages ? 'text-red-400' : 'text-green-400'}`}>{Math.max(0, freeMessages - msgCount)}</p></div>
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
          <button onClick={() => onUpgrade('contact')} className="w-full py-3 bg-pink-500 rounded-xl text-white font-semibold">Unlock WhatsApp — {formatNaira(modelConfig.pricing.unlockContact)}</button>
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

const AllReviewsModal = ({ isOpen, onClose, modelConfig }) => {
  if (!modelConfig) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⭐ Reviews" size="lg">
      <div className="space-y-3">
        {modelConfig.reviews.map((r, i) => (
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
};

const VideoVerificationModal = ({ isOpen, onClose, modelConfig }) => {
  if (!modelConfig) return null;
  return (
  <Modal isOpen={isOpen} onClose={onClose} title="📹 Video Verified">
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
        <Video size={32} className="text-blue-400 mx-auto mb-2" />
        <p className="text-white font-medium">Live Video Call Verification</p>
        <p className="text-blue-300/70 text-sm mt-1">Verified by {PLATFORM_CONFIG.name} Admins</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Live video call with our verification team</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Face matches profile photos exactly</div>
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />100% anti-catfish guarantee</div>
        {modelConfig.profile.verifiedDate && <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Last verified: {modelConfig.profile.verifiedDate}</div>}
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
};

const PhotoVerificationModal = ({ isOpen, onClose, modelConfig }) => {
  if (!modelConfig) return null;
  return (
  <Modal isOpen={isOpen} onClose={onClose} title="📷 Verified Photos">
    <div className="space-y-4">
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
        <Aperture size={32} className="text-cyan-400 mx-auto mb-2" />
        <p className="text-white font-medium">Anti-Catfish Photo System</p>
        {modelConfig.photos.studioName && <p className="text-cyan-300/70 text-sm mt-1">Photos by {modelConfig.photos.studioName}</p>}
      </div>

      {/* How it works */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Camera size={16} className="text-cyan-400" />
          How Photos Work on {PLATFORM_CONFIG.name}
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
        <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Watermarked with {PLATFORM_CONFIG.name}</div>
        {modelConfig.photos.captureDate && <div className="flex items-center gap-2 text-white/70"><CheckCircle size={14} className="text-green-400" />Taken: {modelConfig.photos.captureDate}</div>}
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
};

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
  const { username } = useParams();
  const navigate = useNavigate();

  // Auth context — must be near top so other hooks can reference user/isAuthenticated
  const { user, isAuthenticated, isCreator, isClient, updateUser, updateTier, deductBalance, addMeetupBooking } = useAuth();

  // Age verification - skip if authenticated OR if already verified this session
  const [ageVerified, setAgeVerified] = useState(() => {
    // If authenticated, they've already verified during registration
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hush_age_verified') === 'true';
    }
    return false;
  });

  // Handle age verification
  const handleAgeVerification = () => {
    setAgeVerified(true);
    sessionStorage.setItem('hush_age_verified', 'true');
  };
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [photosUnlocked, setPhotosUnlocked] = useState(false);

  // State for database creator data
  const [dbCreator, setDbCreator] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorNotFound, setCreatorNotFound] = useState(false);

  const [modal, setModal] = useState(null);
  const [photoGalleryIndex, setPhotoGalleryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  // Determine the correct dashboard link based on user type
  const dashboardLink = isCreator ? '/creator-dashboard' : '/dashboard';

  // Client state - use auth context if available, otherwise use mock for unauthenticated browsing
  const [localClientState, setLocalClientState] = useState(MOCK_CLIENT);
  const clientState = isAuthenticated && user?.userType === 'client' ? user : localClientState;
  const setClientState = isAuthenticated ? updateUser : setLocalClientState;

  // Favorites
  const { isFavorite, toggleFavorite } = useFavorites();

  // Pull to refresh - must be called before any early returns
  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('Profile refreshed', 'info');
  }, []);
  const { isRefreshing, pullDistance, handleTouchStart: pullTouchStart, handleTouchMove: pullTouchMove, handleTouchEnd: pullTouchEnd } = usePullToRefresh(handleRefresh);

  // Load model data based on URL param or default
  const currentUsername = username || DEFAULT_USERNAME;
  const mockModelData = getModelByUsername(currentUsername);

  // Fetch creator from database if not in mock data
  useEffect(() => {
    const fetchCreator = async () => {
      if (mockModelData || !currentUsername || currentUsername === DEFAULT_USERNAME) {
        return; // Use mock data
      }

      setCreatorLoading(true);
      setCreatorNotFound(false);

      const result = await creatorService.getCreatorByUsername(currentUsername);

      if (result.success && result.creator?.creators) {
        setDbCreator(result.creator);
      } else {
        setCreatorNotFound(true);
      }

      setCreatorLoading(false);
    };

    fetchCreator();
  }, [currentUsername, mockModelData]);

  // Restore unlock state from database when viewing a real creator
  const creatorId = dbCreator?.creators?.id || null;
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !creatorId) return;
    let cancelled = false;
    (async () => {
      const [photos, contact] = await Promise.all([
        userService.checkUnlock(user.id, creatorId, 'photos'),
        userService.checkUnlock(user.id, creatorId, 'contact'),
      ]);
      if (cancelled) return;
      if (photos.unlocked) setPhotosUnlocked(true);
      if (contact.unlocked) setContactUnlocked(true);
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, creatorId]);

  // Persist unlocks to database and update local state
  const handleUnlockPhotos = async () => {
    setPhotosUnlocked(true);
    if (isAuthenticated && user?.id && creatorId) {
      await userService.createUnlock(user.id, creatorId, 'photos', CONFIG.pricing.unlockPhotos);
    }
  };
  const handleUnlockContact = async () => {
    setContactUnlocked(true);
    if (isAuthenticated && user?.id && creatorId) {
      await userService.createUnlock(user.id, creatorId, 'contact', CONFIG.pricing.unlockContact);
    }
  };
  const handleUnlockBundle = async () => {
    setPhotosUnlocked(true);
    setContactUnlocked(true);
    if (isAuthenticated && user?.id && creatorId) {
      await Promise.all([
        userService.createUnlock(user.id, creatorId, 'photos', CONFIG.pricing.unlockPhotos),
        userService.createUnlock(user.id, creatorId, 'contact', CONFIG.pricing.unlockContact),
      ]);
    }
  };

  // Use mock data OR database data
  const modelData = mockModelData || (dbCreator ? transformDbCreatorToConfig(dbCreator) : null);

  // Reactive favorite count - must be called before early returns
  const favoriteCount = useFavoriteCount(currentUsername, modelData?.stats?.favoriteCount || 0);

  // Show loading state while fetching from database
  if (creatorLoading && (ageVerified || isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If model not found, show 404 or redirect
  if ((creatorNotFound || (!modelData && !creatorLoading)) && (ageVerified || isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <AlertTriangle size={40} className="text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Model Not Found</h1>
          <p className="text-white/60 mb-6">The profile you're looking for doesn't exist.</p>
          <Link to="/explore/all" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl text-white font-medium transition-colors">
            Browse All Models
          </Link>
        </div>
      </div>
    );
  }

  // Build CONFIG from model data (for backwards compatibility with existing components)
  const CONFIG = modelData ? {
    platform: PLATFORM_CONFIG,
    creatorId: modelData.creatorId || null, // Include creatorId for bookings
    profile: modelData.profile,
    stats: modelData.stats,
    creatorPayments: modelData.creatorPayments,
    contact: modelData.contact,
    pricing: modelData.pricing,
    extras: modelData.extras,
    boundaries: modelData.boundaries,
    photos: modelData.photos,
    reviews: modelData.reviews,
    blacklistedClients: modelData.blacklistedClients,
    freeMessages: modelData.freeMessages,
    schedule: modelData.schedule,
  } : null;

  const profile = CONFIG?.profile;
  const stats = CONFIG?.stats;
  const pricing = CONFIG?.pricing;
  const photos = CONFIG?.photos;
  const contact = CONFIG?.contact;
  const hasOutcall = pricing?.meetupOutcall !== null;

  const protectedAction = (action) => {
    // Not authenticated (visitor) → redirect to signup
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    // Authenticated but no tier → show tier verification modal
    if (!clientState.tier) {
      setModal('trustDeposit');
      return;
    }
    // Authenticated with tier → proceed to action
    setModal(action);
  };

  const chatUpgrade = (type) => {
    setModal(null);
    setTimeout(() => setModal(type === 'contact' ? 'unlockContact' : null), 100);
  };

  const handleTrustDepositPaid = (tier = 'verified') => {
    const tierDeposit = PLATFORM_CONFIG.verificationTiers[tier]?.deposit || 0;
    if (isAuthenticated) {
      updateTier(tier, tierDeposit);
    } else {
      setLocalClientState(prev => ({
        ...prev,
        hasPaidTrustDeposit: true,
        tier: tier,
        depositBalance: tierDeposit,
        isNewMember: false,
      }));
    }
    showToast(`Welcome! ${formatNaira(tierDeposit)} deposited`, 'success');
    setBalanceAnimating(true);
    setTimeout(() => setBalanceAnimating(false), 500);
  };

  // Deduct from deposit balance for unlocks
  const deductFromBalance = (amount) => {
    if (isAuthenticated) {
      deductBalance(amount);
    } else {
      setLocalClientState(prev => ({
        ...prev,
        depositBalance: Math.max(0, prev.depositBalance - amount),
      }));
    }
    showToast(`${formatNaira(amount)} deducted from balance`, 'success');
    setBalanceAnimating(true);
    setTimeout(() => setBalanceAnimating(false), 500);
  };

  // Open photo gallery
  const openPhotoGallery = (index) => {
    setPhotoGalleryIndex(index);
    setModal('photoGallery');
  };

  // Unlock both photos and contact with bundle discount - opens modal
  const openUnlockBundleModal = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!clientState.tier) {
      setModal('trustDeposit');
      return;
    }
    setModal('unlockBundle');
  };

  // Skip age verification if authenticated (they verified during registration)
  if (!ageVerified && !isAuthenticated) return <AgeVerification onVerify={handleAgeVerification} />;

  const lockedPhotoCount = photos.total - photos.previewCount;
  const totalUnlockCost = pricing.unlockPhotos + pricing.unlockContact;
  const bundleDiscount = Math.round(totalUnlockCost * 0.1); // 10% discount for bundle
  const bundlePrice = totalUnlockCost - bundleDiscount;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950"
      onTouchStart={pullTouchStart}
      onTouchMove={pullTouchMove}
      onTouchEnd={pullTouchEnd}
    >
      {/* Toast notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onHide={hideToast} />

      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pt-4 transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance / 2, 40)}px)` }}
        >
          <div className={`p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw
              size={20}
              className={`transition-all ${pullDistance > 80 ? 'text-pink-400' : 'text-white/60'}`}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-2">
            {isRefreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
          </p>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-6 pb-24">

        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/explore/all" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <Link to="/explore/all" className="text-white font-bold text-lg">{PLATFORM_CONFIG.name}</Link>
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

        {/* 1. PROFILE + TRUST */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-1">
              {photos.previewImages?.[0] ? (
                <img
                  src={photos.previewImages[0]}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{profile.name.slice(0,2).toUpperCase()}</span>
                </div>
              )}
            </div>
            {profile.isOnline && <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse-green" />}
            {/* Favorite button */}
            <button
              onClick={() => isAuthenticated ? toggleFavorite(currentUsername) : navigate('/auth')}
              className={`absolute -top-1 -right-1 p-2 rounded-full transition-all shadow-lg ${
                isFavorite(currentUsername)
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/20 text-white/70 hover:bg-white/30 hover:text-pink-400'
              }`}
            >
              <Heart size={18} className={isFavorite(currentUsername) ? 'fill-white' : ''} />
            </button>
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
            {profile.isAvailable !== false ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm">
                <Clock size={12} /> On Break
              </span>
            )}
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

          <div className="grid grid-cols-4 gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /><span className="text-white font-bold">{stats.rating}</span></div>
              <p className="text-white/40 text-xs">{stats.reviews} reviews</p>
            </div>
            <div className="text-center border-l border-white/10"><p className="text-white font-bold">{stats.verifiedMeetups}</p><p className="text-white/40 text-xs">Meetups</p></div>
            <div className="text-center border-l border-white/10">
              <div className="flex items-center justify-center gap-1"><Heart size={12} className="text-pink-400 fill-pink-400" /><span className="text-pink-400 font-bold">{favoriteCount}</span></div>
              <p className="text-white/40 text-xs">Favorites</p>
            </div>
            <div className="text-center border-l border-white/10"><p className="text-white font-bold">{stats.profileViews || 0}</p><p className="text-white/40 text-xs">Views</p></div>
          </div>

          {/* Review Highlights */}
          {CONFIG.reviewHighlights && CONFIG.reviewHighlights.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {CONFIG.reviewHighlights.map((highlight, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
                >
                  <ThumbsUp size={10} />
                  {highlight}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ABOUT / BIO */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2 mb-3"><Info size={14} className="text-pink-400" />About</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        )}

        {/* SERVICES & DETAILS */}
        {(profile.services?.length > 0 || profile.areas?.length > 0 || profile.bodyType || profile.age) && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2 mb-3"><Sparkles size={14} className="text-purple-400" />Details</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
              {/* Services */}
              {profile.services?.length > 0 && (
                <div>
                  <p className="text-white/50 text-xs mb-1.5">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.services.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-pink-500/15 border border-pink-500/20 rounded-full text-pink-300 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Areas */}
              {profile.areas?.length > 0 && (
                <div>
                  <p className="text-white/50 text-xs mb-1.5">Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.areas.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/20 rounded-full text-blue-300 text-xs flex items-center gap-1"><MapPin size={10} />{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Attributes */}
              {(profile.bodyType || profile.skinTone || profile.age || profile.height) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {profile.bodyType && <div className="flex justify-between"><span className="text-white/50">Build</span><span className="text-white">{profile.bodyType}</span></div>}
                  {profile.skinTone && <div className="flex justify-between"><span className="text-white/50">Complexion</span><span className="text-white">{profile.skinTone}</span></div>}
                  {profile.age && <div className="flex justify-between"><span className="text-white/50">Age</span><span className="text-white">{profile.age}</span></div>}
                  {profile.height && <div className="flex justify-between"><span className="text-white/50">Height</span><span className="text-white">{profile.height}</span></div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHEDULE / AVAILABILITY */}
        {CONFIG.schedule && Object.keys(CONFIG.schedule).length > 0 && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2 mb-3"><Clock size={14} className="text-blue-400" />Availability</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                  const dayData = CONFIG.schedule[day];
                  if (!dayData) return null;
                  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1, 3);
                  return (
                    <div key={day} className="flex items-center justify-between py-1">
                      <span className="text-white/50">{dayLabel}</span>
                      {dayData.active ? (
                        <span className="text-green-300 text-xs">{dayData.start} - {dayData.end}</span>
                      ) : (
                        <span className="text-white/30 text-xs">Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
              const isPreview = i < photos.previewCount;
              const isVisible = isPreview || photosUnlocked;
              // Get the actual photo URL
              const photoUrl = isPreview
                ? photos.previewImages?.[i]
                : photos.lockedImages?.[i - photos.previewCount];

              return (
                <button
                  key={i}
                  onClick={() => isVisible ? openPhotoGallery(i) : (isAuthenticated ? setModal('unlockPhotos') : navigate('/auth'))}
                  className={`relative aspect-square rounded-xl overflow-hidden group transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                    isVisible
                      ? 'bg-gradient-to-br from-pink-500/40 to-purple-500/40'
                      : 'bg-gradient-to-br from-pink-500/30 to-purple-500/30'
                  }`}
                >
                  {/* Show actual photo if URL exists */}
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt={`Photo ${i + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover ${!isVisible ? 'blur-lg scale-110' : ''}`}
                    />
                  )}

                  {isVisible ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-1">
                        <p className="text-white/50 text-[7px] text-center truncate">{PLATFORM_CONFIG.name} • @{profile.username}</p>
                      </div>
                      {i === 0 && <div className="absolute top-2 left-2 bg-cyan-500/80 rounded-full p-1"><Aperture size={10} className="text-white" /></div>}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    /* Locked photo - show blurred image with lock overlay */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                      <Lock size={18} className="text-white/70 group-hover:scale-110 transition-all" />
                      <span className="text-pink-300/80 text-[9px] mt-1">Tap to unlock</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Consolidated Unlock Widget - right after photos */}
          {!isCreator && (!photosUnlocked || !contactUnlocked) && (
            <div className="mt-4 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10">
              {!clientState.tier ? (
                /* Not verified - show CTA to get verified */
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-2">Get verified to unlock photos & contact</p>
                  <button onClick={() => isAuthenticated ? setModal('trustDeposit') : navigate('/auth')} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-full text-white font-medium text-sm transition-colors">
                    Get Verified — {formatNaira(PLATFORM_CONFIG.verificationTiers.verified.deposit)}
                  </button>
                </div>
              ) : (
                /* Verified - show unlock options */
                <div className="space-y-3">
                  {/* Bundle option - most prominent when both locked */}
                  {!photosUnlocked && !contactUnlocked && (
                    <button onClick={openUnlockBundleModal} className="w-full p-3 bg-gradient-to-r from-pink-500/20 to-green-500/20 rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-400" />
                          <div className="text-left">
                            <span className="text-white font-medium text-sm">Unlock Everything</span>
                            <p className="text-amber-300/70 text-xs">Photos + Phone • Save {formatNaira(bundleDiscount)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-bold text-lg">{formatNaira(bundlePrice)}</span>
                          <p className="text-white/40 text-xs line-through">{formatNaira(totalUnlockCost)}</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Individual options */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Photos */}
                    {photosUnlocked ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-500/20 border border-pink-500/30">
                        <Camera size={16} className="text-pink-400" />
                        <span className="text-pink-300 text-xs font-medium">Photos Unlocked</span>
                      </div>
                    ) : (
                      <button onClick={() => isAuthenticated ? setModal('unlockPhotos') : navigate('/auth')} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/10 transition-all">
                        <div className="flex items-center gap-2">
                          <Camera size={16} className="text-pink-400" />
                          <span className="text-white text-xs">Photos</span>
                        </div>
                        <span className="text-pink-400 text-xs font-bold">{formatNaira(pricing.unlockPhotos)}</span>
                      </button>
                    )}

                    {/* Phone */}
                    {contactUnlocked ? (
                      <button onClick={() => setModal('contactRevealed')} className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/20 border border-green-500/30">
                        <Phone size={16} className="text-green-400" />
                        <span className="text-green-300 text-xs font-medium font-mono">+{contact.whatsapp}</span>
                      </button>
                    ) : (
                      <button onClick={() => isAuthenticated ? setModal('unlockContact') : navigate('/auth')} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/30 hover:bg-green-500/10 transition-all">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-green-400" />
                          <span className="text-white text-xs">Phone</span>
                        </div>
                        <span className="text-green-400 text-xs font-bold">{formatNaira(pricing.unlockContact)}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-white/30 text-[10px] text-center mt-2">{photos.studioName ? `Photos by ${photos.studioName} • ` : ''}Tap any photo to view full-screen</p>
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
              <p className="text-green-300 text-xs flex items-center gap-2"><Shield size={12} />Pay {profile.name} directly via OPay/PalmPay</p>
            </div>
          </div>
        </div>

        {/* 4. CONTACT - Shows when phone is unlocked */}
        {contactUnlocked && !isCreator && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2 mb-3"><Phone size={14} className="text-green-400" />Contact</h3>
            <div className="bg-green-500/10 rounded-xl border border-green-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">WhatsApp Number</p>
                  <p className="text-green-300 font-mono text-lg font-medium">+{contact.whatsapp}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(contact.whatsapp); showToast('Number copied!', 'success'); }}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Copy size={18} className="text-white/70" />
                  </button>
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    <MessageCircle size={18} className="text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. BOOK NOW - Hidden for creators viewing other models */}
        {!isCreator && (
          <div className="mb-6 space-y-3">
            {/* Show client tier status and balance */}
            {clientState.tier && (
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
            )}

            {/* Book Meetup button */}
            <button onClick={() => protectedAction('meetup')} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-pink-500 hover:bg-pink-600 border border-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Heart size={24} className="text-white" />
              <span className="text-white font-semibold">Book Meetup</span>
            </button>

            {/* Get Verified CTA if not verified */}
            {!clientState.tier && (
              <button onClick={() => isAuthenticated ? setModal('trustDeposit') : navigate('/auth')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-colors">
                <ShieldCheck size={18} className="text-blue-400" />
                <span className="flex-1 text-left">
                  <span className="text-blue-300 font-medium text-sm">Get Verified</span>
                  <span className="text-blue-300/60 text-xs ml-2">Unlock photos & contact</span>
                </span>
                <ChevronRight size={16} className="text-blue-400" />
              </button>
            )}
          </div>
        )}

        {/* Creator Notice - show when a creator views another model's profile */}
        {isCreator && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Crown size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-300 font-medium">You're viewing as a Creator</p>
                <p className="text-purple-300/60 text-sm mt-1">
                  Booking and contact features are only available for clients.
                </p>
                <Link
                  to="/creator-dashboard"
                  className="inline-flex items-center gap-1 mt-2 text-purple-400 text-sm hover:text-purple-300 transition-colors"
                >
                  Go to your Dashboard <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 5. REVIEWS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2"><ThumbsUp size={14} className="text-green-400" />Reviews ({stats.reviews})</h3>
            {CONFIG.reviews.length > 0 && <Link to={`/reviews/${currentUsername}`} className="text-pink-400 text-xs hover:text-pink-300 transition-colors">View all</Link>}
          </div>
          {CONFIG.reviews.length > 0 ? (
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
          ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
              <ThumbsUp size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">{stats.reviews > 0 ? `${stats.reviews} reviews` : 'No reviews yet'}</p>
            </div>
          )}
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
          <p className="text-white/20 text-xs mb-3">{PLATFORM_CONFIG.name} • 18+ Only • Anti-Catfish Platform</p>
          <button onClick={() => isAuthenticated ? setModal('report') : navigate('/auth')} className="text-white/30 text-xs hover:text-red-400 flex items-center gap-1 mx-auto"><AlertTriangle size={12} />Report</button>
        </div>
      </div>

      {/* Sticky Bottom CTA Bar - Hidden for creators */}
      {!isCreator && (
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
      )}

      {/* Modals */}
      <TrustDepositModal isOpen={modal === 'trustDeposit'} onClose={() => setModal(null)} onDepositPaid={handleTrustDepositPaid} />
      <InAppChatModal isOpen={modal === 'chat'} onClose={() => setModal(null)} onUpgrade={chatUpgrade} modelConfig={CONFIG} />
      <UnlockContactModal isOpen={modal === 'unlockContact'} onClose={() => setModal(null)} onUnlock={() => { handleUnlockContact(); setModal('contactRevealed'); }} clientState={clientState} onNeedsTrustDeposit={() => setModal('trustDeposit')} onDeductBalance={deductFromBalance} modelConfig={CONFIG} onSwitchToBundle={() => setModal('unlockBundle')} photosAlreadyUnlocked={photosUnlocked} />
      <ContactRevealedModal isOpen={modal === 'contactRevealed'} onClose={() => setModal(null)} modelConfig={CONFIG} />
      <MeetupModal isOpen={modal === 'meetup'} onClose={() => setModal(null)} clientState={clientState} onNeedsTrustDeposit={() => setModal('trustDeposit')} modelConfig={CONFIG} onMeetupBooked={addMeetupBooking} onDeductBalance={deductFromBalance} />
      <UnlockPhotosModal isOpen={modal === 'unlockPhotos'} onClose={() => setModal(null)} onUnlock={handleUnlockPhotos} clientState={clientState} onDeductBalance={deductFromBalance} onNeedsTrustDeposit={() => setModal('trustDeposit')} modelConfig={CONFIG} onSwitchToBundle={() => setModal('unlockBundle')} contactAlreadyUnlocked={contactUnlocked} />
      <UnlockBundleModal isOpen={modal === 'unlockBundle'} onClose={() => setModal(null)} onUnlock={() => { handleUnlockBundle(); setModal('contactRevealed'); }} clientState={clientState} onNeedsTrustDeposit={() => setModal('trustDeposit')} onDeductBalance={deductFromBalance} modelConfig={CONFIG} />
      <AllReviewsModal isOpen={modal === 'allReviews'} onClose={() => setModal(null)} modelConfig={CONFIG} />
      <VideoVerificationModal isOpen={modal === 'videoVerify'} onClose={() => setModal(null)} modelConfig={CONFIG} />
      <PhotoVerificationModal isOpen={modal === 'photoVerify'} onClose={() => setModal(null)} modelConfig={CONFIG} />
      <PhotoGalleryModal
        isOpen={modal === 'photoGallery'}
        onClose={() => setModal(null)}
        photos={photos}
        initialIndex={photoGalleryIndex}
        photosUnlocked={photosUnlocked}
        onUnlockPhotos={() => { setModal(null); setTimeout(() => setModal('unlockPhotos'), 100); }}
        modelConfig={CONFIG}
      />
      <ReportModal isOpen={modal === 'report'} onClose={() => setModal(null)} />
    </div>
  );
}
