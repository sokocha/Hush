import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera, DollarSign, Calendar, Video,
  MapPin, Target, Lock, X, RotateCcw, PartyPopper,
  ChevronRight, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { creatorService } from '../services/creatorService';
import { storageService } from '../services/storageService';

// ═══════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════

const formatNaira = (amount) => `₦${(amount || 0).toLocaleString()}`;

const parseNairaInput = (value) => {
  const cleaned = value.replace(/[₦,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

const STEP_LABELS = ['Photos', 'Pricing', 'Schedule', 'Verification', 'Complete'];

// ═══════════════════════════════════════════════════════════
// PRICING INPUT COMPONENT
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// CAMERA CAPTURE COMPONENT
// ═══════════════════════════════════════════════════════════

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const startCamera = useCallback(async (facing) => {
    try {
      setIsVideoReady(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
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

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoLoaded = () => setIsVideoReady(true);

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsCapturing(true);
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const base64Data = canvas.toDataURL('image/jpeg', 0.8);
    onCapture({
      id: Date.now().toString(),
      url: base64Data,
      capturedAt: new Date().toISOString(),
      isPreview: false,
    });
    setIsCapturing(false);
  };

  const handleClose = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={handleClose} className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
          <X size={24} className="text-white" />
        </button>
        <span className="text-white font-medium">Take Photo</span>
        <button onClick={switchCamera} className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
          <RotateCcw size={24} className="text-white" />
        </button>
      </div>
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <Camera size={48} className="text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">{error}</p>
              <button onClick={() => startCamera(facingMode)} className="px-4 py-2 bg-purple-500 rounded-lg text-white">
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={handleVideoLoaded} className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={!!error || isCapturing || !isVideoReady}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${!isVideoReady ? 'border-white/30' : 'border-white'} ${isCapturing ? 'scale-90 bg-white/20' : 'bg-white/10 active:scale-95'}`}
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

// ═══════════════════════════════════════════════════════════
// CONFETTI COMPONENT
// ═══════════════════════════════════════════════════════════

const Confetti = ({ active }) => {
  if (!active) return null;
  const confettiPieces = Array.from({ length: 50 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = 2 + Math.random() * 2;
    const size = 8 + Math.random() * 8;
    const color = ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#f97316'][Math.floor(Math.random() * 6)];
    return (
      <div key={i} className="fixed pointer-events-none animate-confetti"
        style={{ left: `${left}%`, top: '-20px', width: `${size}px`, height: `${size}px`, backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? '50%' : '0', animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      />
    );
  });
  return <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">{confettiPieces}</div>;
};

// ═══════════════════════════════════════════════════════════
// LABELED PROGRESS BAR
// ═══════════════════════════════════════════════════════════

const OnboardingProgress = ({ currentStep, totalSteps, labels }) => (
  <div className="w-full max-w-md mx-auto mb-8">
    {/* Step label */}
    <div className="flex items-center justify-between mb-2">
      <p className="text-white/50 text-sm">
        Step {currentStep + 1} of {totalSteps}
      </p>
      <p className="text-purple-300 text-sm font-medium">
        {labels[currentStep]}
      </p>
    </div>
    {/* Progress bar */}
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
      />
    </div>
    {/* Step dots with labels */}
    <div className="flex justify-between mt-2">
      {labels.map((label, i) => (
        <div key={i} className="flex flex-col items-center" style={{ width: `${100 / totalSteps}%` }}>
          <div className={`w-2 h-2 rounded-full transition-all ${
            i < currentStep ? 'bg-purple-500' : i === currentStep ? 'bg-purple-400' : 'bg-white/20'
          }`} />
          <span className={`text-[10px] mt-1 text-center leading-tight ${
            i <= currentStep ? 'text-white/60' : 'text-white/30'
          }`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN ONBOARDING PAGE
// ═══════════════════════════════════════════════════════════

export default function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isCreator, updateUser, updateSchedule } = useAuth();

  const isNewRegistration = location.state?.newRegistration;

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 5;

  // Photo state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Pricing state
  const [pricingData, setPricingData] = useState({
    unlockContact: 0, unlockPhotos: 0,
    meetupIncall1: 0, meetupIncall2: 0, meetupIncallOvernight: 0,
    meetupOutcall1: 0, meetupOutcall2: 0, meetupOutcallOvernight: 0,
    depositPercent: 50, enableOutcall: false,
  });
  const [showPricingErrors, setShowPricingErrors] = useState(false);

  // Schedule state
  const [schedule, setSchedule] = useState({
    monday: { active: true, start: '10:00', end: '22:00' },
    tuesday: { active: true, start: '10:00', end: '22:00' },
    wednesday: { active: true, start: '10:00', end: '22:00' },
    thursday: { active: true, start: '10:00', end: '22:00' },
    friday: { active: true, start: '10:00', end: '23:00' },
    saturday: { active: true, start: '12:00', end: '23:00' },
    sunday: { active: false, start: '12:00', end: '20:00' },
  });

  // Verification state
  const [verificationDate, setVerificationDate] = useState('');
  const [verificationTime, setVerificationTime] = useState('');
  const [verificationScheduled, setVerificationScheduled] = useState(false);

  // Completion state
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize pricing from user data if already set
  useEffect(() => {
    if (user?.pricing) {
      const p = user.pricing;
      setPricingData({
        unlockContact: p.unlockContact || 0,
        unlockPhotos: p.unlockPhotos || 0,
        meetupIncall1: p.meetupIncall?.[1] || 0,
        meetupIncall2: p.meetupIncall?.[2] || 0,
        meetupIncallOvernight: p.meetupIncall?.overnight || 0,
        meetupOutcall1: p.meetupOutcall?.[1] || 0,
        meetupOutcall2: p.meetupOutcall?.[2] || 0,
        meetupOutcallOvernight: p.meetupOutcall?.overnight || 0,
        depositPercent: (p.depositPercent || 0.5) * 100,
        enableOutcall: p.meetupOutcall !== null && p.meetupOutcall !== undefined,
      });
    }
    if (user?.schedule) {
      setSchedule(user.schedule);
    }
  }, []);

  // Initialize verification date
  useEffect(() => {
    const now = new Date();
    const fiveMin = new Date(now.getTime() + 5 * 60 * 1000);
    setVerificationDate(now.toISOString().split('T')[0]);
    setVerificationTime(fiveMin.getHours().toString().padStart(2, '0') + ':' + fiveMin.getMinutes().toString().padStart(2, '0'));
  }, []);

  // Clear navigation state to avoid re-trigger on refresh
  useEffect(() => {
    if (isNewRegistration) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  // Redirect if not creator
  if (!user || !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">This page is only for registered creators.</p>
          <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors">
            Register / Login
          </button>
        </div>
      </div>
    );
  }

  // ─── Completion checks ──────────────────────────────────

  const photoCount = user?.photos?.length || 0;
  const hasEnoughPhotos = photoCount >= 3;

  const isPricingValid =
    pricingData.unlockContact > 0 &&
    pricingData.unlockPhotos > 0 &&
    pricingData.meetupIncall1 > 0 &&
    pricingData.meetupIncall2 > 0 &&
    pricingData.meetupIncallOvernight > 0;

  const hasPricingSaved = user?.pricing?.meetupIncall?.[1] > 0;

  const getMissingPricingFields = () => {
    const missing = [];
    if (!pricingData.unlockContact || pricingData.unlockContact <= 0) missing.push('Contact Unlock');
    if (!pricingData.unlockPhotos || pricingData.unlockPhotos <= 0) missing.push('Photos Unlock');
    if (!pricingData.meetupIncall1 || pricingData.meetupIncall1 <= 0) missing.push('Incall 1hr');
    if (!pricingData.meetupIncall2 || pricingData.meetupIncall2 <= 0) missing.push('Incall 2hr');
    if (!pricingData.meetupIncallOvernight || pricingData.meetupIncallOvernight <= 0) missing.push('Incall Overnight');
    return missing;
  };

  // ─── Handlers ───────────────────────────────────────────

  const handlePhotoCapture = async (photo) => {
    setShowCameraCapture(false);
    setIsUploadingPhoto(true);

    const currentPhotos = user.photos || [];
    const isFirstPhoto = currentPhotos.length === 0;
    const newPhoto = {
      ...photo,
      isPreview: isFirstPhoto,
      isProfilePhoto: isFirstPhoto,
      displayOrder: currentPhotos.length,
    };

    let uploadSucceeded = false;
    if (user?.id) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const result = await storageService.uploadCreatorPhotoBlob(user.id, blob, isFirstPhoto);
        if (result.success) {
          newPhoto.id = result.photo.id;
          newPhoto.url = result.photo.url;
          newPhoto.storagePath = result.photo.storage_path;
          uploadSucceeded = true;
        }
      } catch (error) {
        console.error('[Onboarding] Error uploading photo:', error);
      }
    }

    const newPhotos = [...currentPhotos, newPhoto];
    updateUser({ photos: newPhotos }, !uploadSucceeded);
    setIsUploadingPhoto(false);
  };

  const handleSavePricing = async () => {
    if (!isPricingValid) {
      setShowPricingErrors(true);
      return;
    }
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
    await updateUser({ pricing: newPricing });
    setShowPricingErrors(false);
    setCurrentStep(2);
  };

  const handleSaveSchedule = async () => {
    if (updateSchedule) {
      await updateSchedule(schedule);
    } else {
      await updateUser({ schedule });
    }
    setCurrentStep(3);
  };

  const handleScheduleVerification = async () => {
    if (!verificationDate || !verificationTime) return;
    setVerificationScheduled(true);
    const scheduledAt = new Date(`${verificationDate}T${verificationTime}`).toISOString();
    await updateUser({
      verificationCallScheduled: { date: verificationDate, time: verificationTime },
      verificationStatus: 'scheduled',
      verificationCallScheduledAt: scheduledAt,
      pendingVerification: true,
    });
    // Persist verification scheduling to the database
    try {
      const result = await creatorService.requestReverification(user.id, scheduledAt);
      if (!result.success) {
        console.error('[Onboarding] Failed to save verification schedule:', result.error);
      }
    } catch (err) {
      console.error('[Onboarding] Error saving verification schedule:', err);
    }
    // Move to completion
    setCurrentStep(4);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleGoToDashboard = () => {
    navigate('/creator-dashboard');
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep(currentStep + 1);
  };
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Step rendering ─────────────────────────────────────

  const renderPhotosStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
        <Camera size={40} className="text-purple-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">Add Your Photos</h2>
      <p className="text-white/60 mb-6 max-w-sm">
        You need at least 3 photos to complete your profile. You have {Math.min(photoCount, 3)} of 3.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Photo Progress</span>
          <span className="text-white font-medium">{Math.min(photoCount, 3)}/3</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(photoCount / 3 * 100, 100)}%` }}
          />
        </div>

        {/* Photo thumbnails */}
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2].map((index) => {
            const photo = user?.photos?.[index];
            return (
              <div key={index}
                className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden ${
                  photo ? 'border-green-500/50 bg-green-500/10' : 'border-dashed border-white/30 bg-white/5'
                }`}
              >
                {photo ? (
                  <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-white/30" />
                )}
              </div>
            );
          })}
        </div>

        {hasEnoughPhotos && (
          <p className="text-green-400 text-sm text-center mb-2">
            Great! You have enough photos. You can add more or continue.
          </p>
        )}
      </div>

      {isUploadingPhoto && (
        <div className="mb-4 flex items-center gap-2 text-purple-300">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Uploading photo...</span>
        </div>
      )}

      <button
        onClick={() => setShowCameraCapture(true)}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 rounded-xl text-white font-semibold transition-all mb-4"
      >
        {hasEnoughPhotos ? 'Add More Photos' : `Take Photo (${photoCount}/3)`}
      </button>

      {hasEnoughPhotos && (
        <button
          onClick={goNext}
          className="w-full max-w-sm py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition-colors"
        >
          Continue to Pricing <ChevronRight size={16} className="inline ml-1" />
        </button>
      )}
    </div>
  );

  const renderPricingStep = () => (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <DollarSign size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Your Pricing</h2>
        <p className="text-white/60 text-sm max-w-sm mx-auto">
          Set your rates for meetups, photo unlocks, and contact unlocks. You can change these anytime.
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
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
            <PricingInput label="Contact Info" value={pricingData.unlockContact}
              onChange={(v) => setPricingData(prev => ({ ...prev, unlockContact: v }))}
              placeholder="1,000" hint="To view your WhatsApp" required showError={showPricingErrors}
            />
            <PricingInput label="All Photos" value={pricingData.unlockPhotos}
              onChange={(v) => setPricingData(prev => ({ ...prev, unlockPhotos: v }))}
              placeholder="5,000" hint="To unlock locked photos" required showError={showPricingErrors}
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
            <PricingInput label="1 Hour" value={pricingData.meetupIncall1}
              onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncall1: v }))}
              placeholder="50,000" required showError={showPricingErrors}
            />
            <PricingInput label="2 Hours" value={pricingData.meetupIncall2}
              onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncall2: v }))}
              placeholder="80,000" required showError={showPricingErrors}
            />
            <PricingInput label="Overnight" value={pricingData.meetupIncallOvernight}
              onChange={(v) => setPricingData(prev => ({ ...prev, meetupIncallOvernight: v }))}
              placeholder="150,000" required showError={showPricingErrors}
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
            className={`w-12 h-7 rounded-full transition-colors relative ${pricingData.enableOutcall ? 'bg-purple-500' : 'bg-white/20'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${pricingData.enableOutcall ? 'left-6' : 'left-1'}`} />
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
              <PricingInput label="1 Hour" value={pricingData.meetupOutcall1}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcall1: v }))}
                placeholder="70,000"
              />
              <PricingInput label="2 Hours" value={pricingData.meetupOutcall2}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcall2: v }))}
                placeholder="100,000"
              />
              <PricingInput label="Overnight" value={pricingData.meetupOutcallOvernight}
                onChange={(v) => setPricingData(prev => ({ ...prev, meetupOutcallOvernight: v }))}
                placeholder="200,000"
              />
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {isPricingValid && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-purple-300 font-medium mb-3">Pricing Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Incall (1hr)</span>
                <span className="text-white font-medium">{formatNaira(pricingData.meetupIncall1)}</span>
              </div>
              {pricingData.enableOutcall && pricingData.meetupOutcall1 > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Outcall (1hr)</span>
                  <span className="text-white font-medium">{formatNaira(pricingData.meetupOutcall1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation error */}
        {showPricingErrors && !isPricingValid && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm font-medium mb-1">Please fill in all required fields:</p>
            <p className="text-red-300/70 text-xs">{getMissingPricingFields().join(', ')}</p>
          </div>
        )}

        <button
          onClick={handleSavePricing}
          className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
            isPricingValid ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-500/50 hover:bg-purple-500/70'
          }`}
        >
          {isPricingValid ? 'Save & Continue' : 'Complete Required Fields'}
        </button>
      </div>
    </div>
  );

  const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  const renderScheduleStep = () => (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Calendar size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Your Schedule</h2>
        <p className="text-white/60 text-sm max-w-sm mx-auto">
          Let clients know when you're available. Default hours are pre-filled, adjust as needed.
        </p>
      </div>

      <div className="space-y-3 max-w-md mx-auto w-full">
        {DAY_NAMES.map(day => (
          <div key={day} className={`p-3 rounded-xl border transition-colors ${
            schedule[day]?.active ? 'bg-white/5 border-purple-500/30' : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{DAY_LABELS[day]}</span>
              <button
                onClick={() => setSchedule(prev => ({
                  ...prev,
                  [day]: { ...prev[day], active: !prev[day]?.active }
                }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${schedule[day]?.active ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${schedule[day]?.active ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            {schedule[day]?.active && (
              <div className="flex items-center gap-2">
                <input type="time" value={schedule[day]?.start || '10:00'}
                  onChange={(e) => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
                <span className="text-white/40 text-sm">to</span>
                <input type="time" value={schedule[day]?.end || '22:00'}
                  onChange={(e) => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleSaveSchedule}
          className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all mt-4"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
        <Video size={40} className="text-purple-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">Schedule Verification Call</h2>
      <p className="text-white/60 mb-6 max-w-sm">
        A quick 2-3 minute video call to verify your identity. This helps you appear in search results and builds trust with clients.
      </p>

      <div className="w-full max-w-sm space-y-4">
        {/* What to expect */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-purple-400" />
            <p className="text-white font-medium text-sm">What to expect</p>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300 font-medium">1</span>
              <p className="text-white/60">A Hush team member will video call you on WhatsApp.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300 font-medium">2</span>
              <p className="text-white/60">You'll be asked to hold up your ID and say your name.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300 font-medium">3</span>
              <p className="text-white/60">That's it! Takes 2-3 minutes. Your profile goes live after approval.</p>
            </div>
          </div>
        </div>

        {/* What you earn */}
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-300 font-medium text-sm mb-2">After verification you'll get:</p>
          <div className="space-y-1.5 text-sm">
            <p className="text-white/50 flex items-center gap-2"><Video size={12} className="text-green-400" />Verified badge on your profile</p>
            <p className="text-white/50 flex items-center gap-2"><MapPin size={12} className="text-green-400" />Visible in search results</p>
            <p className="text-white/50 flex items-center gap-2"><DollarSign size={12} className="text-green-400" />Able to accept bookings and earn</p>
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2 text-left">Select Date</label>
          <input type="date" value={verificationDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setVerificationDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2 text-left">Select Time</label>
          <input type="time" value={verificationTime}
            onChange={(e) => setVerificationTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleScheduleVerification}
          disabled={!verificationDate || !verificationTime}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
        >
          Schedule Call
        </button>

        <button
          onClick={() => { setCurrentStep(4); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); }}
          className="text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
        <PartyPopper size={48} className="text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">You're All Set!</h2>
      <p className="text-white/60 mb-8 max-w-sm">
        Your profile is ready. Here's a summary of what you've set up:
      </p>

      {/* Profile summary card */}
      <div className="w-full max-w-sm p-4 bg-white/5 border border-white/10 rounded-2xl mb-8">
        <div className="flex items-center gap-3 mb-4">
          {/* Profile photo */}
          <div className="w-14 h-14 rounded-full overflow-hidden bg-purple-500/20 flex-shrink-0">
            {user?.photos?.[0] ? (
              <img src={user.photos[0].url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={20} className="text-purple-400" />
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold">{user?.name || 'Creator'}</p>
            <p className="text-white/50 text-sm">@{user?.username}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/50 flex items-center gap-2">
              <Camera size={14} /> Photos
            </span>
            <span className={`font-medium ${photoCount >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
              {photoCount} uploaded
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 flex items-center gap-2">
              <DollarSign size={14} /> Pricing
            </span>
            <span className={`font-medium ${hasPricingSaved ? 'text-green-400' : 'text-yellow-400'}`}>
              {hasPricingSaved ? formatNaira(user.pricing.meetupIncall[1]) + '/hr' : 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 flex items-center gap-2">
              <Calendar size={14} /> Schedule
            </span>
            <span className="text-green-400 font-medium">
              {DAY_NAMES.filter(d => schedule[d]?.active).length} days active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 flex items-center gap-2">
              <Video size={14} /> Verification
            </span>
            <span className={`font-medium ${
              verificationScheduled || user?.isVerified ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {user?.isVerified ? 'Verified' : verificationScheduled ? 'Scheduled' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 flex items-center gap-2">
              <MapPin size={14} /> Location
            </span>
            <span className="text-white/70 font-medium">{user?.location || 'Not set'}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleGoToDashboard}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 rounded-xl text-white font-semibold transition-all"
      >
        Go to Dashboard
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPhotosStep();
      case 1: return renderPricingStep();
      case 2: return renderScheduleStep();
      case 3: return renderVerificationStep();
      case 4: return renderCompletionStep();
      default: return null;
    }
  };

  // ─── Main render ────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-4">
          {currentStep > 0 && currentStep < 4 ? (
            <button onClick={goBack} className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm transition-colors">
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}
          {currentStep < 4 && (
            <button
              onClick={handleGoToDashboard}
              className="text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Skip setup
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {currentStep < 4 && (
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS - 1}
            labels={STEP_LABELS.slice(0, -1)}
          />
        )}

        {/* Step content */}
        {renderStepContent()}
      </div>

      {/* Camera Capture Overlay */}
      {showCameraCapture && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCameraCapture(false)}
        />
      )}

      {/* Confetti */}
      <Confetti active={showConfetti} />
    </div>
  );
}
