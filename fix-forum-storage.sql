-- Script para verificar y corregir la configuración del bucket de storage para el foro
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si el bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'forum-images';

-- 2. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-images', 
  'forum-images', 
  true, 
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%forum%';

-- 4. Eliminar políticas existentes del bucket forum-images (si las hay)
DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 5. Crear nuevas políticas para el bucket forum-images
-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Anyone can view forum images" ON storage.objects
  FOR SELECT USING (bucket_id = 'forum-images');

-- Política para permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload forum images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'forum-images' 
    AND auth.role() = 'authenticated'
  );

-- Política para permitir actualización solo al propietario del archivo
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir eliminación solo al propietario del archivo
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Verificar que la tabla forum_posts existe y tiene la estructura correcta
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'forum_posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar políticas RLS de forum_posts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'forum_posts' 
AND schemaname = 'public';

-- 8. Verificar que las políticas RLS estén habilitadas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'forum_posts' 
AND schemaname = 'public';

-- 9. Crear función para limpiar imágenes huérfanas (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar imágenes que no tienen un post asociado
  DELETE FROM storage.objects 
  WHERE bucket_id = 'forum-images'
  AND name NOT IN (
    SELECT DISTINCT file_path 
    FROM forum_post_images 
    WHERE file_path IS NOT NULL
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verificar configuración final
SELECT 'Configuración completada' as status;

-- Para probar la configuración, ejecutar:
-- SELECT cleanup_orphaned_images(); 