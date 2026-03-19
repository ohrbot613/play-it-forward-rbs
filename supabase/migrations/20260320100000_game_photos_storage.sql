-- Game Photos Storage Bucket
-- Run once in Supabase dashboard: Storage > New bucket OR via SQL editor

-- Create the storage bucket for game photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-photos',
  'game-photos',
  TRUE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload their own game photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'game-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all game photos
CREATE POLICY IF NOT EXISTS "Game photos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'game-photos');

-- Allow users to delete their own photos
CREATE POLICY IF NOT EXISTS "Users can delete their own game photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'game-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
