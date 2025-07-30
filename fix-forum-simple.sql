-- Script simple para corregir el problema de visualización de publicaciones
-- Ejecutar en el SQL Editor de Supabase

-- 1. Eliminar TODAS las políticas existentes del foro
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.forum_posts;

DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.forum_comments;

-- 2. Crear políticas SIMPLES y PERMISIVAS para forum_posts
-- CUALQUIERA puede ver TODAS las publicaciones
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts 
  FOR SELECT USING (true);

-- Usuarios autenticados pueden crear publicaciones
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios autenticados pueden actualizar sus propias publicaciones
CREATE POLICY "Users can update own posts" ON public.forum_posts 
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuarios autenticados pueden eliminar sus propias publicaciones
CREATE POLICY "Users can delete own posts" ON public.forum_posts 
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Crear políticas SIMPLES para forum_comments
-- CUALQUIERA puede ver TODOS los comentarios
CREATE POLICY "Anyone can view forum comments" ON public.forum_comments 
  FOR SELECT USING (true);

-- Usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios autenticados pueden actualizar sus propios comentarios
CREATE POLICY "Users can update own comments" ON public.forum_comments 
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuarios autenticados pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments" ON public.forum_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Asegurar que RLS esté habilitado
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
  'forum_posts' as table_name,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'forum_posts' 
AND schemaname = 'public'
ORDER BY policyname;

-- 6. Probar que se pueden leer las publicaciones
SELECT 
  COUNT(*) as total_posts,
  COUNT(DISTINCT user_id) as unique_users
FROM public.forum_posts;

-- 7. Mostrar algunas publicaciones de ejemplo
SELECT 
  id,
  title,
  category,
  created_at,
  user_id
FROM public.forum_posts 
ORDER BY created_at DESC 
LIMIT 5; 