import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'hush_auth';

// Default states for different user types
const DEFAULT_CLIENT_STATE = {
  isLoggedIn: true,
  userType: 'client',
  isNewMember: true,
  hasPaidTrustDeposit: false,
  tier: null,
  depositBalance: 0,
  successfulMeetups: 0,
  meetupSuccessRate: null,
  monthsOnPlatform: 0,
  isTrustedMember: false,
  phone: '',
  name: '',
  registeredAt: null,
  // Meetup bookings array
  meetups: [], // Array of { id, creatorUsername, creatorName, date, time, locationType, location, duration, specialRequests, totalPrice, clientCode, status: 'pending'|'confirmed'|'declined'|'rescheduled'|'completed'|'cancelled', createdAt, statusUpdatedAt }
};

const DEFAULT_CREATOR_STATE = {
  isLoggedIn: true,
  userType: 'creator',
  isVerified: false,
  isVideoVerified: false,
  isStudioVerified: false,
  phone: '',
  name: '',
  username: '',
  location: '',
  areas: [],
  tagline: '',
  bio: '',
  pricing: {
    unlockContact: 0,
    unlockPhotos: 0,
    meetupIncall: { 1: 0, 2: 0, overnight: 0 },
    meetupOutcall: { 1: 0, 2: 0, overnight: 0 },
    depositPercent: 0.5,
  },
  photos: [], // Array of { id, url, blob, capturedAt, isPreview }
  extras: [],
  boundaries: [],
  stats: {
    rating: 0,
    reviews: 0,
    verifiedMeetups: 0,
    meetupSuccessRate: 0,
    repeatClients: 0,
    profileViews: 0,
  },
  registeredAt: null,
  pendingVerification: true,
  // Availability schedule - hours when creator is active (24hr format)
  schedule: {
    monday: { active: true, start: '10:00', end: '22:00' },
    tuesday: { active: true, start: '10:00', end: '22:00' },
    wednesday: { active: true, start: '10:00', end: '22:00' },
    thursday: { active: true, start: '10:00', end: '22:00' },
    friday: { active: true, start: '10:00', end: '23:00' },
    saturday: { active: true, start: '12:00', end: '23:00' },
    sunday: { active: false, start: '12:00', end: '20:00' },
  },
  // Booking requests from clients
  bookingRequests: [], // Array of { id, clientPhone, clientName, date, time, locationType, location, duration, specialRequests, totalPrice, depositAmount, clientCode, status, createdAt }
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      console.error('Failed to load auth state:', e);
    }
    setIsLoading(false);
  }, []);

  // Save auth state to localStorage when it changes
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Failed to save auth state:', e);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Register as client
  const registerClient = (data) => {
    const newUser = {
      ...DEFAULT_CLIENT_STATE,
      phone: data.phone,
      name: data.name,
      registeredAt: new Date().toISOString(),
    };
    setUser(newUser);
    return newUser;
  };

  // Register as creator
  const registerCreator = (data) => {
    const newUser = {
      ...DEFAULT_CREATOR_STATE,
      phone: data.phone,
      name: data.name,
      username: data.username,
      location: data.location,
      areas: data.areas || [],
      tagline: data.tagline || '',
      bio: data.bio || '',
      registeredAt: new Date().toISOString(),
    };
    setUser(newUser);
    return newUser;
  };

  // Update user state
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  // Update client tier after deposit
  const updateTier = (tier, depositAmount) => {
    setUser(prev => {
      if (!prev || prev.userType !== 'client') return prev;
      return {
        ...prev,
        tier,
        hasPaidTrustDeposit: true,
        depositBalance: depositAmount,
      };
    });
  };

  // Deduct from balance
  const deductBalance = (amount) => {
    setUser(prev => {
      if (!prev || prev.userType !== 'client') return prev;
      return {
        ...prev,
        depositBalance: Math.max(0, prev.depositBalance - amount),
      };
    });
  };

  // Record successful meetup (increment counter)
  const recordMeetup = () => {
    setUser(prev => {
      if (!prev || prev.userType !== 'client') return prev;
      const newMeetups = prev.successfulMeetups + 1;
      return {
        ...prev,
        successfulMeetups: newMeetups,
        isNewMember: false,
        isTrustedMember: newMeetups >= 3,
      };
    });
  };

  // Add a new meetup booking (for clients)
  const addMeetupBooking = (meetupData) => {
    setUser(prev => {
      if (!prev || prev.userType !== 'client') return prev;
      const newMeetup = {
        id: Date.now().toString(),
        ...meetupData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        statusUpdatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        meetups: [...(prev.meetups || []), newMeetup],
      };
    });
  };

  // Update meetup status (for clients)
  const updateMeetupStatus = (meetupId, status) => {
    setUser(prev => {
      if (!prev || prev.userType !== 'client') return prev;
      return {
        ...prev,
        meetups: (prev.meetups || []).map(m =>
          m.id === meetupId
            ? { ...m, status, statusUpdatedAt: new Date().toISOString() }
            : m
        ),
      };
    });
  };

  // Cancel a meetup (for clients)
  const cancelMeetup = (meetupId) => {
    updateMeetupStatus(meetupId, 'cancelled');
  };

  // Logout
  const logout = () => {
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && user.isLoggedIn;

  // Check user type
  const isClient = user?.userType === 'client';
  const isCreator = user?.userType === 'creator';

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isClient,
    isCreator,
    registerClient,
    registerCreator,
    updateUser,
    updateTier,
    deductBalance,
    recordMeetup,
    addMeetupBooking,
    updateMeetupStatus,
    cancelMeetup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
