-- Create storage bucket for observations if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('observations', 'observations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the observations bucket
-- Allow anyone to upload files
DROP POLICY IF EXISTS "Anyone can upload observations" ON storage.objects;
CREATE POLICY "Anyone can upload observations" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'observations');

-- Allow anyone to view files
DROP POLICY IF EXISTS "Anyone can view observations" ON storage.objects;
CREATE POLICY "Anyone can view observations" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'observations');

-- Allow anyone to update their own files
DROP POLICY IF EXISTS "Anyone can update their own observations" ON storage.objects;
CREATE POLICY "Anyone can update their own observations" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'observations');

-- Allow anyone to delete their own files
DROP POLICY IF EXISTS "Anyone can delete their own observations" ON storage.objects;
CREATE POLICY "Anyone can delete their own observations" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'observations');
