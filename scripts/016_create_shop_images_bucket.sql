-- Create storage bucket for shop images (profile and gallery)
-- This script should be run in Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view shop images" ON storage.objects;
DROP POLICY IF EXISTS "Shop owners can upload shop images" ON storage.objects;
DROP POLICY IF EXISTS "Shop owners can update shop images" ON storage.objects;
DROP POLICY IF EXISTS "Shop owners can delete shop images" ON storage.objects;

-- Create policy to allow public read access
CREATE POLICY "Public can view shop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Create policy to allow shop owners to upload
CREATE POLICY "Shop owners can upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-images' AND
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.owner_id = auth.uid()
  )
);

-- Create policy to allow shop owners to update their shop images
CREATE POLICY "Shop owners can update shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-images' AND
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.owner_id = auth.uid()
  )
);

-- Create policy to allow shop owners to delete their shop images
CREATE POLICY "Shop owners can delete shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-images' AND
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.owner_id = auth.uid()
  )
);

