-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for observation status
DO $$ BEGIN
    CREATE TYPE observation_status AS ENUM ('Pending', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user'::user_role
);

-- Create observations table
CREATE TABLE IF NOT EXISTS observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  comment TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  device_info JSONB NOT NULL,
  status observation_status DEFAULT 'Pending'::observation_status,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Add PostGIS geometry column to observations
SELECT AddGeometryColumn('public', 'observations', 'geom', 4326, 'POINT', 2);

-- Create trigger to automatically update the geometry column
CREATE OR REPLACE FUNCTION update_observation_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_geom_trigger ON observations;
CREATE TRIGGER update_geom_trigger
BEFORE INSERT OR UPDATE ON observations
FOR EACH ROW
EXECUTE FUNCTION update_observation_geom();

-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT
);

-- Create RLS policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Observations table policies
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create observations"
  ON observations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view observations"
  ON observations FOR SELECT
  USING (true);

CREATE POLICY "Admins can update observations"
  ON observations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Newsletter subscribers table policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view newsletter subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage bucket for observations
INSERT INTO storage.buckets (id, name, public)
VALUES ('observations', 'observations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the observations bucket
DROP POLICY IF EXISTS "Anyone can upload observations" ON storage.objects;
CREATE POLICY "Anyone can upload observations" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'observations');

DROP POLICY IF EXISTS "Anyone can view observations" ON storage.objects;
CREATE POLICY "Anyone can view observations" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'observations');

DROP POLICY IF EXISTS "Admins can update observations" ON storage.objects;
CREATE POLICY "Admins can update observations" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'observations' AND
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.uid() = profiles.id AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete observations" ON storage.objects;
CREATE POLICY "Admins can delete observations" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'observations' AND
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.uid() = profiles.id AND profiles.role = 'admin'
    )
  );

-- Create an admin user (optional)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'encrypted-password', NOW(), 'authenticated');

-- INSERT INTO profiles (id, email, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin');
