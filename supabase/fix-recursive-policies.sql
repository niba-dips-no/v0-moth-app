-- Disable RLS temporarily to fix the policies
ALTER TABLE IF EXISTS public.observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update observations" ON public.observations;
DROP POLICY IF EXISTS "Anyone can update observations" ON public.observations;

-- Create simplified policies without circular references
-- For profiles table
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- For observations table - make it simple for now
CREATE POLICY "Anyone can select observations" 
ON public.observations FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert observations" 
ON public.observations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update observations" 
ON public.observations FOR UPDATE 
USING (true);

-- Re-enable RLS
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' AND 
    (tablename = 'observations' OR tablename = 'profiles');
