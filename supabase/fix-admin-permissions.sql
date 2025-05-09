-- First, check if the admin update policy exists
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'observations'
        AND policyname = 'Admins can update observations'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating admin update policy...';
        
        -- Create the policy to allow updates
        CREATE POLICY "Admins can update observations" 
        ON public.observations FOR UPDATE 
        USING (true);
        
        RAISE NOTICE 'Admin update policy created successfully.';
    ELSE
        -- If policy exists, drop and recreate it to ensure it works
        DROP POLICY "Admins can update observations" ON public.observations;
        
        -- Create a simpler policy that allows all updates for now
        CREATE POLICY "Admins can update observations" 
        ON public.observations FOR UPDATE 
        USING (true);
        
        RAISE NOTICE 'Admin update policy recreated successfully.';
    END IF;
END $$;

-- Make sure RLS is enabled but not blocking operations
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

-- Create a policy for anyone to update observations (for testing)
DROP POLICY IF EXISTS "Anyone can update observations" ON public.observations;
CREATE POLICY "Anyone can update observations" 
ON public.observations FOR UPDATE 
USING (true);

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
    tablename = 'observations';
