import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, User, Shield, ChevronRight, CheckCircle,
  MapPin, Camera, Video, Sparkles, Crown, Heart,
  ArrowLeft, Wallet, Users, Star, Ban, X,
  Ruler, Clock, DollarSign, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_CONFIG } from '../data/models';

const LOCATIONS = [
  { name: "Lagos", areas: ["Lekki", "VI", "Ikoyi", "Ajah", "Ikeja", "GRA", "Maryland"] },
  { name: "Abuja", areas: ["Maitama", "Wuse", "Asokoro", "Garki", "Jabi"] },
  { name: "Port Harcourt", areas: ["GRA", "Trans Amadi", "Rumuola", "Eleme"] },
];

// Client preference options
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
  "GFE", "PSE", "Dinner dates", "Travel companion", "Overnights", "Duos"
];

// Creator profile options
const BODY_TYPES = ["Slim", "Athletic", "Curvy", "Thick", "BBW", "Petite"];
const SKIN_TONES = ["Fair", "Light", "Caramel", "Brown", "Dark"];
const HEIGHT_RANGES = ["Under 5'2\"", "5'2\" - 5'5\"", "5'5\" - 5'8\"", "5'8\" - 5'11\"", "6'+"];

const SERVICES_OFFERED = [
  { id: "gfe", name: "GFE (Girlfriend Experience)", description: "Intimate, romantic companionship" },
  { id: "pse", name: "PSE (Porn Star Experience)", description: "More adventurous encounters" },
  { id: "duo", name: "Duo (with friend)", description: "Two companions together" },
  { id: "dinner", name: "Dinner Date", description: "Upscale dining companionship" },
  { id: "travel", name: "Travel Companion", description: "Trips and getaways" },
  { id: "overnight", name: "Overnight", description: "Extended time together" },
  { id: "event", name: "Event Date", description: "Social events and parties" },
];

const COMMON_BOUNDARIES = [
  "No bareback",
  "No anal",
  "No kissing",
  "No rough play",
  "No filming/photos",
  "No overnight on first booking",
  "Outcall only to hotels",
  "Incall only",
  "Screening required for new clients",
  "No same-day bookings",
];

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

// OTP Input component
const OTPInput = ({ value, onChange, length = 6 }) => {
  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return;
    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join(''));

    if (digit && index < length - 1) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[...Array(length)].map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-xl text-white focus:border-pink-500 focus:outline-none transition-colors"
        />
      ))}
    </div>
  );
};

// Step indicator
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {[...Array(totalSteps)].map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i < currentStep
            ? 'w-8 bg-pink-500'
            : i === currentStep
            ? 'w-8 bg-pink-500/50'
            : 'w-4 bg-white/20'
        }`}
      />
    ))}
  </div>
);

// Age verification gate
const AgeVerificationStep = ({ onConfirm, onExit }) => (
  <div className="space-y-6 text-center">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
      <Shield size={40} className="text-pink-400" />
    </div>
    <h2 className="text-2xl font-bold text-white">Age Verification</h2>
    <p className="text-white/60">
      This platform contains adult content. You must be 18 years or older to continue.
    </p>
    <div className="space-y-3">
      <button
        onClick={onConfirm}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all text-lg"
      >
        I am 18+ — Continue
      </button>
      <button
        onClick={onExit}
        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/70 font-medium rounded-xl transition-colors"
      >
        I am under 18 — Exit
      </button>
    </div>
  </div>
);

// User type selection
const UserTypeSelection = ({ onSelect, onLogin }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Welcome to {PLATFORM_CONFIG.name}</h1>
      <p className="text-white/60">How would you like to join?</p>
    </div>

    <div className="space-y-4">
      {/* Client option */}
      <button
        onClick={() => onSelect('client')}
        className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-pink-500/50 hover:bg-white/10 transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-pink-500/20 rounded-xl">
            <Heart size={28} className="text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-pink-300 transition-colors">
              I'm looking for companionship
            </h3>
            <p className="text-white/50 text-sm mb-3">
              Browse verified models, book meetups, and enjoy premium experiences
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Browse Models</span>
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Book Meetups</span>
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Secure Payments</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/40 group-hover:text-pink-400 transition-colors" />
        </div>
      </button>

      {/* Creator option */}
      <button
        onClick={() => onSelect('creator')}
        className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-white/10 transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Crown size={28} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-purple-300 transition-colors">
              I'm a creator/model
            </h3>
            <p className="text-white/50 text-sm mb-3">
              Get verified, create your profile, and connect with clients
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Video Verification</span>
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Studio Photos</span>
              <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs">Secure Payouts</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/40 group-hover:text-purple-400 transition-colors" />
        </div>
      </button>
    </div>

    {/* Login option for existing users */}
    <div className="text-center pt-4 border-t border-white/10">
      <p className="text-white/50 text-sm mb-3">Already have an account?</p>
      <button
        onClick={onLogin}
        className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white font-medium transition-all"
      >
        Login
      </button>
    </div>

    {/* Trust features */}
    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-green-400" />
        <span className="text-green-300 font-medium text-sm">Anti-Catfish Platform</span>
      </div>
      <p className="text-green-300/60 text-xs">
        All users verified with phone identity. All models video verified with studio photos.
      </p>
    </div>
  </div>
);

// Login phone step (for existing users)
const LoginPhoneStep = ({ phone, setPhone, onSubmit, onBack, isLoading }) => {
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Phone size={32} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
        <p className="text-white/60 text-sm">
          Enter your registered phone number to login
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-white/70 text-sm">Phone Number</label>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
            <span>🇳🇬</span>
            <span>+234</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="8012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || phone.length < 10}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          phone.length >= 10
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Sending...' : 'Send Verification Code'}
      </button>

      <p className="text-center text-white/40 text-xs">
        Don't have an account?{' '}
        <button type="button" onClick={onBack} className="text-pink-400 hover:text-pink-300">
          Register
        </button>
      </p>
    </form>
  );
};

// Phone input step
const PhoneStep = ({ phone, setPhone, onSubmit, onBack, isLoading, userType }) => {
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${userType === 'client' ? 'bg-pink-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
          <Phone size={32} className={userType === 'client' ? 'text-pink-400' : 'text-purple-400'} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Enter your phone number</h2>
        <p className="text-white/60 text-sm">
          We'll send you a verification code via SMS
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-white/70 text-sm">Phone Number</label>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
            <span>🇳🇬</span>
            <span>+234</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="8012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-start gap-3">
          <Wallet size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/80 text-sm font-medium">OPay / PalmPay Identity</p>
            <p className="text-white/50 text-xs mt-1">
              Your phone number is linked to your OPay or PalmPay account for secure identity verification.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || phone.length < 10}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          phone.length >= 10
            ? userType === 'client'
              ? 'bg-pink-500 hover:bg-pink-600'
              : 'bg-purple-500 hover:bg-purple-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Sending...' : 'Send Verification Code'}
      </button>
    </form>
  );
};

// OTP verification step
const OTPStep = ({ phone, otp, setOtp, onSubmit, onResend, onBack, isLoading, userType }) => {
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the complete code');
      return;
    }
    setError('');
    onSubmit();
  };

  const handleResend = () => {
    setResendTimer(30);
    onResend();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${userType === 'client' ? 'bg-pink-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
          <Shield size={32} className={userType === 'client' ? 'text-pink-400' : 'text-purple-400'} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify your number</h2>
        <p className="text-white/60 text-sm">
          Enter the 6-digit code sent to +234{phone}
        </p>
      </div>

      <div className="space-y-4">
        <OTPInput value={otp} onChange={setOtp} />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="text-center">
        {resendTimer > 0 ? (
          <p className="text-white/50 text-sm">Resend code in {resendTimer}s</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-pink-400 text-sm hover:text-pink-300 transition-colors"
          >
            Resend verification code
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.length < 6}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          otp.length >= 6
            ? userType === 'client'
              ? 'bg-pink-500 hover:bg-pink-600'
              : 'bg-purple-500 hover:bg-purple-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Verifying...' : 'Verify & Continue'}
      </button>
    </form>
  );
};

// ═══════════════════════════════════════════════════════════
// CLIENT PROFILE STEPS
// ═══════════════════════════════════════════════════════════

// Client Step 1: Basic info
const ClientBasicInfoStep = ({ data, setData, onSubmit, onBack }) => {
  const [errors, setErrors] = useState({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Validate username format (lowercase letters, numbers, underscores only, 3-20 chars)
  const validateUsername = (username) => {
    if (!username) return false;
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(username);
  };

  // Simulate username availability check (in real app, this would be an API call)
  const checkUsernameAvailability = (username) => {
    if (!validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    // Simulate API delay
    setTimeout(() => {
      // In production, check against database
      // For now, just check it's not a reserved word
      const reserved = ['admin', 'hush', 'support', 'help', 'system'];
      setUsernameAvailable(!reserved.includes(username.toLowerCase()));
      setUsernameChecking(false);
    }, 300);
  };

  const handleUsernameChange = (value) => {
    // Convert to lowercase and remove invalid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setData(prev => ({ ...prev, username: sanitized }));
    checkUsernameAvailability(sanitized);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateUsername(data.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscores only)';
    } else if (usernameAvailable === false) {
      newErrors.username = 'This username is already taken';
    }

    if (data.name.trim().length < 2) {
      newErrors.name = 'Please enter your display name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit();
  };

  const isFormValid = validateUsername(data.username) && usernameAvailable && data.name.trim().length >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
          <User size={32} className="text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
        <p className="text-white/60 text-sm">
          This helps models know who they're meeting
        </p>
      </div>

      <div className="space-y-4">
        {/* Username field - unique and immutable */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
            <input
              type="text"
              placeholder="johndoe"
              value={data.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`w-full bg-white/5 border rounded-xl pl-8 pr-10 py-3 text-white placeholder-white/40 focus:outline-none ${
                errors.username ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : 'border-white/10 focus:border-pink-500'
              }`}
              maxLength={20}
            />
            {usernameChecking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-pink-500 rounded-full animate-spin" />
              </div>
            )}
            {!usernameChecking && usernameAvailable === true && (
              <CheckCircle size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
            )}
            {!usernameChecking && usernameAvailable === false && (
              <X size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
            )}
          </div>
          {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
          <p className="text-white/40 text-xs">This cannot be changed later. Letters, numbers, and underscores only.</p>
        </div>

        {/* Display Name field */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Display Name</label>
          <input
            type="text"
            placeholder="e.g. John D."
            value={data.name}
            onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none ${
              errors.name ? 'border-red-500' : 'border-white/10 focus:border-pink-500'
            }`}
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          <p className="text-white/40 text-xs">This is what models will see. You can change it later.</p>
        </div>

        <div className="space-y-2">
          <label className="text-white/70 text-sm">Preferred Location</label>
          <div className="flex gap-2">
            {LOCATIONS.map(loc => (
              <button
                key={loc.name}
                type="button"
                onClick={() => setData(prev => ({ ...prev, preferredLocation: loc.name }))}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  data.preferredLocation === loc.name
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          isFormValid
            ? 'bg-pink-500 hover:bg-pink-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </form>
  );
};

// Client Step 2: Preferences
const ClientPreferencesStep = ({ data, setData, onSubmit, onBack }) => {
  const togglePreference = (key, value) => {
    setData(prev => {
      const current = prev[key] || [];
      // If selecting "No preference", clear other selections
      if (value === 'No preference') {
        return { ...prev, [key]: ['No preference'] };
      }
      // If selecting something else, remove "No preference" if present
      const withoutNoPreference = current.filter(v => v !== 'No preference');
      const updated = withoutNoPreference.includes(value)
        ? withoutNoPreference.filter(v => v !== value)
        : [...withoutNoPreference, value];
      return { ...prev, [key]: updated };
    });
  };

  // Check if all required preferences are selected
  const hasBodyType = (data.bodyTypePreferences || []).length > 0;
  const hasSkinTone = (data.skinTonePreferences || []).length > 0;
  const hasAge = (data.agePreferences || []).length > 0;
  const hasServices = (data.servicePreferences || []).length > 0;
  const canContinue = hasBodyType && hasSkinTone && hasAge && hasServices;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
          <Heart size={32} className="text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your preferences</h2>
        <p className="text-white/60 text-sm">
          Select at least one option in each category
        </p>
      </div>

      <div className="space-y-5">
        {/* Body type preference - multi-select */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            Body Types
            {!hasBodyType && <span className="text-red-400 text-xs">*required</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPE_PREFERENCES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => togglePreference('bodyTypePreferences', type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  (data.bodyTypePreferences || []).includes(type)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {type}
                {(data.bodyTypePreferences || []).includes(type) && <X size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* Skin tone preference - multi-select */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            Skin Tones
            {!hasSkinTone && <span className="text-red-400 text-xs">*required</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONE_PREFERENCES.map(tone => (
              <button
                key={tone}
                type="button"
                onClick={() => togglePreference('skinTonePreferences', tone)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  (data.skinTonePreferences || []).includes(tone)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {tone}
                {(data.skinTonePreferences || []).includes(tone) && <X size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* Age preference - multi-select */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            Age Ranges
            {!hasAge && <span className="text-red-400 text-xs">*required</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_PREFERENCES.map(age => (
              <button
                key={age}
                type="button"
                onClick={() => togglePreference('agePreferences', age)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  (data.agePreferences || []).includes(age)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {age}
                {(data.agePreferences || []).includes(age) && <X size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* Service preferences - multi-select */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            Services you're interested in
            {!hasServices && <span className="text-red-400 text-xs">*required</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_PREFERENCES.map(service => (
              <button
                key={service}
                type="button"
                onClick={() => togglePreference('servicePreferences', service)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  (data.servicePreferences || []).includes(service)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {service}
                {(data.servicePreferences || []).includes(service) && <X size={12} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!canContinue}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          canContinue
            ? 'bg-pink-500 hover:bg-pink-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );
};

// Client Step 3: Bio
const ClientBioStep = ({ data, setData, onSubmit, onBack, isLoading }) => {
  const [error, setError] = useState('');

  // Phone number patterns to detect
  const phonePatterns = [
    /\b\d{10,11}\b/,           // 10-11 digit numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // xxx-xxx-xxxx format
    /\b0[789][01]\d{8}\b/,     // Nigerian phone format
    /\+\d{10,14}/,             // International format
    /\b234\d{10}\b/,           // Nigeria country code
  ];

  const containsPhoneNumber = (text) => {
    return phonePatterns.some(pattern => pattern.test(text));
  };

  const handleBioChange = (e) => {
    const value = e.target.value.slice(0, 150);
    if (containsPhoneNumber(value)) {
      setError('Phone numbers are not allowed in your bio');
    } else {
      setError('');
    }
    setData(prev => ({ ...prev, bio: value }));
  };

  const bioTrimmed = (data.bio || '').trim();
  const isValidBio = bioTrimmed.length >= 20 && !containsPhoneNumber(bioTrimmed);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
          <Sparkles size={32} className="text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Almost done!</h2>
        <p className="text-white/60 text-sm">
          Add a short bio to introduce yourself
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-white/70 text-sm flex items-center gap-2">
          About you <span className="text-white/40">(20-150 characters)</span>
          {bioTrimmed.length < 20 && <span className="text-red-400 text-xs">*required</span>}
        </label>
        <textarea
          placeholder="e.g. Chill guy looking for good company on weekends. Respectful and generous."
          value={data.bio || ''}
          onChange={handleBioChange}
          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none resize-none h-24 ${
            error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-pink-500'
          }`}
        />
        <div className="flex justify-between items-center">
          {error ? (
            <p className="text-red-400 text-xs">{error}</p>
          ) : bioTrimmed.length < 20 ? (
            <p className="text-white/40 text-xs">Min 20 characters ({20 - bioTrimmed.length} more needed)</p>
          ) : (
            <p className="text-green-400 text-xs">Looks good!</p>
          )}
          <p className="text-white/40 text-xs">{bioTrimmed.length}/150</p>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
        <p className="text-white/70 text-sm font-medium">Your profile summary</p>
        <div className="text-white/50 text-xs space-y-1">
          <p>Name: <span className="text-white">{data.name}</span></p>
          <p>Location: <span className="text-white">{data.preferredLocation || 'Not set'}</span></p>
          {data.bodyTypePreferences?.length > 0 && !data.bodyTypePreferences.includes('No preference') && (
            <p>Body types: <span className="text-white">{data.bodyTypePreferences.join(', ')}</span></p>
          )}
          {data.agePreferences?.length > 0 && !data.agePreferences.includes('No preference') && (
            <p>Ages: <span className="text-white">{data.agePreferences.join(', ')}</span></p>
          )}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !isValidBio}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          isValidBio
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Creating account...' : 'Complete Registration'}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// CREATOR PROFILE STEPS
// ═══════════════════════════════════════════════════════════

// Creator Step 1: Basic Info
const CreatorBasicInfoStep = ({ data, setData, onSubmit, onBack }) => {
  const [errors, setErrors] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(data.location || '');

  const locationData = LOCATIONS.find(l => l.name === selectedLocation);

  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setData(prev => ({ ...prev, location: loc, areas: [] }));
  };

  const toggleArea = (area) => {
    setData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (data.name.trim().length < 2) newErrors.name = 'Name is required';
    if (data.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!/^[a-z0-9_]+$/.test(data.username)) newErrors.username = 'Only lowercase letters, numbers, and underscores';
    if (!data.location) newErrors.location = 'Please select your location';
    if (data.areas.length === 0) newErrors.areas = 'Please select at least one area';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Crown size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create your profile</h2>
        <p className="text-white/60 text-sm">
          Let's set up your creator account
        </p>
      </div>

      <div className="space-y-4">
        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Display Name</label>
          <input
            type="text"
            placeholder="e.g. Destiny"
            value={data.name}
            onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Username</label>
          <div className="flex items-center">
            <span className="px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-xl text-white/50">@</span>
            <input
              type="text"
              placeholder="destiny_x"
              value={data.username}
              onChange={(e) => setData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Tagline</label>
          <input
            type="text"
            placeholder="e.g. Your favorite girl 💋"
            value={data.tagline || ''}
            onChange={(e) => setData(prev => ({ ...prev, tagline: e.target.value }))}
            maxLength={50}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Location</label>
          <div className="flex gap-2">
            {LOCATIONS.map(loc => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleLocationChange(loc.name)}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedLocation === loc.name
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
          {errors.location && <p className="text-red-400 text-sm">{errors.location}</p>}
        </div>

        {/* Areas */}
        {locationData && (
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Areas you cover</label>
            <div className="flex flex-wrap gap-2">
              {locationData.areas.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    data.areas.includes(area)
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            {errors.areas && <p className="text-red-400 text-sm">{errors.areas}</p>}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
      >
        Continue
      </button>
    </form>
  );
};

// Creator Step 2: Physical Attributes
const CreatorPhysicalStep = ({ data, setData, onSubmit, onBack }) => {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Ruler size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your profile details</h2>
        <p className="text-white/60 text-sm">
          Help clients find you (shown on your profile)
        </p>
      </div>

      <div className="space-y-5">
        {/* Body type */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Body Type</label>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setData(prev => ({ ...prev, bodyType: type }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  data.bodyType === type
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Skin tone */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Skin Tone</label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map(tone => (
              <button
                key={tone}
                type="button"
                onClick={() => setData(prev => ({ ...prev, skinTone: tone }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  data.skinTone === tone
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Height</label>
          <div className="flex flex-wrap gap-2">
            {HEIGHT_RANGES.map(height => (
              <button
                key={height}
                type="button"
                onClick={() => setData(prev => ({ ...prev, height: height }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  data.height === height
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {height}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Age</label>
          <input
            type="number"
            placeholder="e.g. 24"
            min="18"
            max="60"
            value={data.age || ''}
            onChange={(e) => setData(prev => ({ ...prev, age: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-semibold transition-all"
      >
        Continue
      </button>
    </div>
  );
};

// Creator Step 3: Services & Boundaries
const CreatorServicesStep = ({ data, setData, onSubmit, onBack, isLoading }) => {
  const [bioError, setBioError] = useState('');

  // Phone number patterns to detect
  const phonePatterns = [
    /\b\d{10,11}\b/,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b0[789][01]\d{8}\b/,
    /\+\d{10,14}/,
    /\b234\d{10}\b/,
  ];

  const containsPhoneNumber = (text) => {
    return phonePatterns.some(pattern => pattern.test(text));
  };

  const toggleService = (serviceId) => {
    setData(prev => {
      const current = prev.services || [];
      const updated = current.includes(serviceId)
        ? current.filter(s => s !== serviceId)
        : [...current, serviceId];
      return { ...prev, services: updated };
    });
  };

  const toggleBoundary = (boundary) => {
    setData(prev => {
      const current = prev.boundaries || [];
      const updated = current.includes(boundary)
        ? current.filter(b => b !== boundary)
        : [...current, boundary];
      return { ...prev, boundaries: updated };
    });
  };

  const handleBioChange = (e) => {
    const value = e.target.value.slice(0, 200);
    if (containsPhoneNumber(value)) {
      setBioError('Phone numbers are not allowed in your bio');
    } else {
      setBioError('');
    }
    setData(prev => ({ ...prev, bio: value }));
  };

  const bioTrimmed = (data.bio || '').trim();
  const isValidBio = bioTrimmed.length >= 30 && !containsPhoneNumber(bioTrimmed);
  const hasServices = (data.services || []).length > 0;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Star size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Services & Boundaries</h2>
        <p className="text-white/60 text-sm">
          What do you offer? What are your limits?
        </p>
      </div>

      <div className="space-y-5">
        {/* Services offered */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Services you offer</label>
          <div className="space-y-2">
            {SERVICES_OFFERED.map(service => (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  (data.services || []).includes(service.id)
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  (data.services || []).includes(service.id)
                    ? 'border-purple-400 bg-purple-500'
                    : 'border-white/30'
                }`}>
                  {(data.services || []).includes(service.id) && (
                    <CheckCircle size={12} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{service.name}</p>
                  <p className="text-white/50 text-xs">{service.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Boundaries */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            <Ban size={14} className="text-red-400" />
            Your boundaries (the "Nope" list)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_BOUNDARIES.map(boundary => (
              <button
                key={boundary}
                type="button"
                onClick={() => toggleBoundary(boundary)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  (data.boundaries || []).includes(boundary)
                    ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {boundary}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm flex items-center gap-2">
            Bio <span className="text-white/40">(30-200 characters)</span>
            {bioTrimmed.length < 30 && <span className="text-red-400 text-xs">*required</span>}
          </label>
          <textarea
            placeholder="Tell clients about yourself..."
            value={data.bio || ''}
            onChange={handleBioChange}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none resize-none h-24 ${
              bioError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500'
            }`}
          />
          <div className="flex justify-between items-center">
            {bioError ? (
              <p className="text-red-400 text-xs">{bioError}</p>
            ) : bioTrimmed.length < 30 ? (
              <p className="text-white/40 text-xs">Min 30 characters ({30 - bioTrimmed.length} more needed)</p>
            ) : (
              <p className="text-green-400 text-xs">Looks good!</p>
            )}
            <p className="text-white/40 text-xs">{bioTrimmed.length}/200</p>
          </div>
        </div>
      </div>

      {/* Next steps info */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
        <p className="text-purple-300 text-sm font-medium mb-2">Next steps after registration:</p>
        <div className="space-y-2 text-purple-300/70 text-xs">
          <div className="flex items-center gap-2">
            <Video size={14} />
            <span>Complete video verification with our team</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera size={14} />
            <span>Schedule a studio photo session</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} />
            <span>Set your pricing and availability</span>
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !isValidBio || !hasServices}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          isValidBio && hasServices
            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Creating account...' : 'Complete Registration'}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN AUTH PAGE
// ═══════════════════════════════════════════════════════════

export default function AuthPage() {
  const navigate = useNavigate();
  const { registerClient, registerCreator, isAuthenticated } = useAuth();

  // Step: age, select, login-phone, login-otp, phone, otp, profile1, profile2, profile3
  const [step, setStep] = useState('age');
  const [userType, setUserType] = useState(null);
  const [isLoginFlow, setIsLoginFlow] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client data
  const [clientData, setClientData] = useState({
    username: '', // Unique, immutable
    name: '', // Display name
    preferredLocation: '',
    bodyTypePreferences: [],
    skinTonePreferences: [],
    agePreferences: [],
    servicePreferences: [],
    bio: '',
  });

  // Creator data
  const [creatorData, setCreatorData] = useState({
    name: '',
    username: '',
    tagline: '',
    location: '',
    areas: [],
    bodyType: '',
    skinTone: '',
    height: '',
    age: '',
    services: [],
    boundaries: [],
    bio: '',
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/explore/all');
    }
  }, [isAuthenticated, navigate]);

  // Handle age verification
  const handleAgeVerified = () => {
    // Also set in sessionStorage so they don't see it again on other pages
    sessionStorage.setItem('hush_age_verified', 'true');
    setStep('select');
  };

  const handleAgeExit = () => {
    window.location.href = 'https://google.com';
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setIsLoginFlow(false);
    setStep('phone');
  };

  const handleLoginClick = () => {
    setIsLoginFlow(true);
    setStep('login-phone');
  };

  const handleLoginPhoneSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('login-otp');
    }, 1000);
  };

  const handleLoginOTPSubmit = () => {
    setIsLoading(true);
    // In a real app, this would verify OTP and load user data from backend
    // For now, we'll simulate a successful login by checking localStorage
    setTimeout(() => {
      const stored = localStorage.getItem('hush_auth');
      if (stored) {
        const userData = JSON.parse(stored);
        // User data already in localStorage, just redirect
        setIsLoading(false);
        if (userData.userType === 'creator') {
          navigate('/creator-dashboard');
        } else {
          navigate('/explore/all');
        }
      } else {
        // No account found - redirect to registration
        setIsLoading(false);
        setStep('select');
      }
    }, 1000);
  };

  const handlePhoneSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOTPSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('profile1');
    }, 1000);
  };

  const handleResendOTP = () => {
    console.log('Resending OTP to', phone);
  };

  // Client flow handlers
  const handleClientProfile1Submit = () => {
    setStep('profile2');
  };

  const handleClientProfile2Submit = () => {
    setStep('profile3');
  };

  const handleClientProfileComplete = () => {
    setIsLoading(true);
    setTimeout(() => {
      registerClient({
        phone,
        username: clientData.username,
        name: clientData.name,
        preferences: {
          location: clientData.preferredLocation,
          bodyTypes: clientData.bodyTypePreferences,
          skinTones: clientData.skinTonePreferences,
          ages: clientData.agePreferences,
          services: clientData.servicePreferences,
        },
        bio: clientData.bio,
      });
      setIsLoading(false);
      navigate('/explore/all');
    }, 500);
  };

  // Creator flow handlers
  const handleCreatorProfile1Submit = () => {
    setStep('profile2');
  };

  const handleCreatorProfile2Submit = () => {
    setStep('profile3');
  };

  const handleCreatorProfileComplete = () => {
    setIsLoading(true);
    setTimeout(() => {
      registerCreator({
        phone,
        name: creatorData.name,
        username: creatorData.username,
        tagline: creatorData.tagline,
        location: creatorData.location,
        areas: creatorData.areas,
        physicalAttributes: {
          bodyType: creatorData.bodyType,
          skinTone: creatorData.skinTone,
          height: creatorData.height,
          age: creatorData.age,
        },
        services: creatorData.services,
        boundaries: creatorData.boundaries,
        bio: creatorData.bio,
      });
      setIsLoading(false);
      navigate('/creator-dashboard');
    }, 500);
  };

  // Calculate steps
  const totalSteps = userType === 'creator' ? 6 : 5; // age, phone, otp, profile1, profile2, profile3
  const getStepNumber = () => {
    switch (step) {
      case 'phone': return 1;
      case 'otp': return 2;
      case 'profile1': return 3;
      case 'profile2': return 4;
      case 'profile3': return 5;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">{PLATFORM_CONFIG.name}</h1>
            <p className="text-white/40 text-sm mt-1">18+ Only • Anti-Catfish Platform</p>
          </div>

          {/* Step indicator */}
          {step !== 'age' && step !== 'select' && !step.startsWith('login') && (
            <StepIndicator currentStep={getStepNumber()} totalSteps={totalSteps} />
          )}

          {/* Content */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {/* Age verification */}
            {step === 'age' && (
              <AgeVerificationStep
                onConfirm={handleAgeVerified}
                onExit={handleAgeExit}
              />
            )}

            {/* User type selection */}
            {step === 'select' && (
              <UserTypeSelection onSelect={handleUserTypeSelect} onLogin={handleLoginClick} />
            )}

            {/* Login phone step */}
            {step === 'login-phone' && (
              <LoginPhoneStep
                phone={phone}
                setPhone={setPhone}
                onSubmit={handleLoginPhoneSubmit}
                onBack={() => setStep('select')}
                isLoading={isLoading}
              />
            )}

            {/* Login OTP step */}
            {step === 'login-otp' && (
              <OTPStep
                phone={phone}
                otp={otp}
                setOtp={setOtp}
                onSubmit={handleLoginOTPSubmit}
                onResend={handleResendOTP}
                onBack={() => setStep('login-phone')}
                isLoading={isLoading}
                userType="client"
              />
            )}

            {/* Registration Phone step */}
            {step === 'phone' && (
              <PhoneStep
                phone={phone}
                setPhone={setPhone}
                onSubmit={handlePhoneSubmit}
                onBack={() => setStep('select')}
                isLoading={isLoading}
                userType={userType}
              />
            )}

            {/* Registration OTP step */}
            {step === 'otp' && (
              <OTPStep
                phone={phone}
                otp={otp}
                setOtp={setOtp}
                onSubmit={handleOTPSubmit}
                onResend={handleResendOTP}
                onBack={() => setStep('phone')}
                isLoading={isLoading}
                userType={userType}
              />
            )}

            {/* Client profile steps */}
            {step === 'profile1' && userType === 'client' && (
              <ClientBasicInfoStep
                data={clientData}
                setData={setClientData}
                onSubmit={handleClientProfile1Submit}
                onBack={() => setStep('otp')}
              />
            )}

            {step === 'profile2' && userType === 'client' && (
              <ClientPreferencesStep
                data={clientData}
                setData={setClientData}
                onSubmit={handleClientProfile2Submit}
                onBack={() => setStep('profile1')}
              />
            )}

            {step === 'profile3' && userType === 'client' && (
              <ClientBioStep
                data={clientData}
                setData={setClientData}
                onSubmit={handleClientProfileComplete}
                onBack={() => setStep('profile2')}
                isLoading={isLoading}
              />
            )}

            {/* Creator profile steps */}
            {step === 'profile1' && userType === 'creator' && (
              <CreatorBasicInfoStep
                data={creatorData}
                setData={setCreatorData}
                onSubmit={handleCreatorProfile1Submit}
                onBack={() => setStep('otp')}
              />
            )}

            {step === 'profile2' && userType === 'creator' && (
              <CreatorPhysicalStep
                data={creatorData}
                setData={setCreatorData}
                onSubmit={handleCreatorProfile2Submit}
                onBack={() => setStep('profile1')}
              />
            )}

            {step === 'profile3' && userType === 'creator' && (
              <CreatorServicesStep
                data={creatorData}
                setData={setCreatorData}
                onSubmit={handleCreatorProfileComplete}
                onBack={() => setStep('profile2')}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-8">
            By registering, you confirm you are 18+ and agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
