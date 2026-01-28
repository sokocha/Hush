// ═══════════════════════════════════════════════════════════
// PLATFORM CONFIGURATION
// ═══════════════════════════════════════════════════════════

export const PLATFORM_CONFIG = {
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
};

// ═══════════════════════════════════════════════════════════
// MODELS DATABASE (Empty - all creators now come from database)
// ═══════════════════════════════════════════════════════════

export const MODELS = {};

// Helper to get model list for explore page
export const getModelsList = () => {
  return Object.values(MODELS).map(model => ({
    id: model.profile.username,
    name: model.profile.name,
    username: model.profile.username,
    location: model.profile.location,
    areas: model.profile.areas,
    rating: model.stats.rating,
    reviews: model.stats.reviews,
    meetupSuccessRate: model.stats.meetupSuccessRate,
    verifiedMeetups: model.stats.verifiedMeetups,
    isOnline: model.profile.isOnline,
    isAvailable: model.profile.isAvailable,
    isVideoVerified: model.profile.isVideoVerified,
    isStudioVerified: model.photos.source === 'studio',
    startingPrice: model.pricing.meetupIncall[1],
    tagline: model.profile.tagline,
    extras: model.extras.map(e => e.name),
    hasOutcall: model.pricing.meetupOutcall !== null,
    // Attributes for matching
    bodyType: model.attributes?.bodyType || null,
    skinTone: model.attributes?.skinTone || null,
    age: model.attributes?.age || null,
    height: model.attributes?.height || null,
    services: model.attributes?.services || [],
    favoriteCount: model.stats.favoriteCount || 0,
  }));
};

// Helper to get all unique extras across all models
export const getAllExtras = () => {
  const extrasSet = new Set();
  Object.values(MODELS).forEach(model => {
    model.extras.forEach(extra => extrasSet.add(extra.name));
  });
  return Array.from(extrasSet).sort();
};

// Helper to get model by username
export const getModelByUsername = (username) => {
  return MODELS[username] || null;
};

// Get all unique locations
export const getLocations = () => {
  const locations = new Set(Object.values(MODELS).map(m => m.profile.location));
  return Array.from(locations);
};
