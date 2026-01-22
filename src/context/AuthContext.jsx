import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { creatorService } from '../services/creatorService';
import { bookingService } from '../services/bookingService';

const AUTH_STORAGE_KEY = 'hush_auth';
const TOKEN_STORAGE_KEY = 'hush_token';

// Default states for different user types (used for local state structure)
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
  username: '',
  name: '',
  registeredAt: null,
  meetups: [],
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
  photos: [],
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
  schedule: {
    monday: { active: true, start: '10:00', end: '22:00' },
    tuesday: { active: true, start: '10:00', end: '22:00' },
    wednesday: { active: true, start: '10:00', end: '22:00' },
    thursday: { active: true, start: '10:00', end: '22:00' },
    friday: { active: true, start: '10:00', end: '23:00' },
    saturday: { active: true, start: '12:00', end: '23:00' },
    sunday: { active: false, start: '12:00', end: '20:00' },
  },
  bookingRequests: [],
  isVisibleInExplore: false,
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Transform Supabase user data to local state format
 */
function transformUserData(dbUser) {
  if (!dbUser) return null;

  const baseUser = {
    id: dbUser.id,
    phone: dbUser.phone,
    username: dbUser.username,
    name: dbUser.name,
    userType: dbUser.user_type,
    isLoggedIn: true,
    registeredAt: dbUser.created_at,
    lastSeenAt: dbUser.last_seen_at,
  };

  if (dbUser.user_type === 'client' && dbUser.clients) {
    const client = dbUser.clients;
    return {
      ...DEFAULT_CLIENT_STATE,
      ...baseUser,
      isNewMember: client.is_new_member,
      hasPaidTrustDeposit: client.has_paid_trust_deposit,
      tier: client.tier,
      depositBalance: parseFloat(client.deposit_balance) || 0,
      successfulMeetups: client.successful_meetups || 0,
      meetupSuccessRate: client.meetup_success_rate,
      monthsOnPlatform: client.months_on_platform || 0,
      isTrustedMember: client.is_trusted_member,
    };
  }

  if (dbUser.user_type === 'creator' && dbUser.creators) {
    const creator = dbUser.creators;
    return {
      ...DEFAULT_CREATOR_STATE,
      ...baseUser,
      location: creator.location || '',
      tagline: creator.tagline || '',
      bio: creator.bio || '',
      isVerified: creator.is_verified,
      isVideoVerified: creator.is_video_verified,
      isStudioVerified: creator.is_studio_verified,
      pendingVerification: creator.pending_verification,
      isVisibleInExplore: creator.is_visible_in_explore,
      pricing: creator.pricing || DEFAULT_CREATOR_STATE.pricing,
      schedule: creator.schedule || DEFAULT_CREATOR_STATE.schedule,
      areas: creator.creator_areas?.map((a) => a.area) || [],
      photos: creator.creator_photos?.map((p) => ({
        id: p.id,
        url: p.storage_path, // Will be transformed to full URL by storage service
        storagePath: p.storage_path,
        isPreview: p.is_preview,
        capturedAt: p.captured_at,
      })) || [],
      extras: creator.creator_extras?.map((e) => ({
        id: e.id,
        name: e.name,
        price: parseFloat(e.price),
      })) || [],
      boundaries: creator.creator_boundaries?.map((b) => b.boundary) || [],
      stats: {
        rating: parseFloat(creator.rating) || 0,
        reviews: creator.reviews_count || 0,
        verifiedMeetups: creator.verified_meetups || 0,
        meetupSuccessRate: parseFloat(creator.meetup_success_rate) || 0,
        profileViews: creator.profile_views || 0,
      },
    };
  }

  return baseUser;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

        // Allow login without token (for mock OTP mode)
        if (storedUser) {
          if (storedToken) {
            setAuthToken(storedToken);
          }
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          // Refresh user data from server in background
          if (parsed.id) {
            authService.getCurrentUser(parsed.id).then((result) => {
              if (result.success && result.user) {
                const transformedUser = transformUserData(result.user);
                setUser(transformedUser);
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(transformedUser));
              }
            });

            // Update last seen
            authService.updateLastSeen(parsed.id);
          }
        }
      } catch (e) {
        console.error('Failed to load auth state:', e);
      }
      setIsLoading(false);
    };

    loadAuthState();
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
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [user]);

  // Request OTP
  const requestOTP = useCallback(async (phone) => {
    const result = await authService.requestOTP(phone);
    return result;
  }, []);

  // Verify OTP
  const verifyOTP = useCallback(async (phone, code) => {
    const result = await authService.verifyOTP(phone, code);
    if (result.success) {
      setAuthToken(result.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);

      if (!result.isNewUser && result.user) {
        const transformedUser = transformUserData(result.user);
        setUser(transformedUser);
      }
    }
    return result;
  }, []);

  // Check username availability
  const checkUsername = useCallback(async (username) => {
    return authService.checkUsernameAvailable(username);
  }, []);

  // Get user by phone (for login)
  const getUserByPhone = useCallback(async (phone) => {
    const result = await authService.getUserByPhone(phone);
    if (result.success && result.exists && result.user) {
      const transformedUser = transformUserData(result.user);
      setUser(transformedUser);
      return { success: true, exists: true, user: transformedUser };
    }
    return result;
  }, []);

  // Register as client
  const registerClient = useCallback(async (data) => {
    const result = await authService.registerClient(data);
    if (result.success) {
      const transformedUser = transformUserData(result.user);
      setUser(transformedUser);
    }
    return result;
  }, []);

  // Register as creator
  const registerCreator = useCallback(async (data) => {
    const result = await authService.registerCreator(data);
    if (result.success) {
      const transformedUser = transformUserData(result.user);
      setUser(transformedUser);
    }
    return result;
  }, []);

  // Update user state locally and optionally sync to server
  const updateUser = useCallback(
    async (updates, syncToServer = true) => {
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });

      if (syncToServer && user?.id) {
        if (user.userType === 'client') {
          await userService.updateClientProfile(user.id, updates);
        } else if (user.userType === 'creator') {
          await creatorService.updateCreatorProfile(user.id, updates);
        }
      }
    },
    [user?.id, user?.userType]
  );

  // Update client tier after deposit
  const updateTier = useCallback(
    async (tier, depositAmount) => {
      if (!user?.id || user.userType !== 'client') return;

      const result = await userService.updateClientTier(user.id, tier, depositAmount);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          tier,
          hasPaidTrustDeposit: true,
          depositBalance: depositAmount,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Deduct from balance
  const deductBalance = useCallback(
    async (amount) => {
      if (!user?.id || user.userType !== 'client') return;

      const result = await userService.deductClientBalance(user.id, amount);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          depositBalance: result.newBalance,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Record successful meetup (increment counter)
  const recordMeetup = useCallback(async () => {
    if (!user?.id || user.userType !== 'client') return;

    const result = await userService.recordClientMeetup(user.id);
    if (result.success) {
      setUser((prev) => ({
        ...prev,
        successfulMeetups: result.client.successful_meetups,
        isNewMember: false,
        isTrustedMember: result.client.is_trusted_member,
      }));
    }
    return result;
  }, [user?.id, user?.userType]);

  // Add a new meetup booking (for clients)
  const addMeetupBooking = useCallback(
    async (meetupData) => {
      if (!user?.id || user.userType !== 'client') return;

      const result = await bookingService.createBooking({
        clientId: user.id,
        ...meetupData,
      });

      if (result.success) {
        setUser((prev) => ({
          ...prev,
          meetups: [...(prev.meetups || []), result.booking],
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Update meetup status (for clients)
  const updateMeetupStatus = useCallback(
    async (meetupId, status) => {
      const result = await bookingService.updateBookingStatus(meetupId, status);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          meetups: (prev.meetups || []).map((m) =>
            m.id === meetupId ? { ...m, status, statusUpdatedAt: new Date().toISOString() } : m
          ),
        }));
      }
      return result;
    },
    []
  );

  // Cancel a meetup (for clients)
  const cancelMeetup = useCallback(
    async (meetupId) => {
      return updateMeetupStatus(meetupId, 'cancelled');
    },
    [updateMeetupStatus]
  );

  // Add a booking request (for creators - when client books them)
  const addBookingRequest = useCallback((bookingData) => {
    // This is called when receiving a new booking notification
    setUser((prev) => {
      if (!prev || prev.userType !== 'creator') return prev;
      return {
        ...prev,
        bookingRequests: [...(prev.bookingRequests || []), bookingData],
      };
    });
  }, []);

  // Update booking request status (for creators)
  const updateBookingRequestStatus = useCallback(
    async (bookingId, status, note = '') => {
      const result = await bookingService.updateBookingStatus(bookingId, status, note);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          bookingRequests: (prev.bookingRequests || []).map((b) =>
            b.id === bookingId
              ? { ...b, status, statusNote: note, statusUpdatedAt: new Date().toISOString() }
              : b
          ),
        }));
      }
      return result;
    },
    []
  );

  // Record earnings for a completed booking (for creators)
  const recordCreatorEarnings = useCallback(
    async (amount, bookingId) => {
      if (!user?.id || user.userType !== 'creator') return;

      const result = await bookingService.completeBooking(bookingId, user.id);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          earnings: [
            ...(prev.earnings || []),
            {
              id: Date.now().toString(),
              amount,
              bookingId,
              date: new Date().toISOString(),
            },
          ],
          stats: {
            ...prev.stats,
            verifiedMeetups: (prev.stats?.verifiedMeetups || 0) + 1,
          },
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Update creator schedule
  const updateSchedule = useCallback(
    async (schedule) => {
      if (!user?.id || user.userType !== 'creator') return;

      const result = await creatorService.updateCreatorSchedule(user.id, schedule);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          schedule,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Update creator pricing
  const updatePricing = useCallback(
    async (pricing) => {
      if (!user?.id || user.userType !== 'creator') return;

      const result = await creatorService.updateCreatorPricing(user.id, pricing);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          pricing,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Update creator areas
  const updateAreas = useCallback(
    async (areas) => {
      if (!user?.id || user.userType !== 'creator') return;

      const result = await creatorService.updateCreatorAreas(user.id, areas);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          areas,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Toggle explore visibility
  const toggleExploreVisibility = useCallback(
    async (isVisible) => {
      if (!user?.id || user.userType !== 'creator') return;

      const result = await creatorService.toggleExploreVisibility(user.id, isVisible);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          isVisibleInExplore: isVisible,
        }));
      }
      return result;
    },
    [user?.id, user?.userType]
  );

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;

    const result = await authService.getCurrentUser(user.id);
    if (result.success && result.user) {
      const transformedUser = transformUserData(result.user);
      setUser(transformedUser);
    }
    return result;
  }, [user?.id]);

  // Logout
  const logout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  // Check if user is authenticated
  const isAuthenticated = !!user && user.isLoggedIn;

  // Check user type
  const isClient = user?.userType === 'client';
  const isCreator = user?.userType === 'creator';

  const value = {
    user,
    authToken,
    isLoading,
    isAuthenticated,
    isClient,
    isCreator,
    // Auth methods
    requestOTP,
    verifyOTP,
    checkUsername,
    getUserByPhone,
    registerClient,
    registerCreator,
    logout,
    refreshUser,
    // User methods
    updateUser,
    updateTier,
    deductBalance,
    recordMeetup,
    // Booking methods
    addMeetupBooking,
    updateMeetupStatus,
    cancelMeetup,
    // Creator methods
    addBookingRequest,
    updateBookingRequestStatus,
    recordCreatorEarnings,
    updateSchedule,
    updatePricing,
    updateAreas,
    toggleExploreVisibility,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
