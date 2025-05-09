-- Create storage bucket for observations
INSERT INTO storage.buckets (id, name, public)
VALUES ('observations', 'observations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the observations bucket
CREATE POLICY "Anyone can upload observations" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'observations');

CREATE POLICY "Anyone can view observations" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'observations');

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
