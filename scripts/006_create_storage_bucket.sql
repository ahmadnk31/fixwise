-- Create storage bucket for diagnosis images
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnosis-images', 'diagnosis-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for diagnosis images
CREATE POLICY "Anyone can upload diagnosis images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'diagnosis-images');

CREATE POLICY "Anyone can view diagnosis images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'diagnosis-images');

CREATE POLICY "Users can delete their own diagnosis images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'diagnosis-images');
