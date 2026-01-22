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
// MODELS DATABASE
// ═══════════════════════════════════════════════════════════

export const MODELS = {
  destiny_x: {
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
    attributes: {
      bodyType: "slim",
      skinTone: "caramel",
      age: 24,
      height: "5'6\"",
      services: ["GFE", "Duo"],
    },
    stats: {
      rating: 4.8,
      reviews: 23,
      verifiedMeetups: 47,
      meetupSuccessRate: 89,
      repeatClients: 12,
      lastSeen: "2h ago",
      favoriteCount: 156,
    },
    reviewHighlights: ["Professional", "On time", "As pictured"],
    creatorPayments: [
      { provider: "OPay", number: "8012345678", isPrimary: true },
      { provider: "PalmPay", number: "8012345678", isPrimary: false },
    ],
    contact: {
      whatsapp: "2348012345678",
    },
    pricing: {
      unlockContact: 1000,
      unlockPhotos: 5000,
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
    schedule: {
      monday: { active: true, start: '14:00', end: '23:00' },
      tuesday: { active: true, start: '14:00', end: '23:00' },
      wednesday: { active: true, start: '14:00', end: '23:00' },
      thursday: { active: true, start: '14:00', end: '23:00' },
      friday: { active: true, start: '12:00', end: '02:00' },
      saturday: { active: true, start: '12:00', end: '02:00' },
      sunday: { active: false, start: '00:00', end: '00:00' },
    },
  },

  bella_luxe: {
    profile: {
      name: "Bella",
      username: "bella_luxe",
      tagline: "Premium experience only ✨",
      bio: "High-end companion • Selective bookings",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Dec 2024",
      location: "Lagos",
      areas: ["Lekki", "Ajah"],
      isAvailable: true,
      isOnline: true,
      memberSince: "November 2023",
    },
    attributes: {
      bodyType: "curvy",
      skinTone: "dark",
      age: 26,
      height: "5'7\"",
      services: ["GFE", "Duo", "Travel companion"],
    },
    stats: {
      rating: 4.9,
      reviews: 45,
      verifiedMeetups: 89,
      meetupSuccessRate: 95,
      repeatClients: 28,
      lastSeen: "Online",
      favoriteCount: 342,
    },
    reviewHighlights: ["Classy", "Worth it", "Stunning"],
    creatorPayments: [
      { provider: "OPay", number: "8023456789", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348023456789",
    },
    pricing: {
      unlockContact: 2000,
      unlockPhotos: 8000,
      meetupIncall: { 1: 60000, 2: 100000, overnight: 200000 },
      meetupOutcall: { 1: 80000, 2: 130000, overnight: 250000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "Duo (with friend)", price: 150000 },
      { name: "GFE (girlfriend experience)", price: 40000 },
      { name: "Travel companion", price: 300000 },
    ],
    boundaries: ["No bareback", "No rough play", "Outcall only to hotels"],
    photos: {
      total: 8,
      previewCount: 2,
      source: "studio",
      studioName: "Luxe Studios Lagos",
      captureDate: "Dec 20, 2024",
    },
    reviews: [
      { rating: 5, text: "Absolutely stunning. Worth every naira!", date: "1 day ago", verified: true, author: "Anonymous" },
      { rating: 5, text: "Best experience I've had. Very classy.", date: "5 days ago", verified: true, author: "Tony M." },
      { rating: 5, text: "She's the real deal. Pictures don't do justice.", date: "1 week ago", verified: true, author: "Chris K." },
    ],
    blacklistedClients: [],
    freeMessages: 2,
    schedule: {
      monday: { active: true, start: '10:00', end: '22:00' },
      tuesday: { active: true, start: '10:00', end: '22:00' },
      wednesday: { active: true, start: '10:00', end: '22:00' },
      thursday: { active: true, start: '10:00', end: '22:00' },
      friday: { active: true, start: '10:00', end: '00:00' },
      saturday: { active: true, start: '12:00', end: '00:00' },
      sunday: { active: true, start: '14:00', end: '20:00' },
    },
  },

  amara_ng: {
    profile: {
      name: "Amara",
      username: "amara_ng",
      tagline: "Sweet & discreet 🤫",
      bio: "Your secret is safe with me",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Jan 2025",
      location: "Lagos",
      areas: ["VI", "Ikoyi"],
      isAvailable: true,
      isOnline: false,
      memberSince: "June 2024",
    },
    attributes: {
      bodyType: "petite",
      skinTone: "light",
      age: 22,
      height: "5'3\"",
      services: ["GFE"],
    },
    stats: {
      rating: 4.7,
      reviews: 31,
      verifiedMeetups: 52,
      meetupSuccessRate: 87,
      repeatClients: 15,
      lastSeen: "5h ago",
      favoriteCount: 89,
    },
    reviewHighlights: ["Sweet", "Genuine", "Fun"],
    creatorPayments: [
      { provider: "PalmPay", number: "8034567890", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348034567890",
    },
    pricing: {
      unlockContact: 1000,
      unlockPhotos: 5000,
      meetupIncall: { 1: 45000, 2: 75000, overnight: 140000 },
      meetupOutcall: { 1: 65000, 2: 95000, overnight: 180000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "GFE (girlfriend experience)", price: 25000 },
    ],
    boundaries: ["No bareback", "No anal", "No filming"],
    photos: {
      total: 5,
      previewCount: 1,
      source: "studio",
      studioName: "Luxe Studios Lagos",
      captureDate: "Jan 10, 2025",
    },
    reviews: [
      { rating: 5, text: "So sweet and genuine. Had a great time.", date: "3 days ago", verified: true, author: "James O." },
      { rating: 4, text: "Good experience. She was a bit late but made up for it.", date: "1 week ago", verified: true, author: "Anonymous" },
    ],
    blacklistedClients: ["08098765432"],
    freeMessages: 3,
    schedule: {
      monday: { active: false, start: '00:00', end: '00:00' },
      tuesday: { active: true, start: '16:00', end: '23:00' },
      wednesday: { active: true, start: '16:00', end: '23:00' },
      thursday: { active: true, start: '16:00', end: '23:00' },
      friday: { active: true, start: '14:00', end: '01:00' },
      saturday: { active: true, start: '14:00', end: '01:00' },
      sunday: { active: true, start: '16:00', end: '22:00' },
    },
  },

  zara_elite: {
    profile: {
      name: "Zara",
      username: "zara_elite",
      tagline: "Mainland's finest 👑",
      bio: "Quality over quantity",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Nov 2024",
      location: "Lagos",
      areas: ["Ikeja", "GRA", "Maryland"],
      isAvailable: false,
      isOnline: true,
      memberSince: "August 2024",
    },
    attributes: {
      bodyType: "athletic",
      skinTone: "caramel",
      age: 25,
      height: "5'5\"",
      services: ["GFE"],
    },
    stats: {
      rating: 4.6,
      reviews: 18,
      verifiedMeetups: 28,
      meetupSuccessRate: 82,
      repeatClients: 8,
      lastSeen: "1d ago",
      favoriteCount: 67,
    },
    reviewHighlights: ["Affordable", "Clean", "Friendly"],
    creatorPayments: [
      { provider: "OPay", number: "8045678901", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348045678901",
    },
    pricing: {
      unlockContact: 1000,
      unlockPhotos: 4000,
      meetupIncall: { 1: 40000, 2: 70000, overnight: 120000 },
      meetupOutcall: null, // No outcall
      depositPercent: 0.5,
    },
    extras: [
      { name: "GFE (girlfriend experience)", price: 20000 },
    ],
    boundaries: ["No bareback", "Incall only", "No overnight on first booking"],
    photos: {
      total: 4,
      previewCount: 1,
      source: "studio",
      studioName: "Elite Studios Ikeja",
      captureDate: "Nov 5, 2024",
    },
    reviews: [
      { rating: 5, text: "Great for mainland! No need to go to island.", date: "4 days ago", verified: true, author: "Emeka C." },
      { rating: 4, text: "Nice girl. Apartment was clean.", date: "2 weeks ago", verified: true, author: "Anonymous" },
    ],
    blacklistedClients: [],
    freeMessages: 3,
  },

  chioma_vip: {
    profile: {
      name: "Chioma",
      username: "chioma_vip",
      tagline: "The best in Lagos 💎",
      bio: "VIP treatment guaranteed • Bossman tier recommended",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Oct 2024",
      location: "Lagos",
      areas: ["Lekki", "Ajah", "VI", "Ikoyi"],
      isAvailable: true,
      isOnline: true,
      memberSince: "January 2024",
    },
    attributes: {
      bodyType: "curvy",
      skinTone: "caramel",
      age: 27,
      height: "5'8\"",
      services: ["GFE", "Duo", "Travel companion", "Event date"],
    },
    stats: {
      rating: 5.0,
      reviews: 67,
      verifiedMeetups: 134,
      meetupSuccessRate: 98,
      repeatClients: 45,
      lastSeen: "Online",
      favoriteCount: 512,
    },
    reviewHighlights: ["Premium", "Incredible", "Worth it"],
    creatorPayments: [
      { provider: "OPay", number: "8056789012", isPrimary: true },
      { provider: "PalmPay", number: "8056789012", isPrimary: false },
    ],
    contact: {
      whatsapp: "2348056789012",
    },
    pricing: {
      unlockContact: 3000,
      unlockPhotos: 10000,
      meetupIncall: { 1: 80000, 2: 140000, overnight: 280000 },
      meetupOutcall: { 1: 100000, 2: 180000, overnight: 350000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "Duo (with friend)", price: 200000 },
      { name: "GFE (girlfriend experience)", price: 50000 },
      { name: "Travel companion (per day)", price: 400000 },
      { name: "Event date", price: 150000 },
    ],
    boundaries: ["No bareback", "Screening required for new clients"],
    photos: {
      total: 10,
      previewCount: 2,
      source: "studio",
      studioName: "Luxe Studios Lagos",
      captureDate: "Jan 5, 2025",
    },
    reviews: [
      { rating: 5, text: "She's worth the premium. Absolutely incredible.", date: "1 day ago", verified: true, author: "VIP Client" },
      { rating: 5, text: "Best I've ever had in Lagos. No cap.", date: "3 days ago", verified: true, author: "Anonymous" },
      { rating: 5, text: "Professional, beautiful, and amazing company.", date: "1 week ago", verified: true, author: "David A." },
    ],
    blacklistedClients: [],
    freeMessages: 5,
  },

  nneka_exclusive: {
    profile: {
      name: "Nneka",
      username: "nneka_exclusive",
      tagline: "Exclusive bookings only 🔒",
      bio: "By referral preferred • Quality clientele",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Dec 2024",
      location: "Lagos",
      areas: ["Ikoyi"],
      isAvailable: true,
      isOnline: false,
      memberSince: "May 2024",
    },
    attributes: {
      bodyType: "slim",
      skinTone: "dark",
      age: 28,
      height: "5'9\"",
      services: ["GFE", "Dinner date"],
    },
    stats: {
      rating: 4.8,
      reviews: 39,
      verifiedMeetups: 61,
      meetupSuccessRate: 91,
      repeatClients: 22,
      lastSeen: "3d ago",
      favoriteCount: 178,
    },
    reviewHighlights: ["Elegant", "Classy", "Sophisticated"],
    creatorPayments: [
      { provider: "OPay", number: "8067890123", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348067890123",
    },
    pricing: {
      unlockContact: 2000,
      unlockPhotos: 7000,
      meetupIncall: { 1: 70000, 2: 120000, overnight: 220000 },
      meetupOutcall: { 1: 90000, 2: 150000, overnight: 280000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "GFE (girlfriend experience)", price: 35000 },
      { name: "Dinner date", price: 80000 },
    ],
    boundaries: ["No bareback", "No anal", "Verified clients only", "No same-day bookings"],
    photos: {
      total: 6,
      previewCount: 1,
      source: "studio",
      studioName: "Luxe Studios Lagos",
      captureDate: "Dec 15, 2024",
    },
    reviews: [
      { rating: 5, text: "Class personified. Worth the wait.", date: "5 days ago", verified: true, author: "Michael B." },
      { rating: 5, text: "Elegant and sophisticated. Perfect companion.", date: "2 weeks ago", verified: true, author: "Anonymous" },
    ],
    blacklistedClients: [],
    freeMessages: 2,
  },

  adaeze_premium: {
    profile: {
      name: "Adaeze",
      username: "adaeze_premium",
      tagline: "Abuja's sweetheart 💕",
      bio: "Your favorite Abuja girl",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Jan 2025",
      location: "Abuja",
      areas: ["Maitama", "Wuse", "Asokoro"],
      isAvailable: true,
      isOnline: true,
      memberSince: "February 2024",
    },
    attributes: {
      bodyType: "curvy",
      skinTone: "light",
      age: 25,
      height: "5'6\"",
      services: ["GFE", "Duo"],
    },
    stats: {
      rating: 4.9,
      reviews: 52,
      verifiedMeetups: 78,
      meetupSuccessRate: 93,
      repeatClients: 25,
      lastSeen: "30m ago",
      favoriteCount: 234,
    },
    reviewHighlights: ["Best in Abuja", "Beautiful", "Fun"],
    creatorPayments: [
      { provider: "OPay", number: "8078901234", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348078901234",
    },
    pricing: {
      unlockContact: 1500,
      unlockPhotos: 6000,
      meetupIncall: { 1: 75000, 2: 130000, overnight: 250000 },
      meetupOutcall: { 1: 95000, 2: 160000, overnight: 300000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "Duo (with friend)", price: 180000 },
      { name: "GFE (girlfriend experience)", price: 40000 },
    ],
    boundaries: ["No bareback", "No rough play"],
    photos: {
      total: 7,
      previewCount: 2,
      source: "studio",
      studioName: "Premium Studios Abuja",
      captureDate: "Jan 8, 2025",
    },
    reviews: [
      { rating: 5, text: "Best in Abuja hands down!", date: "2 days ago", verified: true, author: "Senator's Son" },
      { rating: 5, text: "Beautiful and fun to be with.", date: "1 week ago", verified: true, author: "Anonymous" },
    ],
    blacklistedClients: [],
    freeMessages: 3,
  },

  favour_ph: {
    profile: {
      name: "Favour",
      username: "favour_ph",
      tagline: "PH's finest 🌴",
      bio: "Port Harcourt babe • Always available",
      isVerified: true,
      isVideoVerified: true,
      verifiedDate: "Dec 2024",
      location: "Port Harcourt",
      areas: ["GRA", "Trans Amadi", "Rumuola"],
      isAvailable: true,
      isOnline: true,
      memberSince: "July 2024",
    },
    attributes: {
      bodyType: "thick",
      skinTone: "dark",
      age: 23,
      height: "5'4\"",
      services: ["GFE"],
    },
    stats: {
      rating: 4.7,
      reviews: 29,
      verifiedMeetups: 41,
      meetupSuccessRate: 85,
      repeatClients: 12,
      lastSeen: "2h ago",
      favoriteCount: 98,
    },
    reviewHighlights: ["Real", "Genuine", "Recommended"],
    creatorPayments: [
      { provider: "PalmPay", number: "8089012345", isPrimary: true },
    ],
    contact: {
      whatsapp: "2348089012345",
    },
    pricing: {
      unlockContact: 1000,
      unlockPhotos: 4000,
      meetupIncall: { 1: 45000, 2: 75000, overnight: 140000 },
      meetupOutcall: { 1: 60000, 2: 95000, overnight: 180000 },
      depositPercent: 0.5,
    },
    extras: [
      { name: "GFE (girlfriend experience)", price: 25000 },
    ],
    boundaries: ["No bareback", "No anal"],
    photos: {
      total: 5,
      previewCount: 1,
      source: "studio",
      studioName: "PH Studios",
      captureDate: "Dec 10, 2024",
    },
    reviews: [
      { rating: 5, text: "Finally a real one in PH! Highly recommend.", date: "3 days ago", verified: true, author: "Oil Worker" },
      { rating: 4, text: "Good experience. She's genuine.", date: "1 week ago", verified: true, author: "Anonymous" },
    ],
    blacklistedClients: [],
    freeMessages: 3,
  },
};

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
