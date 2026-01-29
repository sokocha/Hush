import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Crown, Shield, Video, Camera, DollarSign, Calendar,
  CheckCircle, Clock, AlertTriangle, Star, Users,
  Settings, LogOut, Edit3, ChevronLeft, ChevronRight,
  MapPin, Target, TrendingUp, Eye, Phone,
  Ban, Sparkles, Award, X, Plus, Image, Trash2, Lock, Unlock,
  GripVertical, RotateCcw, CalendarDays, Wallet, ClipboardList,
  CheckCheck, XCircle, User, MessageSquare, RefreshCw, PartyPopper,
  ShieldCheck, BadgeCheck, Pause, Play
} from 'lucide-react';
import { PLATFORM_CONFIG } from '../data/models';
import { useAuth } from '../context/AuthContext';
import { creatorService } from '../services/creatorService';
import { storageService } from '../services/storageService';
import { bookingService } from '../services/bookingService';
import { supabase } from '../lib/supabase';

// Simple confetti component
const Confetti = ({ active }) => {
  if (!active) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = 2 + Math.random() * 2;
    const size = 8 + Math.random() * 8;
    const color = ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#f97316'][Math.floor(Math.random() * 6)];

    return (
      <div
        key={i}
        className="fixed pointer-events-none animate-confetti"
        style={{
          left: `${left}%`,
          top: '-20px',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">{confettiPieces}</div>;
};

// Photo milestone celebration modal
const PhotoMilestoneModal = ({ isOpen, _onClose, onContinue, onAddMore }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full text-center animate-bounce-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <PartyPopper size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Amazing! 🎉</h2>
        <p className="text-white/70 mb-6">
          You've added 3 photos! Your profile is looking great. Ready to move on to the next step?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAddMore}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
          >
            Add More
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

// Video call scheduling modal
const VideoCallScheduleModal = ({ isOpen, onClose, onSchedule }) => {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  const formatDateForInput = (date) => date.toISOString().split('T')[0];
  const formatTimeForInput = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [selectedDate, setSelectedDate] = useState(formatDateForInput(now));
  const [selectedTime, setSelectedTime] = useState(formatTimeForInput(fiveMinutesFromNow));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSchedule({ date: selectedDate, time: selectedTime });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Schedule Verification Call</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Video size={20} className="text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Quick Video Verification</p>
                <p className="text-white/60 text-sm">
                  A Hush team member will video call you to verify your identity. It only takes 2-3 minutes!
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              min={formatDateForInput(now)}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Select Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSchedule}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatNaira = (amount) => `₦${(amount || 0).toLocaleString()}`;

const getClientTierLabel = (client) => {
  if (!client?.has_paid_trust_deposit) return null;
  const tier = client.tier;
  const tierData = PLATFORM_CONFIG.verificationTiers[tier];
  if (!tierData) return null;
  const colors = {
    visitor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    verified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    baller: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    bossman: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };
  const icons = { visitor: BadgeCheck, verified: ShieldCheck, baller: Award, bossman: Crown };
  const Icon = icons[tier] || BadgeCheck;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors[tier] || colors.visitor}`}>
      <Icon size={10} />
      {tierData.name}
    </span>
  );
};

// Parse Naira input (handles "50,000" or "50000" formats)
const parseNairaInput = (value) => {
  const cleaned = value.replace(/[₦,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

// Modal component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className={`bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full ${size === 'lg' ? 'max-w-lg' : size === 'xl' ? 'max-w-xl' : 'max-w-md'} max-h-[90vh] overflow-hidden flex flex-col animate-slideUp`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

// Pricing Input Component
const PricingInput = ({ label, value, onChange, placeholder, hint, required = false, showError = false }) => (
  <div className="space-y-1">
    <label className="text-white/70 text-sm flex items-center gap-1">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₦</span>
      <input
        type="text"
        inputMode="numeric"
        value={value ? value.toLocaleString() : ''}
        onChange={(e) => onChange(parseNairaInput(e.target.value))}
        placeholder={placeholder}
        className={`w-full bg-white/5 border rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none transition-colors ${
          showError && required && (!value || value <= 0)
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-white/10'
        }`}
      />
    </div>
    {hint && <p className="text-white/40 text-xs">{hint}</p>}
  </div>
);

// Camera Capture Component - Live camera only (no file upload to prevent catfishing)
const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const startCamera = useCallback(async (facing) => {
    try {
      setIsVideoReady(false);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permission.');
    }
  }, [stream]);

  React.useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle video loaded
  const handleVideoLoaded = () => {
    console.log('[CameraCapture] Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
    setIsVideoReady(true);
  };

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[CameraCapture] Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('[CameraCapture] Video not ready yet, dimensions are 0');
      return;
    }

    setIsCapturing(true);
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to base64 for persistence in localStorage
    const base64Data = canvas.toDataURL('image/jpeg', 0.8);
    console.log('[CameraCapture] Photo captured, calling onCapture');
    onCapture({
      id: Date.now().toString(),
      url: base64Data,
      capturedAt: new Date().toISOString(),
      isPreview: false,
    });
    setIsCapturing(false);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
        >
          <X size={24} className="text-white" />
        </button>
        <span className="text-white font-medium">Take Photo</span>
        <button
          onClick={switchCamera}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
        >
          <RotateCcw size={24} className="text-white" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <Camera size={48} className="text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-purple-500 rounded-lg text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={handleVideoLoaded}
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={!!error || isCapturing || !isVideoReady}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
              !isVideoReady ? 'border-white/30' : 'border-white'
            } ${
              isCapturing ? 'scale-90 bg-white/20' : 'bg-white/10 active:scale-95'
            }`}
          >
            {!isVideoReady ? (
              <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`w-16 h-16 rounded-full ${isCapturing ? 'bg-white/60' : 'bg-white'}`} />
            )}
          </button>
        </div>
        <p className="text-white/60 text-center text-sm mt-4">
          {!isVideoReady ? 'Loading camera...' : 'Tap to capture'}
        </p>
      </div>
    </div>
  );
};

// Photo Grid Item Component
const PhotoGridItem = ({ photo, index, onTogglePreview, onSetProfilePhoto, onDelete, isDragging, isProfilePhoto }) => (
  <div
    className={`relative aspect-[3/4] rounded-xl overflow-hidden group ${
      isDragging ? 'ring-2 ring-purple-500' : ''
    } ${isProfilePhoto ? 'ring-2 ring-pink-500' : ''}`}
  >
    <img
      src={photo.url}
      alt={`Photo ${index + 1}`}
      className="w-full h-full object-cover"
    />

    {/* Profile Photo Badge */}
    {isProfilePhoto && (
      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-pink-500/90 text-white">
        <User size={12} />
        Profile
      </div>
    )}

    {/* Preview/Locked Badge - positioned below profile badge if exists */}
    <div className={`absolute ${isProfilePhoto ? 'top-10' : 'top-2'} left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
      photo.isPreview
        ? 'bg-green-500/90 text-white'
        : 'bg-black/60 text-white/80'
    }`}>
      {photo.isPreview ? (
        <>
          <Unlock size={12} />
          Preview
        </>
      ) : (
        <>
          <Lock size={12} />
          Locked
        </>
      )}
    </div>

    {/* Photo Number */}
    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs font-medium">
      {index + 1}
    </div>

    {/* Actions Overlay */}
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      {!isProfilePhoto && (
        <button
          onClick={() => onSetProfilePhoto(photo.id)}
          className="p-2 rounded-lg bg-pink-500 text-white transition-colors"
          title="Set as Profile Photo"
        >
          <User size={18} />
        </button>
      )}
      <button
        onClick={() => onTogglePreview(photo.id)}
        className={`p-2 rounded-lg transition-colors ${
          photo.isPreview
            ? 'bg-amber-500 text-white'
            : 'bg-green-500 text-white'
        }`}
        title={photo.isPreview ? 'Make Locked' : 'Make Preview'}
      >
        {photo.isPreview ? <Lock size={18} /> : <Unlock size={18} />}
      </button>
      <button
        onClick={() => onDelete(photo.id)}
        className="p-2 rounded-lg bg-red-500 text-white transition-colors"
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>

    {/* Drag Handle */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 p-1 rounded bg-black/40 text-white/60">
      <GripVertical size={16} />
    </div>
  </div>
);

// Stat card component
const StatCard = ({ icon: Icon, label, value, subValue, color = "purple" }) => {
  const colorClasses = {
    purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
    green: { bg: "bg-green-500/20", text: "text-green-400" },
    pink: { bg: "bg-pink-500/20", text: "text-pink-400" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
  };
  const colors = colorClasses[color] || colorClasses.purple;

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

// Verification step component
const VerificationStep = ({ icon: Icon, title, description, status, action, onAction, scheduledInfo, statusMessage }) => {
  const statusColors = {
    pending: { bg: "bg-amber-500/20", border: "border-amber-500/30", icon: "text-amber-400" },
    scheduled: { bg: "bg-blue-500/20", border: "border-blue-500/30", icon: "text-blue-400" },
    in_progress: { bg: "bg-blue-500/20", border: "border-blue-500/30", icon: "text-blue-400" },
    under_review: { bg: "bg-purple-500/20", border: "border-purple-500/30", icon: "text-purple-400" },
    completed: { bg: "bg-green-500/20", border: "border-green-500/30", icon: "text-green-400" },
    denied: { bg: "bg-red-500/20", border: "border-red-500/30", icon: "text-red-400" },
  };
  const colors = statusColors[status] || statusColors.pending;

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={20} className={colors.icon} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium">{title}</h4>
            {status === 'completed' && (
              <CheckCircle size={16} className="text-green-400" />
            )}
            {status === 'scheduled' && (
              <Clock size={16} className="text-blue-400" />
            )}
            {status === 'under_review' && (
              <Clock size={16} className="text-purple-400" />
            )}
            {status === 'denied' && (
              <XCircle size={16} className="text-red-400" />
            )}
          </div>
          <p className="text-white/50 text-sm">{description}</p>

          {/* Status message for scheduled/review states */}
          {statusMessage && (
            <p className={`text-sm mt-1 ${
              status === 'scheduled' ? 'text-blue-300' :
              status === 'under_review' ? 'text-purple-300' :
              status === 'denied' ? 'text-red-300' : 'text-white/50'
            }`}>
              {statusMessage}
            </p>
          )}

          {/* Scheduled info display */}
          {scheduledInfo && status === 'scheduled' && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                📅 Scheduled for {scheduledInfo.date} at {scheduledInfo.time}
              </p>
            </div>
          )}

          {/* Action button - show based on status */}
          {action && (status === 'pending' || status === 'denied' || (status === 'scheduled' && onAction)) && (
            <button
              onClick={onAction}
              className={`mt-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === 'pending'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : status === 'denied'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white/70'
              }`}
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateUser, isCreator, updateSchedule, toggleExploreVisibility } = useAuth();

  // Check if this is a new registration coming from auth page
  const isNewRegistration = location.state?.newRegistration;

  // Onboarding state - show setup flow for new registrations or incomplete profiles
  // Initialize to true if coming from new registration to avoid flash of dashboard
  const [showOnboarding, setShowOnboarding] = useState(isNewRegistration || false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showPhotoMilestone, setShowPhotoMilestone] = useState(false);
  const [showVideoCallSchedule, setShowVideoCallSchedule] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [verificationCallScheduled, setVerificationCallScheduled] = useState(false);

  // Dispute / re-verification modals
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReverifyModal, setShowReverifyModal] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [reverifyDate, setReverifyDate] = useState('');
  const [reverifyTime, setReverifyTime] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(null);
  const [editData, setEditData] = useState({});

  // Booking management state
  const [bookingFilter, setBookingFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(null); // holds bookingId to cancel
  const [dbBookings, setDbBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [dbEarnings, setDbEarnings] = useState([]);
  const [dbReviews, setDbReviews] = useState([]);

  // Services editing state
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingServices, setEditingServices] = useState([]);

  // Schedule editing state
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Service areas editing state
  const [showEditAreasModal, setShowEditAreasModal] = useState(false);
  const [editingAreas, setEditingAreas] = useState([]);
  const [newAreaInput, setNewAreaInput] = useState('');

  // Pricing form state
  const [pricingData, setPricingData] = useState({
    unlockContact: 0,
    unlockPhotos: 0,
    meetupIncall1: 0,
    meetupIncall2: 0,
    meetupIncallOvernight: 0,
    meetupOutcall1: 0,
    meetupOutcall2: 0,
    meetupOutcallOvernight: 0,
    depositPercent: 50,
    enableOutcall: true,
  });
  const [showPricingErrors, setShowPricingErrors] = useState(false);

  // Check if profile is complete (has photos and pricing set)
  const hasPhotos = user?.photos?.length > 0;
  const hasPricing = user?.pricing?.meetupIncall?.[1] > 0;
  const isProfileComplete = hasPhotos && hasPricing;

  // Check if all required pricing fields are filled in the pricing form
  const isPricingFormValid =
    pricingData.unlockContact > 0 &&
    pricingData.unlockPhotos > 0 &&
    pricingData.meetupIncall1 > 0 &&
    pricingData.meetupIncall2 > 0 &&
    pricingData.meetupIncallOvernight > 0;

  // Get list of missing required pricing fields
  const getMissingPricingFields = () => {
    const missing = [];
    if (!pricingData.unlockContact || pricingData.unlockContact <= 0) missing.push('Contact Unlock');
    if (!pricingData.unlockPhotos || pricingData.unlockPhotos <= 0) missing.push('Photos Unlock');
    if (!pricingData.meetupIncall1 || pricingData.meetupIncall1 <= 0) missing.push('Incall 1hr');
    if (!pricingData.meetupIncall2 || pricingData.meetupIncall2 <= 0) missing.push('Incall 2hr');
    if (!pricingData.meetupIncallOvernight || pricingData.meetupIncallOvernight <= 0) missing.push('Incall Overnight');
    return missing;
  };

  // Redirect new registrations and incomplete profiles to onboarding wizard
  useEffect(() => {
    if (isNewRegistration) {
      navigate('/creator-onboarding', { replace: true, state: { newRegistration: true } });
      return;
    }
  }, [isNewRegistration]);

  // Fetch bookings and earnings from database
  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoadingBookings(true);
    try {
      console.log('[CreatorDashboard] Fetching bookings for creator:', user.id);
      const result = await bookingService.getCreatorBookings(user.id);
      if (result.success) {
        const bookingsData = result.bookings || [];
        console.log('[CreatorDashboard] Fetched', bookingsData.length, 'bookings from database');

        // Look up client names if join didn't resolve them
        const needsNameLookup = bookingsData.filter(b => !b.client?.users?.name);
        if (needsNameLookup.length > 0) {
          const clientIds = [...new Set(needsNameLookup.map(b => b.client_id))];
          const { data: clientUsers } = await supabase
            .from('users')
            .select('id, name, username, phone')
            .in('id', clientIds);
          if (clientUsers) {
            const nameMap = {};
            clientUsers.forEach(u => { nameMap[u.id] = u; });
            bookingsData.forEach(b => {
              if (!b.client?.users?.name && nameMap[b.client_id]) {
                b.client = { ...b.client, users: nameMap[b.client_id] };
              }
            });
          }
        }

        setDbBookings(bookingsData);
      } else {
        console.error('[CreatorDashboard] Failed to fetch bookings:', result.error);
      }

      // Fetch earnings from database
      const { data: earningsData } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (earningsData) {
        setDbEarnings(earningsData);
      }

      // Fetch reviews from database
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, client:client_id(users:id(name, username))')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (reviewsData) {
        setDbReviews(reviewsData);
      }
    } catch (err) {
      console.error('[CreatorDashboard] Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Redirect if not a creator
  if (!user || !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">This page is only for registered creators/models.</p>
          <Link to="/auth" className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors">
            Register / Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Dispute submission
  const handleDisputeSubmit = async () => {
    if (!disputeText.trim() || !user?.id) return;
    setDisputeLoading(true);
    const result = await creatorService.submitDispute(user.id, disputeText.trim());
    setDisputeLoading(false);
    if (result.success) {
      updateUser({ disputeMessage: disputeText.trim(), disputeSubmittedAt: new Date().toISOString() }, false);
      setShowDisputeModal(false);
      setDisputeText('');
    }
  };

  // Re-verification request
  const handleReverifySubmit = async () => {
    if (!reverifyDate || !reverifyTime || !user?.id) return;
    setDisputeLoading(true);
    const scheduledAt = new Date(`${reverifyDate}T${reverifyTime}`).toISOString();
    const result = await creatorService.requestReverification(user.id, scheduledAt);
    setDisputeLoading(false);
    if (result.success) {
      updateUser({
        verificationStatus: 'scheduled',
        verificationCallScheduledAt: scheduledAt,
        verificationDeniedReason: null,
        disputeMessage: null,
        disputeSubmittedAt: null,
      }, false);
      setShowReverifyModal(false);
      setReverifyDate('');
      setReverifyTime('');
    }
  };

  const handleEditProfile = () => {
    setEditData({
      name: user.name || '',
      tagline: user.tagline || '',
      bio: user.bio || '',
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    updateUser(editData);
    setShowEditProfileModal(false);
  };

  // Service areas handlers
  const handleOpenEditAreas = () => {
    setEditingAreas(user.areas || []);
    setNewAreaInput('');
    setShowEditAreasModal(true);
  };

  const handleAddArea = () => {
    const area = newAreaInput.trim();
    if (area && !editingAreas.includes(area)) {
      setEditingAreas([...editingAreas, area]);
      setNewAreaInput('');
    }
  };

  const handleRemoveArea = (areaToRemove) => {
    setEditingAreas(editingAreas.filter(a => a !== areaToRemove));
  };

  const handleSaveAreas = () => {
    updateUser({ areas: editingAreas });
    setShowEditAreasModal(false);
  };

  // Services editing
  const SERVICES_LIST = [
    { id: "gfe", name: "GFE (Girlfriend Experience)" },
    { id: "pse", name: "PSE (Porn Star Experience)" },
    { id: "duo", name: "Duo (with friend)" },
    { id: "dinner", name: "Dinner Date" },
    { id: "travel", name: "Travel Companion" },
    { id: "overnight", name: "Overnight" },
    { id: "event", name: "Event Date" },
  ];

  const handleOpenServicesModal = () => {
    setEditingServices(user.services || []);
    setShowServicesModal(true);
  };

  const toggleServiceSelection = (serviceId) => {
    setEditingServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveServices = async () => {
    await updateUser({ services: editingServices });
    setShowServicesModal(false);
  };

  // Vacation mode toggle
  const handleToggleVacation = async () => {
    const newVisibility = !user.isVisibleInExplore;
    await toggleExploreVisibility(newVisibility);
  };

  // Open pricing modal with current values
  const handleOpenPricing = () => {
    const pricing = user.pricing || {};
    setPricingData({
      unlockContact: pricing.unlockContact || 0,
      unlockPhotos: pricing.unlockPhotos || 0,
      meetupIncall1: pricing.meetupIncall?.[1] || 0,
      meetupIncall2: pricing.meetupIncall?.[2] || 0,
      meetupIncallOvernight: pricing.meetupIncall?.overnight || 0,
      meetupOutcall1: pricing.meetupOutcall?.[1] || 0,
      meetupOutcall2: pricing.meetupOutcall?.[2] || 0,
      meetupOutcallOvernight: pricing.meetupOutcall?.overnight || 0,
      depositPercent: (pricing.depositPercent || 0.5) * 100,
      enableOutcall: pricing.meetupOutcall !== null,
    });
    setShowPricingModal(true);
  };

  // Save pricing
  const handleSavePricing = () => {
    const newPricing = {
      unlockContact: pricingData.unlockContact,
      unlockPhotos: pricingData.unlockPhotos,
      meetupIncall: {
        1: pricingData.meetupIncall1,
        2: pricingData.meetupIncall2,
        overnight: pricingData.meetupIncallOvernight,
      },
      meetupOutcall: pricingData.enableOutcall ? {
        1: pricingData.meetupOutcall1,
        2: pricingData.meetupOutcall2,
        overnight: pricingData.meetupOutcallOvernight,
      } : null,
      depositPercent: pricingData.depositPercent / 100,
    };
    updateUser({ pricing: newPricing });
    setShowPricingModal(false);
  };

  // Photo handlers
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoCapture = async (photo) => {
    console.log('[CreatorDashboard] handlePhotoCapture called with photo:', photo.id);

    // Close camera immediately and show uploading state
    setShowCameraCapture(false);
    setIsUploadingPhoto(true);

    const currentPhotos = user.photos || [];
    // First photo is automatically a preview and profile photo
    const isFirstPhoto = currentPhotos.length === 0;
    const newPhoto = {
      ...photo,
      isPreview: isFirstPhoto,
      isProfilePhoto: isFirstPhoto, // First photo becomes profile photo
      displayOrder: currentPhotos.length,
    };

    // Try to upload to Supabase Storage if user has an ID
    let uploadSucceeded = false;
    if (user?.id) {
      try {
        console.log('[CreatorDashboard] Converting base64 to blob...');
        // Convert base64 data URL to blob
        const response = await fetch(photo.url);
        const blob = await response.blob();
        console.log('[CreatorDashboard] Blob created, size:', blob.size);

        // Upload using storageService which handles both storage and database
        console.log('[CreatorDashboard] Uploading to storage for user:', user.id);
        const result = await storageService.uploadCreatorPhotoBlob(user.id, blob, isFirstPhoto);

        if (result.success) {
          // Use the database ID and proper URL from storage
          newPhoto.id = result.photo.id;
          newPhoto.url = result.photo.url;
          newPhoto.storagePath = result.photo.storage_path;
          console.log('[CreatorDashboard] Photo uploaded and saved:', result.photo.id);
          uploadSucceeded = true;
        } else {
          console.error('[CreatorDashboard] Failed to upload photo:', result.error);
          // Continue with local storage as fallback
        }
      } catch (error) {
        console.error('[CreatorDashboard] Error uploading photo:', error);
        // Continue with local storage as fallback
      }
    }

    // Always save photo locally (even if Supabase upload failed)
    // This allows onboarding to continue and photos can be synced later
    const newPhotos = [...currentPhotos, newPhoto];
    console.log('[CreatorDashboard] Saving photo locally, total photos:', newPhotos.length);
    updateUser({ photos: newPhotos }, !uploadSucceeded); // Only sync if upload didn't succeed
    setIsUploadingPhoto(false);

    // Show milestone celebration when reaching 3 photos
    if (newPhotos.length === 3) {
      setTimeout(() => {
        setShowPhotoMilestone(true);
      }, 300);
    }
  };

  // Handle photo milestone continue
  const handlePhotoMilestoneContinue = () => {
    setShowPhotoMilestone(false);
    setShowOnboarding(true);
    setOnboardingStep(2); // Move to pricing step
  };

  // Handle video call scheduled
  const handleVideoCallScheduled = ({ date, time }) => {
    setShowVideoCallSchedule(false);
    setVerificationCallScheduled(true);
    updateUser({
      verificationCallScheduled: { date, time },
      pendingVerification: true,
    });
    // Move to next step or complete onboarding
    if (showOnboarding) {
      checkOnboardingComplete();
    }
  };

  // Check if all onboarding steps are complete and show confetti
  const checkOnboardingComplete = () => {
    const hasPhotos = (user?.photos?.length || 0) >= 3;
    const hasPricing = user?.pricing?.meetupIncall?.[1] > 0;
    const hasSchedule = user?.schedule?.monday?.active !== undefined;
    const hasVerification = user?.isVerified || user?.isVideoVerified || verificationCallScheduled || user?.verificationCallScheduled;

    if (hasPhotos && hasPricing && hasSchedule && hasVerification) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setShowOnboarding(false);
      }, 4000);
    }
  };

  const handleTogglePreview = async (photoId) => {
    const currentPhotos = user.photos || [];
    const photo = currentPhotos.find(p => p.id === photoId);
    if (!photo) return;

    const newPreviewStatus = !photo.isPreview;

    // Update local state immediately for responsiveness
    const updatedPhotos = currentPhotos.map(p => ({
      ...p,
      isPreview: p.id === photoId ? newPreviewStatus : p.isPreview,
    }));
    updateUser({ photos: updatedPhotos }, false);

    // Sync to database
    try {
      await storageService.setPhotoPreview(photoId, newPreviewStatus);
      console.log('[CreatorDashboard] Photo preview status updated in database');
    } catch (error) {
      console.error('[CreatorDashboard] Failed to update photo preview in database:', error);
    }
  };

  const handleSetProfilePhoto = async (photoId) => {
    const currentPhotos = user.photos || [];

    // Update local state immediately - set selected as profile, first preview photo logic
    const updatedPhotos = currentPhotos.map(p => ({
      ...p,
      isProfilePhoto: p.id === photoId,
      // The profile photo should also be a preview photo
      isPreview: p.id === photoId ? true : p.isPreview,
    }));
    updateUser({ photos: updatedPhotos }, false);

    // Sync to database - mark as preview (profile photos are always previews)
    try {
      // First, ensure the selected photo is marked as preview
      await storageService.setPhotoPreview(photoId, true);
      console.log('[CreatorDashboard] Profile photo updated in database');
    } catch (error) {
      console.error('[CreatorDashboard] Failed to update profile photo in database:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const currentPhotos = user.photos || [];
    const photoToDelete = currentPhotos.find(p => p.id === photoId);
    if (!photoToDelete) return;

    let updatedPhotos = currentPhotos.filter(p => p.id !== photoId);

    // If deleting the profile photo, set the first remaining photo as profile
    if (photoToDelete?.isProfilePhoto && updatedPhotos.length > 0) {
      updatedPhotos = updatedPhotos.map((p, index) => ({
        ...p,
        isProfilePhoto: index === 0,
      }));
    }

    // Update local state immediately
    updateUser({ photos: updatedPhotos }, false);
    setShowDeletePhotoConfirm(null);

    // Delete from database and storage
    try {
      const storagePath = photoToDelete.storagePath || photoToDelete.storage_path;
      if (storagePath) {
        await storageService.deleteCreatorPhoto(photoId, storagePath);
        console.log('[CreatorDashboard] Photo deleted from database and storage');
      } else {
        // Just delete from database if no storage path
        await creatorService.deleteCreatorPhoto(photoId);
        console.log('[CreatorDashboard] Photo deleted from database');
      }
    } catch (error) {
      console.error('[CreatorDashboard] Failed to delete photo:', error);
    }
  };

  const handleReorderPhotos = async (fromIndex, toIndex) => {
    const currentPhotos = [...(user.photos || [])];
    const [removed] = currentPhotos.splice(fromIndex, 1);
    currentPhotos.splice(toIndex, 0, removed);

    // Update display_order for all photos
    const reorderedPhotos = currentPhotos.map((p, index) => ({
      ...p,
      displayOrder: index,
      display_order: index,
    }));

    // Update local state immediately
    updateUser({ photos: reorderedPhotos }, false);

    // Sync to database
    try {
      const photoOrders = reorderedPhotos.map((p, index) => ({
        id: p.id,
        display_order: index,
      }));
      await storageService.reorderPhotos(photoOrders);
      console.log('[CreatorDashboard] Photos reordered in database');
    } catch (error) {
      console.error('[CreatorDashboard] Failed to reorder photos in database:', error);
    }
  };

  // Booking handlers
  const handleConfirmBooking = async (bookingId) => {
    await bookingService.confirmBooking(bookingId);
    setShowBookingModal(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const handleDeclineBooking = async (bookingId) => {
    await bookingService.declineBooking(bookingId, declineReason);
    setShowDeclineModal(null);
    setDeclineReason('');
    fetchBookings();
  };

  const handleCompleteBooking = async (booking) => {
    await bookingService.completeBooking(booking.id, user.id);
    setShowBookingModal(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const handleCancelBooking = (bookingId) => {
    setShowCancelConfirm(bookingId);
  };

  const confirmCancelBooking = async () => {
    if (showCancelConfirm) {
      await bookingService.cancelBooking(showCancelConfirm);
      setShowCancelConfirm(null);
      setShowBookingModal(false);
      setSelectedBooking(null);
      fetchBookings();
    }
  };

  // Schedule handlers
  const handleSaveSchedule = () => {
    if (editingSchedule) {
      updateSchedule(editingSchedule);
      setEditingSchedule(null);
    }
  };

  // Default schedule structure for new users
  const getDefaultSchedule = () => {
    const defaultSchedule = {};
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      defaultSchedule[day] = { active: false, start: '10:00', end: '22:00' };
    });
    return defaultSchedule;
  };

  const handleToggleDay = (day) => {
    const schedule = editingSchedule || user.schedule || getDefaultSchedule();
    const daySchedule = schedule[day] || { active: false, start: '10:00', end: '22:00' };
    setEditingSchedule({
      ...schedule,
      [day]: {
        ...daySchedule,
        active: !daySchedule.active,
      },
    });
  };

  const handleUpdateTime = (day, field, value) => {
    const schedule = editingSchedule || user.schedule || getDefaultSchedule();
    const daySchedule = schedule[day] || { active: false, start: '10:00', end: '22:00' };
    setEditingSchedule({
      ...schedule,
      [day]: {
        ...daySchedule,
        [field]: value,
      },
    });
  };

  // Get bookings data (from database)
  const bookings = dbBookings;
  const filteredBookings = bookingFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingFilter);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  // Get earnings data (from database, with local fallback)
  const earnings = dbEarnings.length > 0 ? dbEarnings : (user.earnings || []);
  const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const thisMonthEarnings = earnings
    .filter(e => new Date(e.created_at || e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  // Get photos data
  const creatorPhotos = user.photos || [];
  const previewCount = creatorPhotos.filter(p => p.isPreview).length;
  const lockedCount = creatorPhotos.filter(p => !p.isPreview).length;

  // Calculate verification progress (phone, video, photos - pricing is separate)
  const verificationSteps = [
    { id: 'phone', completed: true },
    { id: 'video', completed: user.isVideoVerified },
    { id: 'photos', completed: creatorPhotos.length >= 3 },
  ];
  const completedSteps = verificationSteps.filter(s => s.completed).length;
  const verificationProgress = (completedSteps / verificationSteps.length) * 100;

  // Check if all required pricing is configured
  const hasPricingSet =
    user.pricing?.unlockContact > 0 &&
    user.pricing?.unlockPhotos > 0 &&
    user.pricing?.meetupIncall?.[1] > 0 &&
    user.pricing?.meetupIncall?.[2] > 0 &&
    user.pricing?.meetupIncall?.overnight > 0;

  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Crown },
    { id: 'bookings', label: 'Bookings', icon: ClipboardList },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'availability', label: 'Availability', icon: CalendarDays },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Onboarding steps
  const onboardingSteps = [
    {
      title: 'Welcome to Hush!',
      description: 'Congratulations on creating your creator account! Let\'s complete your profile so clients can find and book you.',
      icon: Crown,
      action: null,
    },
    {
      title: 'Add Your Photos',
      description: `You need at least 3 photos to complete your profile. You have ${user?.photos?.length || 0} of 3 photos.`,
      icon: Camera,
      action: () => {
        console.log('[Onboarding] Take Photo button clicked, setting showCameraCapture to true');
        setShowCameraCapture(true);
      },
      actionText: (user?.photos?.length || 0) >= 3 ? 'Add More Photos' : `Take Photo (${user?.photos?.length || 0}/3)`,
      isComplete: (user?.photos?.length || 0) >= 3,
      showPhotoProgress: true,
    },
    {
      title: 'Set Your Pricing',
      description: 'Set your rates for meetups, photo unlocks, and contact unlocks. You can change these anytime.',
      icon: DollarSign,
      action: () => { handleOpenPricing(); },
      actionText: 'Set Pricing',
      isComplete: hasPricingSet,
    },
    {
      title: 'Set Your Schedule',
      description: 'Let clients know when you\'re available for bookings.',
      icon: Calendar,
      action: () => { setActiveTab('availability'); setShowOnboarding(false); },
      actionText: 'Set Schedule',
      isComplete: user?.schedule?.monday?.active !== undefined,
    },
    {
      title: 'Schedule Verification Call',
      description: 'Schedule a quick video call with our team to verify your identity and appear in search results.',
      icon: Video,
      action: () => { setShowVideoCallSchedule(true); },
      actionText: 'Schedule Call',
      isComplete: user?.isVerified || user?.isVideoVerified || verificationCallScheduled || user?.verificationCallScheduled,
    },
  ];

  const currentOnboardingStep = onboardingSteps[onboardingStep];

  // Incomplete profile banner (shown inline in dashboard, no longer a blocking overlay)
  const showIncompleteProfileBanner = !isProfileComplete && user && isCreator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/explore/all" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
              <p className="text-white/50 text-sm">@{user.username || 'username'}</p>
            </div>
          </div>
          {/* Profile photo or default avatar */}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 hover:scale-105 transition-transform"
          >
            {(() => {
              const photos = user.photos || [];
              const profilePhoto = photos.find(p => p.isProfilePhoto) || photos[0];
              return profilePhoto ? (
                <img src={profilePhoto.url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  <User size={20} className="text-white/60" />
                </div>
              );
            })()}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 flex-shrink-0">
              {(() => {
                const photos = user.photos || [];
                const profilePhoto = photos.find(p => p.isProfilePhoto) || photos[0];
                return profilePhoto ? (
                  <img src={profilePhoto.url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{(user.name || 'U').slice(0, 2).toUpperCase()}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-xl truncate">{user.name || 'Your Name'}</h2>
                {user.isVideoVerified && (
                  <span className="p-1 bg-blue-500/20 rounded-full">
                    <Video size={14} className="text-blue-400" />
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-2">{user.tagline || 'Add a tagline...'}</p>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {user.location || 'Location'}
                </span>
                <span>•</span>
                <span>Joined {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Profile Completion</span>
              <span className="text-purple-300 text-sm font-medium">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>
            {verificationProgress < 100 && (
              <p className="text-white/40 text-xs mt-2">
                Complete verification to appear in search results
              </p>
            )}
          </div>
        </div>

        {/* Incomplete profile banner - links to onboarding wizard */}
        {showIncompleteProfileBanner && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Complete your profile</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {!hasPhotos ? 'Add photos and set pricing to go live.' : 'Set your pricing to go live.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/creator-onboarding')}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Continue Setup
              </button>
            </div>
          </div>
        )}

        {/* Verification Banner - shows different states based on verification_status */}
        {(() => {
          const hasPhotos = creatorPhotos.length >= 3;
          const vStatus = user.verificationStatus || 'pending';
          const isVerified = vStatus === 'approved' || user.isVideoVerified || user.isVerified;
          const scheduledAt = user.verificationCallScheduledAt;

          // Don't show banner if fully verified
          if (isVerified) return null;

          // Scheduled - waiting for call
          if (vStatus === 'scheduled') {
            return (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-300 font-medium mb-1">Waiting for Verification Call</h3>
                    <p className="text-blue-300/70 text-sm">
                      You've completed all steps! We'll call you at your scheduled time.
                    </p>
                    {scheduledAt && (
                      <p className="text-blue-300 text-sm mt-1">
                        Scheduled: {new Date(scheduledAt).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(scheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Under review
          if (vStatus === 'under_review') {
            return (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-purple-300 font-medium mb-1">Verification Under Review</h3>
                    <p className="text-purple-300/70 text-sm">
                      Your verification is being reviewed. We'll notify you once it's complete.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Denied
          if (vStatus === 'denied') {
            const hasDisputed = !!user.disputeMessage;
            return (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-red-300 font-medium mb-1">Verification Not Approved</h3>
                    {user.verificationDeniedReason && (
                      <p className="text-red-300/70 text-sm mb-2">
                        Reason: {user.verificationDeniedReason}
                      </p>
                    )}
                    {hasDisputed ? (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                        <p className="text-amber-300 text-xs font-medium mb-1">Your dispute has been submitted</p>
                        <p className="text-amber-200/60 text-sm">{user.disputeMessage}</p>
                      </div>
                    ) : (
                      <p className="text-red-300/60 text-sm mb-2">
                        Your profile is hidden from the platform. You can dispute this decision or schedule a new call.
                      </p>
                    )}
                    {!hasDisputed && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setShowDisputeModal(true)}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-sm font-medium transition-colors"
                        >
                          Dispute Decision
                        </button>
                        <button
                          onClick={() => setShowReverifyModal(true)}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-medium transition-colors"
                        >
                          Request New Call
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Pending - still has steps to complete
          if (vStatus === 'pending' || user.pendingVerification) {
            const missingSteps = [];
            if (!hasPhotos) missingSteps.push('upload at least 3 photos');
            if (!scheduledAt) missingSteps.push('schedule your verification call');

            return (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-amber-300 font-medium mb-1">Verification Pending</h3>
                    <p className="text-amber-300/70 text-sm">
                      To go live on the platform, please {missingSteps.join(' and ')}.
                    </p>
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Complete Verification
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
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
                icon={Eye}
                label="Profile Views"
                value={user.stats?.profileViews || 0}
                subValue="This month"
                color="purple"
              />
              <StatCard
                icon={Star}
                label="Rating"
                value={user.stats?.rating || "—"}
                subValue={`${user.stats?.reviews || 0} reviews`}
                color="amber"
              />
              <StatCard
                icon={Target}
                label="Verified Meetups"
                value={user.stats?.verifiedMeetups || 0}
                subValue={`${user.stats?.meetupSuccessRate || 0}% success`}
                color="green"
              />
              <StatCard
                icon={Wallet}
                label="This Month"
                value={formatNaira(thisMonthEarnings)}
                subValue="Earnings"
                color="green"
              />
            </div>

            {/* Profile Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Crown size={18} className="text-purple-400" />
                  My Profile
                </h3>
                <button
                  onClick={handleEditProfile}
                  className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300"
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
                  <span className="text-white/50 text-sm">Username</span>
                  <span className="text-white font-medium">@{user.username || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Location</span>
                  <span className="text-white font-medium">{user.location || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Areas</span>
                  <span className="text-white font-medium text-right">
                    {user.areas?.length > 0 ? user.areas.slice(0, 2).join(', ') : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className={`text-sm font-medium ${user.pendingVerification ? 'text-amber-400' : 'text-green-400'}`}>
                    {user.pendingVerification ? 'Pending Verification' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  Services Offered
                </h3>
                <button
                  onClick={handleOpenServicesModal}
                  className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
              {user.services?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.services.map(service => (
                    <span key={service} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No services set. Tap Edit to add services.</p>
              )}
            </div>

            {/* Boundaries */}
            {user.boundaries?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Ban size={18} className="text-red-400" />
                  Boundaries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.boundaries.map(boundary => (
                    <span key={boundary} className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                      {boundary}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {dbReviews.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" />
                  Recent Reviews ({dbReviews.length})
                </h3>
                <div className="space-y-3">
                  {dbReviews.slice(0, 5).map(review => (
                    <div key={review.id} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-medium text-sm">{review.client?.users?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-white/60 text-sm">{review.comment}</p>
                      )}
                      <p className="text-white/30 text-xs mt-1">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Booking Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{pendingBookings.length}</p>
                <p className="text-amber-300/70 text-xs">Pending</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{confirmedBookings.length}</p>
                <p className="text-blue-300/70 text-xs">Confirmed</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{completedBookings.length}</p>
                <p className="text-green-300/70 text-xs">Completed</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'completed', label: 'Completed' },
                { id: 'declined', label: 'Declined' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setBookingFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    bookingFilter === filter.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Bookings List */}
            {loadingBookings ? (
              <div className="py-12 text-center">
                <RefreshCw size={24} className="text-white/30 animate-spin mx-auto mb-3" />
                <p className="text-white/50 text-sm">Loading bookings...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="space-y-3">
                {filteredBookings.map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowBookingModal(true);
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <User size={18} className="text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{booking.client?.users?.name || 'Client'}</p>
                            {getClientTierLabel(booking.client)}
                          </div>
                          <p className="text-white/50 text-xs">{booking.client?.users?.phone}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                        booking.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        booking.status === 'declined' ? 'bg-red-500/20 text-red-300' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar size={14} />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock size={14} />
                        <span>{booking.time} • {booking.duration}hr</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin size={14} />
                        <span>{booking.location_type === 'incall' ? 'Incall' : 'Outcall'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-400 font-medium">
                        <DollarSign size={14} />
                        <span>{formatNaira(booking.total_price)}</span>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <MessageSquare size={12} />
                          {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList size={32} className="text-white/30" />
                </div>
                <h3 className="text-white font-medium mb-2">No Bookings</h3>
                <p className="text-white/50 text-sm">
                  {bookingFilter === 'all'
                    ? "You haven't received any booking requests yet"
                    : `No ${bookingFilter} bookings`}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Badge - Bragging Rights */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl p-6">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl" />

              <div className="relative">
                {/* Trophy/Crown icon */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Crown size={36} className="text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Total Earnings - Big and Prominent */}
                <div className="text-center mb-4">
                  <p className="text-amber-300/80 text-sm font-medium mb-1">Total Lifetime Earnings</p>
                  <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">{formatNaira(totalEarnings)}</p>
                </div>

                {/* Earnings Tier Badge */}
                <div className="flex justify-center mb-4">
                  {totalEarnings >= 1000000 ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full text-white font-bold text-sm shadow-lg">
                      <Award size={16} />
                      Millionaire Status 🔥
                    </span>
                  ) : totalEarnings >= 500000 ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-sm shadow-lg">
                      <Sparkles size={16} />
                      Rising Star ⭐
                    </span>
                  ) : totalEarnings >= 100000 ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-bold text-sm shadow-lg">
                      <TrendingUp size={16} />
                      On The Rise 📈
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white font-medium text-sm">
                      <Star size={16} />
                      Just Getting Started
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-white/50 text-xs">This Month</p>
                    <p className="text-2xl font-bold text-green-400">{formatNaira(thisMonthEarnings)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/50 text-xs">Completed Meetups</p>
                    <p className="text-2xl font-bold text-white">{completedBookings.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Target}
                label="Success Rate"
                value={`${user.stats?.meetupSuccessRate || 0}%`}
                subValue="Completed meetups"
                color="green"
              />
              <StatCard
                icon={Calendar}
                label="Avg. Per Meetup"
                value={completedBookings.length > 0 ? formatNaira(Math.round(totalEarnings / completedBookings.length)) : '—'}
                subValue="Average earning"
                color="purple"
              />
            </div>

            {/* Recent Earnings */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-400" />
                Recent Earnings
              </h3>
              {earnings.length > 0 ? (
                <div className="space-y-3">
                  {earnings.slice(0, 10).map(earning => {
                    const booking = bookings.find(b => b.id === (earning.booking_id || earning.bookingId));
                    return (
                      <div key={earning.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-white font-medium">{booking?.client?.users?.name || 'Client'}</p>
                          <p className="text-white/40 text-xs">
                            {new Date(earning.created_at || earning.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className="text-green-400 font-bold">+{formatNaira(parseFloat(earning.amount))}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-white/50 text-sm">No earnings recorded yet</p>
                  <p className="text-white/30 text-xs mt-1">Complete your first booking to start earning</p>
                </div>
              )}
            </div>

            {/* Pricing Reminder */}
            {!hasPricingSet && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-300 font-medium">Set Your Pricing</h4>
                    <p className="text-amber-300/70 text-sm mb-2">
                      You haven't set your rates yet. Set your pricing to start receiving bookings.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setTimeout(() => handleOpenPricing(), 100);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Set Pricing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Availability Schedule</h2>
                <p className="text-white/50 text-sm">Set when you're available for bookings</p>
              </div>
              {editingSchedule && (
                <button
                  onClick={handleSaveSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <CheckCheck size={16} />
                  Save
                </button>
              )}
            </div>

            {/* Schedule Grid */}
            <div className="space-y-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const schedule = (editingSchedule || user.schedule)?.[day] || { active: false, start: '10:00', end: '22:00' };
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border transition-colors ${
                      schedule.active
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleDay(day)}
                          className={`w-12 h-7 rounded-full transition-colors relative ${
                            schedule.active ? 'bg-purple-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                            schedule.active ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                        <span className={`font-medium capitalize ${schedule.active ? 'text-white' : 'text-white/50'}`}>
                          {day}
                        </span>
                      </div>

                      {schedule.active && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => handleUpdateTime(day, 'start', e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                          />
                          <span className="text-white/40">to</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={(e) => handleUpdateTime(day, 'end', e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const allActive = {};
                  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
                    allActive[day] = { active: true, start: '10:00', end: '22:00' };
                  });
                  setEditingSchedule(allActive);
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 text-sm font-medium transition-colors"
              >
                Enable All Days
              </button>
              <button
                onClick={() => {
                  const weekdays = {};
                  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    weekdays[day] = { active: true, start: '10:00', end: '22:00' };
                  });
                  ['saturday', 'sunday'].forEach(day => {
                    weekdays[day] = { active: false, start: '10:00', end: '22:00' };
                  });
                  setEditingSchedule(weekdays);
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 text-sm font-medium transition-colors"
              >
                Weekdays Only
              </button>
            </div>

            {/* Service Areas */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MapPin size={18} className="text-purple-400" />
                  Service Areas
                </h3>
                <button
                  onClick={handleOpenEditAreas}
                  className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
              {user.areas?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.areas.map(area => (
                    <span key={area} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/50 text-sm mb-2">No service areas set</p>
                  <button
                    onClick={handleOpenEditAreas}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    Add Service Areas
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                <CalendarDays size={16} />
                How Availability Works
              </h4>
              <ul className="text-blue-300/70 text-sm space-y-1">
                <li>• Clients can only book during your active hours</li>
                <li>• Toggle days on/off to control when you accept bookings</li>
                <li>• Set specific start and end times for each day</li>
                <li>• Changes are saved automatically</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Verification Steps</h2>
            <p className="text-white/50 text-sm mb-4">
              Complete these steps to activate your profile and appear in search results.
            </p>

            <VerificationStep
              icon={Phone}
              title="Phone Verification"
              description="Verify your identity with your phone number"
              status="completed"
            />

            <VerificationStep
              icon={Video}
              title="Video Verification"
              description="Complete a live video call with our team to verify your identity"
              status={
                user.isVideoVerified ? 'completed' :
                user.verificationDenied ? 'denied' :
                user.verificationUnderReview ? 'under_review' :
                (verificationCallScheduled || user.verificationCallScheduled) ? 'scheduled' :
                'pending'
              }
              action={
                user.isVideoVerified ? null :
                user.verificationDenied ? 'Reschedule Call' :
                (verificationCallScheduled || user.verificationCallScheduled) ? 'Reschedule' :
                'Schedule Call'
              }
              onAction={() => setShowVideoCallSchedule(true)}
              scheduledInfo={user.verificationCallScheduled || (verificationCallScheduled ? { date: 'Today', time: 'Soon' } : null)}
              statusMessage={
                user.verificationDenied ? 'Your verification was not approved. Please reschedule a call.' :
                user.verificationUnderReview ? 'Your verification is being reviewed. We\'ll notify you soon.' :
                (verificationCallScheduled || user.verificationCallScheduled) ? 'We\'ll call you at the scheduled time.' :
                null
              }
            />

            <VerificationStep
              icon={Camera}
              title="Profile Photos"
              description="Take photos using your camera to show on your profile"
              status={creatorPhotos.length >= 3 ? 'completed' : 'pending'}
              action={creatorPhotos.length >= 3 ? null : (creatorPhotos.length > 0 ? `${creatorPhotos.length} photo${creatorPhotos.length > 1 ? 's' : ''} - Add More` : 'Take Photos')}
              onAction={() => setActiveTab('photos')}
            />

            {/* Show success message when all steps are complete or waiting */}
            {creatorPhotos.length >= 3 && (verificationCallScheduled || user.verificationCallScheduled) && !user.isVideoVerified && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-300 font-medium mb-1">Almost there!</h4>
                    <p className="text-blue-300/70 text-sm">
                      You've completed all the steps in your control. Just wait for your verification call and you'll be all set!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="text-purple-300 font-medium mb-2">Why verification matters</h4>
              <ul className="text-purple-300/70 text-sm space-y-1">
                <li>• Build trust with potential clients</li>
                <li>• Appear higher in search results</li>
                <li>• Access premium platform features</li>
                <li>• Get the verified badge on your profile</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">My Photos</h2>
                <p className="text-white/50 text-sm">
                  {creatorPhotos.length === 0
                    ? 'Take photos to show on your profile'
                    : `${previewCount} preview, ${lockedCount} locked`}
                </p>
              </div>
              {creatorPhotos.length > 0 && (
                <button
                  onClick={() => setShowCameraCapture(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
                >
                  <Camera size={18} />
                  Add Photo
                </button>
              )}
            </div>

            {/* Current Profile Photo */}
            {creatorPhotos.length > 0 && (
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
                    {(() => {
                      const profilePhoto = creatorPhotos.find(p => p.isProfilePhoto) || creatorPhotos[0];
                      return profilePhoto ? (
                        <img src={profilePhoto.url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-pink-500/20 flex items-center justify-center">
                          <User size={32} className="text-pink-300" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Profile Photo</h4>
                    <p className="text-white/50 text-sm">
                      This photo appears on your card in the explore page. Tap any photo and click the profile icon to change it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Requirements Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                <Camera size={16} />
                Photo Guidelines
              </h4>
              <ul className="text-blue-300/70 text-sm space-y-1">
                <li>• Minimum 3 photos required for profile activation</li>
                <li>• At least 1 preview photo (visible to all clients)</li>
                <li>• Locked photos require clients to pay to unlock</li>
                <li>• Your first photo becomes your profile photo by default</li>
                <li>• Tap any photo to set it as your profile photo</li>
              </ul>
            </div>

            {/* Uploading indicator */}
            {isUploadingPhoto && (
              <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-purple-300">Uploading photo...</span>
              </div>
            )}

            {/* Photo Grid */}
            {creatorPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {creatorPhotos.map((photo, index) => (
                  <PhotoGridItem
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onTogglePreview={handleTogglePreview}
                    onSetProfilePhoto={handleSetProfilePhoto}
                    onDelete={(id) => setShowDeletePhotoConfirm(id)}
                    isProfilePhoto={photo.isProfilePhoto}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Image size={32} className="text-white/30" />
                </div>
                <h3 className="text-white font-medium mb-2">No Photos Yet</h3>
                <p className="text-white/50 text-sm mb-4">
                  Take your first photo to start building your profile
                </p>
                <button
                  onClick={() => setShowCameraCapture(true)}
                  disabled={isUploadingPhoto}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                >
                  Take Photo
                </button>
              </div>
            )}

            {/* Photo Stats */}
            {creatorPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <Unlock size={20} className="text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{previewCount}</p>
                  <p className="text-green-300/70 text-sm">Preview Photos</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                  <Lock size={20} className="text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{lockedCount}</p>
                  <p className="text-amber-300/70 text-sm">Locked Photos</p>
                </div>
              </div>
            )}

            {/* Tip */}
            {creatorPhotos.length > 0 && previewCount === 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-300 font-medium">No Preview Photos</h4>
                    <p className="text-amber-300/70 text-sm">
                      You need at least 1 preview photo for clients to see. Tap a photo and click the unlock icon to make it a preview.
                    </p>
                  </div>
                </div>
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
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Edit3 size={18} className="text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Edit Profile</p>
                  <p className="text-white/50 text-sm">Update your name, tagline, and bio</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </button>

            {/* Set Pricing */}
            <button
              onClick={handleOpenPricing}
              className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign size={18} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Set Pricing</p>
                  <p className="text-white/50 text-sm">
                    {hasPricingSet
                      ? `Incall from ${formatNaira(user.pricing.meetupIncall[1])}`
                      : 'Configure your rates for services'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPricingSet && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Set</span>
                )}
                <ChevronRight size={20} className="text-white/30" />
              </div>
            </button>

            {/* Vacation Mode */}
            <button
              onClick={handleToggleVacation}
              className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${user.isVisibleInExplore === false ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                  {user.isVisibleInExplore === false ? (
                    <Pause size={18} className="text-amber-400" />
                  ) : (
                    <Play size={18} className="text-green-400" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">
                    {user.isVisibleInExplore === false ? 'Profile Hidden' : 'Profile Visible'}
                  </p>
                  <p className="text-white/50 text-sm">
                    {user.isVisibleInExplore === false
                      ? 'Your profile is hidden from browse. Tap to go live.'
                      : 'You are visible to clients. Tap to pause bookings.'
                    }
                  </p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${
                user.isVisibleInExplore === false ? 'bg-white/20' : 'bg-green-500'
              }`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  user.isVisibleInExplore === false ? 'left-0.5' : 'left-[22px]'
                }`} />
              </div>
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

            {/* Switch to client */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-sm mb-3">Want to browse as a client instead?</p>
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
              >
                Sign out and register as a Client →
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
            <span className="text-xs">Browse</span>
          </Link>
          <Link to="/reviews" className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
            <Star size={20} />
            <span className="text-xs">Reviews</span>
          </Link>
          <Link to="/creator-dashboard" className="flex flex-col items-center gap-1 text-purple-400">
            <Crown size={20} />
            <span className="text-xs">Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="✏️ Edit Profile"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Display Name</label>
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Destiny"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm">Tagline</label>
            <input
              type="text"
              value={editData.tagline || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g. Your favorite girl 💋"
              maxLength={50}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm">Bio</label>
            <textarea
              value={editData.bio || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
              placeholder="Tell clients about yourself..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none resize-none h-24"
            />
            <p className="text-white/40 text-xs text-right">{(editData.bio || '').length}/200</p>
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
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

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Dispute Verification Decision"
      >
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Explain why you believe the denial was incorrect. Our team will review your dispute.
          </p>
          {user?.verificationDeniedReason && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300 text-xs font-medium mb-1">Denial reason:</p>
              <p className="text-red-200/60 text-sm">{user.verificationDeniedReason}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Your dispute message</label>
            <textarea
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              placeholder="Explain your case..."
              rows={4}
              maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:outline-none resize-none"
            />
            <p className="text-white/30 text-xs text-right">{disputeText.length}/500</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDisputeSubmit}
              disabled={!disputeText.trim() || disputeLoading}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                disputeText.trim()
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Re-verification Modal */}
      <Modal
        isOpen={showReverifyModal}
        onClose={() => setShowReverifyModal(false)}
        title="Request New Verification Call"
      >
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Schedule a new verification call. Make sure you're available at the selected time.
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-white/70 text-sm">Date</label>
              <input
                type="date"
                value={reverifyDate}
                onChange={(e) => setReverifyDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/70 text-sm">Time</label>
              <input
                type="time"
                value={reverifyTime}
                onChange={(e) => setReverifyTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReverifyModal(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReverifySubmit}
              disabled={!reverifyDate || !reverifyTime || disputeLoading}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                reverifyDate && reverifyTime
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {disputeLoading ? 'Scheduling...' : 'Schedule Call'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pricing Configuration Modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => { setShowPricingModal(false); setShowPricingErrors(false); }}
        title="Set Your Pricing"
        size="lg"
      >
        <div className="space-y-6">
          {/* Required fields note */}
          <p className="text-white/50 text-sm">
            Fields marked with <span className="text-red-400">*</span> are required
          </p>

          {/* Unlock Fees */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Lock size={16} className="text-purple-400" />
              Unlock Fees
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <PricingInput
                label="Contact Info"
                value={pricingData.unlockContact}
                onChange={(v) => setPricingData(prev => ({ ...prev, unlockContact: v }))}
                placeholder="1,000"
                hint="To view your WhatsApp"
                required
                showError={showPricingErrors}
              />
              <PricingInput
                label="All Photos"
                value={pricingData.unlockPhotos}
                onChange={(v) => setPricingData(prev => ({ ...prev, unlockPhotos: v }))}
                placeholder="5,000"
                hint="To unlock locked photos"
                required
                showError={showPricingErrors}
              />
            </div>
          </div>

          {/* Incall Rates */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <MapPin size={16} className="text-green-400" />
              Incall Rates
              <span className="text-white/40 text-xs font-normal">(Client comes to you)</span>
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <PricingInput
                label="1 Hour"
                value={pricingData.meetupIncall1}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncall1: v }))}
                placeholder="50,000"
                required
                showError={showPricingErrors}
              />
              <PricingInput
                label="2 Hours"
                value={pricingData.meetupIncall2}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncall2: v }))}
                placeholder="80,000"
                required
                showError={showPricingErrors}
              />
              <PricingInput
                label="Overnight"
                value={pricingData.meetupIncallOvernight}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncallOvernight: v }))}
                placeholder="150,000"
                required
                showError={showPricingErrors}
              />
            </div>
          </div>

          {/* Outcall Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Outcall</p>
              <p className="text-white/50 text-sm">You travel to the client</p>
            </div>
            <button
              onClick={() => setPricingData(prev => ({ ...prev, enableOutcall: !prev.enableOutcall }))}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                pricingData.enableOutcall ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                pricingData.enableOutcall ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Outcall Rates */}
          {pricingData.enableOutcall && (
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Target size={16} className="text-blue-400" />
                Outcall Rates
                <span className="text-white/40 text-xs font-normal">(You go to client)</span>
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <PricingInput
                  label="1 Hour"
                  value={pricingData.meetupOutcall1}
                  onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcall1: v }))}
                  placeholder="70,000"
                />
                <PricingInput
                  label="2 Hours"
                  value={pricingData.meetupOutcall2}
                  onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcall2: v }))}
                  placeholder="100,000"
                />
                <PricingInput
                  label="Overnight"
                  value={pricingData.meetupOutcallOvernight}
                  onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcallOvernight: v }))}
                  placeholder="200,000"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-purple-300 font-medium mb-3">Pricing Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Incall (1hr)</span>
                <span className="text-white font-medium">{formatNaira(pricingData.meetupIncall1)}</span>
              </div>
              {pricingData.enableOutcall && (
                <div className="flex justify-between">
                  <span className="text-white/60">Outcall (1hr)</span>
                  <span className="text-white font-medium">{formatNaira(pricingData.meetupOutcall1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Validation error message */}
          {showPricingErrors && !isPricingFormValid && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm font-medium mb-1">Please fill in all required fields:</p>
              <p className="text-red-300/70 text-xs">{getMissingPricingFields().join(', ')}</p>
            </div>
          )}

          <button
            onClick={() => {
              if (isPricingFormValid) {
                handleSavePricing();
                setShowPricingErrors(false);
              } else {
                setShowPricingErrors(true);
              }
            }}
            className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
              isPricingFormValid
                ? 'bg-purple-500 hover:bg-purple-600'
                : 'bg-purple-500/50 hover:bg-purple-500/70'
            }`}
          >
            {isPricingFormValid ? 'Save Pricing' : 'Complete Required Fields'}
          </button>
        </div>
      </Modal>

      {/* Delete Photo Confirmation Modal */}
      <Modal
        isOpen={!!showDeletePhotoConfirm}
        onClose={() => setShowDeletePhotoConfirm(null)}
        title="Delete Photo"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to delete this photo? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeletePhotoConfirm(null)}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeletePhoto(showDeletePhotoConfirm)}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showBookingModal && selectedBooking}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <User size={24} className="text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{selectedBooking.client?.users?.name || 'Client'}</p>
                  {getClientTierLabel(selectedBooking.client)}
                </div>
                <p className="text-white/50 text-sm">{selectedBooking.client?.users?.phone}</p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 flex items-center gap-2"><Calendar size={14} /> Date</span>
                <span className="text-white font-medium">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 flex items-center gap-2"><Clock size={14} /> Time</span>
                <span className="text-white font-medium">{selectedBooking.time}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 flex items-center gap-2"><Clock size={14} /> Duration</span>
                <span className="text-white font-medium">{selectedBooking.duration} hour{selectedBooking.duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 flex items-center gap-2"><MapPin size={14} /> Type</span>
                <span className="text-white font-medium">{selectedBooking.location_type === 'incall' ? 'Incall' : 'Outcall'}</span>
              </div>
              {selectedBooking.location && (
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60 flex items-center gap-2"><MapPin size={14} /> Location</span>
                  <span className="text-white font-medium text-right max-w-[60%]">{selectedBooking.location}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 flex items-center gap-2"><DollarSign size={14} /> Total</span>
                <span className="text-green-400 font-bold">{formatNaira(selectedBooking.total_price)}</span>
              </div>
              {selectedBooking.deposit_amount && (
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60">Deposit Paid</span>
                  <span className="text-white font-medium">{formatNaira(selectedBooking.deposit_amount)}</span>
                </div>
              )}
            </div>

            {/* Special Requests */}
            {selectedBooking.special_requests && (
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Special Requests
                </p>
                <p className="text-white text-sm">{selectedBooking.special_requests}</p>
              </div>
            )}

            {/* Client Code */}
            {selectedBooking.client_code && selectedBooking.status === 'confirmed' && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                <p className="text-purple-300 text-xs mb-1">Verification Code</p>
                <p className="text-2xl font-mono font-bold text-white tracking-wider">{selectedBooking.client_code}</p>
                <p className="text-purple-300/60 text-xs mt-1">Client will show this code at meetup</p>
              </div>
            )}

            {/* Status */}
            <div className={`p-3 rounded-xl text-center ${
              selectedBooking.status === 'pending' ? 'bg-amber-500/20 border border-amber-500/30' :
              selectedBooking.status === 'confirmed' ? 'bg-blue-500/20 border border-blue-500/30' :
              selectedBooking.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' :
              selectedBooking.status === 'declined' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-white/10 border border-white/20'
            }`}>
              <span className={`text-sm font-medium ${
                selectedBooking.status === 'pending' ? 'text-amber-300' :
                selectedBooking.status === 'confirmed' ? 'text-blue-300' :
                selectedBooking.status === 'completed' ? 'text-green-300' :
                selectedBooking.status === 'declined' ? 'text-red-300' :
                'text-white/60'
              }`}>
                Status: {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
              </span>
            </div>

            {/* Actions */}
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setShowDeclineModal(selectedBooking.id);
                  }}
                  className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Decline
                </button>
                <button
                  onClick={() => handleConfirmBooking(selectedBooking.id)}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Confirm
                </button>
              </div>
            )}

            {selectedBooking.status === 'confirmed' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 font-medium transition-colors"
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => handleCompleteBooking(selectedBooking)}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCheck size={18} />
                  Mark Complete
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Decline Booking Modal */}
      <Modal
        isOpen={!!showDeclineModal}
        onClose={() => {
          setShowDeclineModal(null);
          setDeclineReason('');
        }}
        title="Decline Booking"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to decline this booking request? You can optionally provide a reason.
          </p>

          <div className="space-y-2">
            <label className="text-white/70 text-sm">Reason (optional)</label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Not available on this date"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none resize-none h-20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeclineModal(null);
                setDeclineReason('');
              }}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeclineBooking(showDeclineModal)}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-all"
            >
              Decline Booking
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-white text-center font-medium mb-1">
              Are you sure you want to cancel this booking?
            </p>
            <p className="text-white/60 text-sm text-center">
              The client will be notified that the booking has been cancelled.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(null)}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Keep Booking
            </button>
            <button
              onClick={confirmCancelBooking}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-all"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Camera Capture */}
      {showCameraCapture && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCameraCapture(false)}
        />
      )}

      {/* Edit Service Areas Modal */}
      <Modal
        isOpen={showEditAreasModal}
        onClose={() => setShowEditAreasModal(false)}
        title="Edit Service Areas"
      >
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Add the areas where you provide services. Clients can filter by area.
          </p>

          {/* Add new area input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAreaInput}
              onChange={(e) => setNewAreaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
              placeholder="e.g. Victoria Island, Lekki"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleAddArea}
              disabled={!newAreaInput.trim()}
              className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Current areas */}
          {editingAreas.length > 0 ? (
            <div className="space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-wide">Your service areas</p>
              <div className="flex flex-wrap gap-2">
                {editingAreas.map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm"
                  >
                    {area}
                    <button
                      onClick={() => handleRemoveArea(area)}
                      className="text-purple-300 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <MapPin size={32} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No areas added yet</p>
            </div>
          )}

          {/* Suggested areas based on location */}
          {user.location && (
            <div className="space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-wide">Suggested for {user.location}</p>
              <div className="flex flex-wrap gap-2">
                {(user.location === 'Lagos' ? ['Victoria Island', 'Lekki', 'Ikeja', 'Ikoyi', 'Surulere', 'Ajah', 'Yaba'] :
                  user.location === 'Abuja' ? ['Wuse', 'Maitama', 'Garki', 'Asokoro', 'Gwarinpa', 'Central Area'] :
                  user.location === 'Port Harcourt' ? ['GRA', 'Trans Amadi', 'Old GRA', 'Rumuokoro', 'Elekahia'] :
                  []
                ).filter(area => !editingAreas.includes(area)).map(area => (
                  <button
                    key={area}
                    onClick={() => setEditingAreas([...editingAreas, area])}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors"
                  >
                    + {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveAreas}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
          >
            Save Service Areas
          </button>
        </div>
      </Modal>

      {/* Edit Services Modal */}
      <Modal
        isOpen={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        title="Edit Services"
      >
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Select the services you offer. Clients will see these on your profile.
          </p>
          <div className="space-y-2">
            {SERVICES_LIST.map(service => (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleServiceSelection(service.id)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  editingServices.includes(service.id)
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  editingServices.includes(service.id)
                    ? 'border-purple-400 bg-purple-500'
                    : 'border-white/30'
                }`}>
                  {editingServices.includes(service.id) && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <span className="text-white text-sm">{service.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveServices}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
          >
            Save Services
          </button>
        </div>
      </Modal>

      {/* Photo Milestone Celebration Modal */}
      <PhotoMilestoneModal
        isOpen={showPhotoMilestone}
        onClose={() => setShowPhotoMilestone(false)}
        onContinue={handlePhotoMilestoneContinue}
        onAddMore={() => {
          setShowPhotoMilestone(false);
          setShowCameraCapture(true);
        }}
      />

      {/* Video Call Scheduling Modal */}
      <VideoCallScheduleModal
        isOpen={showVideoCallSchedule}
        onClose={() => setShowVideoCallSchedule(false)}
        onSchedule={handleVideoCallScheduled}
      />

      {/* Confetti Celebration */}
      <Confetti active={showConfetti} />
    </div>
  );
}
