-- Enable RLS on the spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all users to select from the table
CREATE POLICY "Allow select for all users" 
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);
