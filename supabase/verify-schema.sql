-- Check if the observations table exists and has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'observations') THEN
        RAISE NOTICE 'Creating observations table...';
        
        CREATE TABLE public.observations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            image_url TEXT NOT NULL,
            comment TEXT NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            accuracy DOUBLE PRECISION,
            device_info JSONB NOT NULL,
            status TEXT DEFAULT 'Pending',
            reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            reviewed_at TIMESTAMP WITH TIME ZONE
        );
        
        RAISE NOTICE 'Observations table created successfully.';
    ELSE
        RAISE NOTICE 'Observations table already exists.';
    END IF;
END $$;

-- Check if the storage bucket exists
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'observations'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
        RAISE NOTICE 'Creating observations storage bucket...';
        
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('observations', 'observations', true);
        
        RAISE NOTICE 'Observations bucket created successfully.';
    ELSE
        RAISE NOTICE 'Observations bucket already exists.';
    END IF;
END $$;

-- Check and create storage policies
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check for upload policy
    SELECT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Anyone can upload observations'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating storage upload policy...';
        
        CREATE POLICY "Anyone can upload observations" ON storage.objects
        FOR INSERT
        WITH CHECK (bucket_id = 'observations');
        
        RAISE NOTICE 'Upload policy created successfully.';
    ELSE
        RAISE NOTICE 'Upload policy already exists.';
    END IF;
    
    -- Check for select policy
    SELECT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Anyone can view observations'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating storage select policy...';
        
        CREATE POLICY "Anyone can view observations" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'observations');
        
        RAISE NOTICE 'Select policy created successfully.';
    ELSE
        RAISE NOTICE 'Select policy already exists.';
    END IF;
END $$;

-- Check for RLS on observations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'observations' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'Enabling RLS on observations table...';
        
        ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'RLS enabled on observations table.';
    ELSE
        RAISE NOTICE 'RLS already enabled on observations table.';
    END IF;
END $$;

-- Check and create table policies
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check for insert policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'observations'
        AND policyname = 'Anyone can create observations'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating observations insert policy...';
        
        CREATE POLICY "Anyone can create observations" 
        ON public.observations FOR INSERT 
        WITH CHECK (true);
        
        RAISE NOTICE 'Insert policy created successfully.';
    ELSE
        RAISE NOTICE 'Insert policy already exists.';
    END IF;
    
    -- Check for select policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'observations'
        AND policyname = 'Anyone can view observations'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating observations select policy...';
        
        CREATE POLICY "Anyone can view observations" 
        ON public.observations FOR SELECT 
        USING (true);
        
        RAISE NOTICE 'Select policy created successfully.';
    ELSE
        RAISE NOTICE 'Select policy already exists.';
    END IF;
END $$;

-- Check for existing observations
SELECT COUNT(*) AS observation_count FROM public.observations;

-- Check for existing storage objects
SELECT COUNT(*) AS storage_object_count FROM storage.objects WHERE bucket_id = 'observations';
