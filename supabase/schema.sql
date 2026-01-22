-- Hush Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Base table for all users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('client', 'creator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_new_member BOOLEAN DEFAULT TRUE,
  has_paid_trust_deposit BOOLEAN DEFAULT FALSE,
  tier VARCHAR(20),
  deposit_balance DECIMAL(10, 2) DEFAULT 0,
  successful_meetups INTEGER DEFAULT 0,
  meetup_success_rate DECIMAL(5, 2),
  months_on_platform INTEGER DEFAULT 0,
  is_trusted_member BOOLEAN DEFAULT FALSE,
  -- Client preferences for matching
  preferences JSONB DEFAULT '{
    "preferredLocation": null,
    "bodyTypes": [],
    "skinTones": [],
    "ageRanges": [],
    "services": []
  }'::jsonb
);

-- ============================================
-- CREATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  location VARCHAR(100),
  tagline VARCHAR(200),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_video_verified BOOLEAN DEFAULT FALSE,
  is_studio_verified BOOLEAN DEFAULT FALSE,
  pending_verification BOOLEAN DEFAULT TRUE,
  is_visible_in_explore BOOLEAN DEFAULT FALSE,

  -- Physical attributes for matching
  body_type VARCHAR(50),
  skin_tone VARCHAR(50),
  age INTEGER CHECK (age >= 18),
  height VARCHAR(20),
  services TEXT[] DEFAULT '{}',

  -- Pricing (stored as JSONB for flexibility)
  pricing JSONB DEFAULT '{
    "unlockContact": 0,
    "unlockPhotos": 0,
    "meetupIncall": {"1": 0, "2": 0, "overnight": 0},
    "meetupOutcall": {"1": 0, "2": 0, "overnight": 0},
    "depositPercent": 0.5
  }'::jsonb,

  -- Schedule (stored as JSONB)
  schedule JSONB DEFAULT '{
    "monday": {"active": true, "start": "10:00", "end": "22:00"},
    "tuesday": {"active": true, "start": "10:00", "end": "22:00"},
    "wednesday": {"active": true, "start": "10:00", "end": "22:00"},
    "thursday": {"active": true, "start": "10:00", "end": "22:00"},
    "friday": {"active": true, "start": "10:00", "end": "23:00"},
    "saturday": {"active": true, "start": "12:00", "end": "23:00"},
    "sunday": {"active": false, "start": "12:00", "end": "20:00"}
  }'::jsonb,

  -- Stats
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  verified_meetups INTEGER DEFAULT 0,
  meetup_success_rate DECIMAL(5, 2) DEFAULT 0,
  profile_views INTEGER DEFAULT 0
);

-- ============================================
-- CREATOR SERVICE AREAS
-- ============================================
CREATE TABLE IF NOT EXISTS creator_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  area VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_areas_creator ON creator_areas(creator_id);

-- ============================================
-- CREATOR PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS creator_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  is_preview BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  captured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_photos_creator ON creator_photos(creator_id);

-- ============================================
-- CREATOR EXTRAS (Additional services)
-- ============================================
CREATE TABLE IF NOT EXISTS creator_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_extras_creator ON creator_extras(creator_id);

-- ============================================
-- CREATOR BOUNDARIES
-- ============================================
CREATE TABLE IF NOT EXISTS creator_boundaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  boundary VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_boundaries_creator ON creator_boundaries(creator_id);

-- ============================================
-- FAVORITES (Client favorites for creators)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, creator_id)
);

CREATE INDEX idx_favorites_client ON favorites(client_id);
CREATE INDEX idx_favorites_creator ON favorites(creator_id);

-- Add favorite_count column to creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Function to update creator favorite count
CREATE OR REPLACE FUNCTION update_creator_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creators SET favorite_count = favorite_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creators SET favorite_count = favorite_count - 1 WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update favorite count
DROP TRIGGER IF EXISTS favorites_count_trigger ON favorites;
CREATE TRIGGER favorites_count_trigger
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW EXECUTE FUNCTION update_creator_favorite_count();

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,

  -- Booking details
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL, -- '1', '2', 'overnight'
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('incall', 'outcall')),
  location VARCHAR(200),
  special_requests TEXT,

  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,

  -- Verification codes
  client_code VARCHAR(6),
  creator_code VARCHAR(6),

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  status_note TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_creator ON bookings(creator_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(date);

-- ============================================
-- BOOKING EXTRAS (Selected extras for a booking)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES creator_extras(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_booking_extras_booking ON booking_extras(booking_id);

-- ============================================
-- CREATOR EARNINGS
-- ============================================
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) DEFAULT 'meetup' CHECK (type IN ('meetup', 'unlock_contact', 'unlock_photos', 'tip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);

-- ============================================
-- OTP CODES (for WhatsApp verification)
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_expires ON otp_codes(expires_at);

-- ============================================
-- UNLOCKS (Track what clients have unlocked)
-- ============================================
CREATE TABLE IF NOT EXISTS unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('contact', 'photos')),
  price_paid DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, creator_id, unlock_type)
);

CREATE INDEX idx_unlocks_client ON unlocks(client_id);
CREATE INDEX idx_unlocks_creator ON unlocks(creator_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Clients can view their own data" ON clients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clients can update their own data" ON clients
  FOR UPDATE USING (auth.uid() = id);

-- Creators policies
CREATE POLICY "Anyone can view verified creators" ON creators
  FOR SELECT USING (is_visible_in_explore = TRUE OR auth.uid() = id);

CREATE POLICY "Creators can update their own data" ON creators
  FOR UPDATE USING (auth.uid() = id);

-- Creator areas policies
CREATE POLICY "Anyone can view creator areas" ON creator_areas
  FOR SELECT USING (TRUE);

CREATE POLICY "Creators can manage their areas" ON creator_areas
  FOR ALL USING (auth.uid() = creator_id);

-- Creator photos policies
CREATE POLICY "Anyone can view preview photos" ON creator_photos
  FOR SELECT USING (is_preview = TRUE);

CREATE POLICY "Clients with unlocks can view all photos" ON creator_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM unlocks
      WHERE unlocks.client_id = auth.uid()
      AND unlocks.creator_id = creator_photos.creator_id
      AND unlocks.unlock_type = 'photos'
    )
  );

CREATE POLICY "Creators can manage their photos" ON creator_photos
  FOR ALL USING (auth.uid() = creator_id);

-- Creator extras policies
CREATE POLICY "Anyone can view creator extras" ON creator_extras
  FOR SELECT USING (TRUE);

CREATE POLICY "Creators can manage their extras" ON creator_extras
  FOR ALL USING (auth.uid() = creator_id);

-- Creator boundaries policies
CREATE POLICY "Anyone can view creator boundaries" ON creator_boundaries
  FOR SELECT USING (TRUE);

CREATE POLICY "Creators can manage their boundaries" ON creator_boundaries
  FOR ALL USING (auth.uid() = creator_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);

CREATE POLICY "Clients can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = creator_id);

-- Booking extras policies
CREATE POLICY "Users can view booking extras" ON booking_extras
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_extras.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.creator_id = auth.uid())
    )
  );

-- Creator earnings policies
CREATE POLICY "Creators can view their own earnings" ON creator_earnings
  FOR SELECT USING (auth.uid() = creator_id);

-- OTP codes policies (service role only)
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
  FOR ALL USING (TRUE);

-- Unlocks policies
CREATE POLICY "Users can view their unlocks" ON unlocks
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);

CREATE POLICY "Clients can create unlocks" ON unlocks
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to update last_seen_at
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_seen_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate random 6-digit code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in the Supabase Dashboard > Storage

-- Create bucket for creator photos (if not exists via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('creator-photos', 'creator-photos', false);

-- Storage policies would be set up in the Supabase Dashboard
