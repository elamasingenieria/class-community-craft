-- Add cover image functionality to modules
ALTER TABLE public.modules 
ADD COLUMN cover_image_url TEXT;

-- Update storage policies for module covers
INSERT INTO storage.buckets (id, name, public) VALUES ('module-covers', 'module-covers', true);

-- Create policies for the module-covers bucket
CREATE POLICY "Anyone can view module covers" ON storage.objects FOR SELECT USING (bucket_id = 'module-covers');
CREATE POLICY "Authenticated users can upload module covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'module-covers' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update module covers" ON storage.objects FOR UPDATE USING (bucket_id = 'module-covers' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete module covers" ON storage.objects FOR DELETE USING (bucket_id = 'module-covers' AND auth.role() = 'authenticated');