-- Script completo para solucionar problemas del foro
-- Basado en el esquema actual de Supabase

-- 1. Actualizar las categorías permitidas en forum_posts
ALTER TABLE public.forum_posts 
DROP CONSTRAINT IF EXISTS forum_posts_category_check;

ALTER TABLE public.forum_posts 
ADD CONSTRAINT forum_posts_category_check 
CHECK (category = ANY (ARRAY['general', 'achievement', 'question', 'programming', 'design', 'announcements']));

-- 2. Verificar si el bucket forum-images existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'forum-images';

-- 3. Crear el bucket forum-images si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-images', 
  'forum-images', 
  true, 
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Eliminar políticas existentes del bucket forum-images (si las hay)
DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 5. Crear nuevas políticas para el bucket forum-images
-- Política para permitir lectura a todos los usuarios
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

-- 6. Verificar políticas RLS de forum_posts
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

-- 7. Eliminar políticas RLS existentes de forum_posts (si las hay)
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.forum_posts;

-- 8. Crear nuevas políticas RLS para forum_posts
-- Política para permitir lectura a todos
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts 
  FOR SELECT USING (true);

-- Política para permitir creación solo a usuarios autenticados
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir actualización solo al autor del post
CREATE POLICY "Users can update own posts" ON public.forum_posts 
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir eliminación solo al autor del post
CREATE POLICY "Users can delete own posts" ON public.forum_posts 
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Verificar políticas RLS de forum_comments
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
WHERE tablename = 'forum_comments' 
AND schemaname = 'public';

-- 10. Eliminar políticas RLS existentes de forum_comments (si las hay)
DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.forum_comments;

-- 11. Crear nuevas políticas RLS para forum_comments
-- Política para permitir lectura a todos
CREATE POLICY "Anyone can view forum comments" ON public.forum_comments 
  FOR SELECT USING (true);

-- Política para permitir creación solo a usuarios autenticados
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir actualización solo al autor del comentario
CREATE POLICY "Users can update own comments" ON public.forum_comments 
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir eliminación solo al autor del comentario
CREATE POLICY "Users can delete own comments" ON public.forum_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 12. Verificar que RLS esté habilitado en las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('forum_posts', 'forum_comments')
AND schemaname = 'public';

-- 13. Habilitar RLS si no está habilitado
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- 14. Crear función para limpiar imágenes huérfanas
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar imágenes que no tienen un post asociado
  DELETE FROM storage.objects 
  WHERE bucket_id = 'forum-images'
  AND name NOT IN (
    SELECT DISTINCT image_url 
    FROM forum_posts 
    WHERE image_url IS NOT NULL
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Verificar configuración final
SELECT 'Configuración completada' as status;

-- 16. Mostrar resumen de la configuración
SELECT 
  'forum_posts' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'forum_posts' 
AND schemaname = 'public'

UNION ALL

SELECT 
  'forum_comments' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'forum_comments' 
AND schemaname = 'public'

UNION ALL

SELECT 
  'storage.objects (forum-images)' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%forum%';

-- Para probar la configuración, ejecutar:
-- SELECT cleanup_orphaned_images(); 