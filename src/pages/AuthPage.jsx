import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, User, Shield, ChevronRight, CheckCircle,
  MapPin, Camera, Video, Sparkles, Crown, Heart,
  ArrowLeft, Eye, EyeOff, Wallet, Users, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLATFORM_CONFIG } from '../data/models';

const LOCATIONS = [
  { name: "Lagos", areas: ["Lekki", "VI", "Ikoyi", "Ajah", "Ikeja", "GRA", "Maryland"] },
  { name: "Abuja", areas: ["Maitama", "Wuse", "Asokoro", "Garki", "Jabi"] },
  { name: "Port Harcourt", areas: ["GRA", "Trans Amadi", "Rumuola", "Eleme"] },
];

const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

// OTP Input component
const OTPInput = ({ value, onChange, length = 6 }) => {
  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return;
    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join(''));

    // Auto-focus next input
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

// User type selection
const UserTypeSelection = ({ onSelect }) => (
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

    {/* Trust features */}
    <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
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

// Client profile step
const ClientProfileStep = ({ name, setName, onSubmit, onBack, isLoading }) => {
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter your name');
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
          <User size={32} className="text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create your profile</h2>
        <p className="text-white/60 text-sm">
          This name will be shown to models when you book
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-white/70 text-sm">Display Name</label>
        <input
          type="text"
          placeholder="e.g. John D."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-white/40 text-xs">
          You can use a nickname or first name + initial for privacy
        </p>
      </div>

      {/* Verification tiers preview */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-white/70 text-sm font-medium mb-3">Verification Tiers</p>
        <div className="space-y-2">
          {Object.values(PLATFORM_CONFIG.verificationTiers).map(tier => {
            const tierColors = {
              visitor: "text-gray-400",
              verified: "text-blue-400",
              baller: "text-purple-400",
              bossman: "text-amber-400",
            };
            return (
              <div key={tier.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={tierColors[tier.id]}>{tier.name}</span>
                  <span className="text-white/30 text-xs">"{tier.tagline}"</span>
                </div>
                <span className="text-white font-medium">{formatNaira(tier.deposit)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-white/40 text-xs mt-2">
          You'll choose your tier after registration
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || name.trim().length < 2}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          name.trim().length >= 2
            ? 'bg-pink-500 hover:bg-pink-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Creating account...' : 'Complete Registration'}
      </button>
    </form>
  );
};

// Creator profile step
const CreatorProfileStep = ({ data, setData, onSubmit, onBack, isLoading }) => {
  const [errors, setErrors] = useState({});
  const [selectedLocation, setSelectedLocation] = useState('');

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
    if (!/^[a-z0-9_]+$/.test(data.username)) newErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
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
        <h2 className="text-2xl font-bold text-white mb-2">Create your creator profile</h2>
        <p className="text-white/60 text-sm">
          Set up your profile to start receiving bookings
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

        {/* Tagline */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm">Tagline (optional)</label>
          <input
            type="text"
            placeholder="e.g. Your favorite girl"
            value={data.tagline}
            onChange={(e) => setData(prev => ({ ...prev, tagline: e.target.value }))}
            maxLength={50}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Verification info */}
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
            <Star size={14} />
            <span>Set your pricing and availability</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
          !isLoading
            ? 'bg-purple-500 hover:bg-purple-600'
            : 'bg-white/20 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Creating account...' : 'Complete Registration'}
      </button>
    </form>
  );
};

// Main Auth Page
export default function AuthPage() {
  const navigate = useNavigate();
  const { registerClient, registerCreator, isAuthenticated } = useAuth();

  const [step, setStep] = useState('select'); // select, phone, otp, profile
  const [userType, setUserType] = useState(null); // client, creator
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client data
  const [clientName, setClientName] = useState('');

  // Creator data
  const [creatorData, setCreatorData] = useState({
    name: '',
    username: '',
    location: '',
    areas: [],
    tagline: '',
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/explore/all');
    }
  }, [isAuthenticated, navigate]);

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOTPSubmit = () => {
    setIsLoading(true);
    // Simulate OTP verification (in real app, this would verify with backend)
    setTimeout(() => {
      setIsLoading(false);
      // For demo, accept any 6-digit code
      setStep('profile');
    }, 1000);
  };

  const handleResendOTP = () => {
    // Simulate resending OTP
    console.log('Resending OTP to', phone);
  };

  const handleClientProfileSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      registerClient({
        phone,
        name: clientName,
      });
      setIsLoading(false);
      navigate('/explore/all');
    }, 500);
  };

  const handleCreatorProfileSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      registerCreator({
        phone,
        ...creatorData,
      });
      setIsLoading(false);
      navigate('/dashboard'); // Redirect to creator dashboard
    }, 500);
  };

  const totalSteps = userType === 'creator' ? 4 : 3;
  const currentStepNumber = step === 'phone' ? 1 : step === 'otp' ? 2 : step === 'profile' ? 3 : 0;

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
          {step !== 'select' && (
            <StepIndicator currentStep={currentStepNumber} totalSteps={totalSteps} />
          )}

          {/* Content */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {step === 'select' && (
              <UserTypeSelection onSelect={handleUserTypeSelect} />
            )}

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

            {step === 'profile' && userType === 'client' && (
              <ClientProfileStep
                name={clientName}
                setName={setClientName}
                onSubmit={handleClientProfileSubmit}
                onBack={() => setStep('otp')}
                isLoading={isLoading}
              />
            )}

            {step === 'profile' && userType === 'creator' && (
              <CreatorProfileStep
                data={creatorData}
                setData={setCreatorData}
                onSubmit={handleCreatorProfileSubmit}
                onBack={() => setStep('otp')}
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
