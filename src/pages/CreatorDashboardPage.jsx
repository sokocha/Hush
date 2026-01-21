import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, Shield, Video, Camera, DollarSign, Calendar,
  CheckCircle, Clock, AlertTriangle, Star, Users, Heart,
  Settings, LogOut, Edit3, ChevronLeft, ChevronRight,
  MapPin, Target, TrendingUp, Eye, Phone, MessageCircle,
  Ban, Sparkles, Award, X, Plus, Image, Trash2, Lock, Unlock,
  GripVertical, RotateCcw
} from 'lucide-react';
import { PLATFORM_CONFIG } from '../data/models';
import { useAuth } from '../context/AuthContext';

const formatNaira = (amount) => `₦${(amount || 0).toLocaleString()}`;

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
const PricingInput = ({ label, value, onChange, placeholder, hint }) => (
  <div className="space-y-1">
    <label className="text-white/70 text-sm">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₦</span>
      <input
        type="text"
        inputMode="numeric"
        value={value ? value.toLocaleString() : ''}
        onChange={(e) => onChange(parseNairaInput(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
      />
    </div>
    {hint && <p className="text-white/40 text-xs">{hint}</p>}
  </div>
);

// Camera Capture Component
const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async (facing) => {
    try {
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

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const photoUrl = URL.createObjectURL(blob);
      onCapture({
        id: Date.now().toString(),
        url: photoUrl,
        blob,
        capturedAt: new Date().toISOString(),
        isPreview: false,
      });
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
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
            disabled={!!error || isCapturing}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
              isCapturing ? 'scale-90 bg-white/20' : 'bg-white/10 active:scale-95'
            }`}
          >
            <div className={`w-16 h-16 rounded-full ${isCapturing ? 'bg-white/60' : 'bg-white'}`} />
          </button>
        </div>
        <p className="text-white/60 text-center text-sm mt-4">Tap to capture</p>
      </div>
    </div>
  );
};

// Photo Grid Item Component
const PhotoGridItem = ({ photo, index, onTogglePreview, onDelete, isDragging }) => (
  <div
    className={`relative aspect-[3/4] rounded-xl overflow-hidden group ${
      isDragging ? 'ring-2 ring-purple-500' : ''
    }`}
  >
    <img
      src={photo.url}
      alt={`Photo ${index + 1}`}
      className="w-full h-full object-cover"
    />

    {/* Preview/Locked Badge */}
    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
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
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
const VerificationStep = ({ icon: Icon, title, description, status, action, onAction }) => {
  const statusColors = {
    pending: { bg: "bg-amber-500/20", border: "border-amber-500/30", icon: "text-amber-400" },
    in_progress: { bg: "bg-blue-500/20", border: "border-blue-500/30", icon: "text-blue-400" },
    completed: { bg: "bg-green-500/20", border: "border-green-500/30", icon: "text-green-400" },
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
            {status === 'in_progress' && (
              <Clock size={16} className="text-blue-400" />
            )}
          </div>
          <p className="text-white/50 text-sm mb-2">{description}</p>
          {status !== 'completed' && action && (
            <button
              onClick={onAction}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === 'pending'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70'
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
  const { user, logout, updateUser, isCreator } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(null);
  const [editData, setEditData] = useState({});

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
  const handlePhotoCapture = (photo) => {
    const currentPhotos = user.photos || [];
    // First photo is automatically a preview
    const isFirstPhoto = currentPhotos.length === 0;
    const newPhoto = { ...photo, isPreview: isFirstPhoto };
    updateUser({ photos: [...currentPhotos, newPhoto] });
    setShowCameraCapture(false);
  };

  const handleTogglePreview = (photoId) => {
    const currentPhotos = user.photos || [];
    const updatedPhotos = currentPhotos.map(p => ({
      ...p,
      isPreview: p.id === photoId ? !p.isPreview : p.isPreview,
    }));
    updateUser({ photos: updatedPhotos });
  };

  const handleDeletePhoto = (photoId) => {
    const currentPhotos = user.photos || [];
    const updatedPhotos = currentPhotos.filter(p => p.id !== photoId);
    updateUser({ photos: updatedPhotos });
    setShowDeletePhotoConfirm(null);
  };

  const handleReorderPhotos = (fromIndex, toIndex) => {
    const currentPhotos = [...(user.photos || [])];
    const [removed] = currentPhotos.splice(fromIndex, 1);
    currentPhotos.splice(toIndex, 0, removed);
    updateUser({ photos: currentPhotos });
  };

  // Get photos data
  const creatorPhotos = user.photos || [];
  const previewCount = creatorPhotos.filter(p => p.isPreview).length;
  const lockedCount = creatorPhotos.filter(p => !p.isPreview).length;

  // Calculate verification progress
  const verificationSteps = [
    { id: 'phone', completed: true },
    { id: 'video', completed: user.isVideoVerified },
    { id: 'studio', completed: user.isStudioVerified },
    { id: 'pricing', completed: user.pricing?.meetupIncall?.[1] > 0 },
  ];
  const completedSteps = verificationSteps.filter(s => s.completed).length;
  const verificationProgress = (completedSteps / verificationSteps.length) * 100;

  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Crown },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-3 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/60"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{(user.name || 'U').slice(0, 2).toUpperCase()}</span>
              </div>
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

        {/* Pending Verification Banner */}
        {user.pendingVerification && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-300 font-medium mb-1">Verification Pending</h3>
                <p className="text-amber-300/70 text-sm">
                  Complete video verification and upload studio photos to go live on the platform.
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
        )}

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
                icon={Heart}
                label="Repeat Clients"
                value={user.stats?.repeatClients || 0}
                subValue="Loyal clients"
                color="pink"
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
            {user.services?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  Services Offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.services.map(service => (
                    <span key={service} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
              status={user.isVideoVerified ? 'completed' : 'pending'}
              action="Schedule Call"
              onAction={() => alert('Video verification scheduling would open here')}
            />

            <VerificationStep
              icon={Camera}
              title="Profile Photos"
              description="Take photos using your camera to show on your profile"
              status={creatorPhotos.length >= 3 ? 'completed' : 'pending'}
              action={creatorPhotos.length > 0 ? `${creatorPhotos.length} photo${creatorPhotos.length > 1 ? 's' : ''} - Add More` : 'Take Photos'}
              onAction={() => setActiveTab('photos')}
            />

            <VerificationStep
              icon={DollarSign}
              title="Set Pricing"
              description="Configure your rates for different services"
              status={user.pricing?.meetupIncall?.[1] > 0 ? 'completed' : 'pending'}
              action="Set Prices"
              onAction={handleOpenPricing}
            />

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
              <button
                onClick={() => setShowCameraCapture(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>

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
                <li>• Photos must be taken fresh from your camera</li>
              </ul>
            </div>

            {/* Photo Grid */}
            {creatorPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {creatorPhotos.map((photo, index) => (
                  <PhotoGridItem
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onTogglePreview={handleTogglePreview}
                    onDelete={(id) => setShowDeletePhotoConfirm(id)}
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
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
                >
                  Open Camera
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

      {/* Pricing Configuration Modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title="Set Your Pricing"
        size="lg"
      >
        <div className="space-y-6">
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
              />
              <PricingInput
                label="All Photos"
                value={pricingData.unlockPhotos}
                onChange={(v) => setPricingData(prev => ({ ...prev, unlockPhotos: v }))}
                placeholder="5,000"
                hint="To unlock locked photos"
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
              />
              <PricingInput
                label="2 Hours"
                value={pricingData.meetupIncall2}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncall2: v }))}
                placeholder="80,000"
              />
              <PricingInput
                label="Overnight"
                value={pricingData.meetupIncallOvernight}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncallOvernight: v }))}
                placeholder="150,000"
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

          {/* Deposit Percentage */}
          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <DollarSign size={16} className="text-amber-400" />
              Booking Deposit
            </h4>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={pricingData.depositPercent}
                onChange={(e) => setPricingData(prev => ({ ...prev, depositPercent: parseInt(e.target.value) }))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-white font-bold w-16 text-right">{pricingData.depositPercent}%</span>
            </div>
            <p className="text-white/40 text-xs">
              Clients pay this % upfront to confirm bookings. The rest is paid at the meetup.
            </p>
          </div>

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
              <div className="flex justify-between">
                <span className="text-white/60">Deposit Required</span>
                <span className="text-white font-medium">{pricingData.depositPercent}% upfront</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePricing}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
          >
            Save Pricing
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

      {/* Camera Capture */}
      {showCameraCapture && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCameraCapture(false)}
        />
      )}
    </div>
  );
}
