# Configuración de Imágenes en el Foro

## 📋 Pasos para Configurar

### 1. Ejecutar SQL en Supabase

Ejecuta el siguiente código en el **SQL Editor** de Supabase:

```sql
-- 1. Crear tabla para almacenar información de imágenes
CREATE TABLE forum_post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX idx_forum_post_images_post_id ON forum_post_images(post_id);
CREATE INDEX idx_forum_post_images_created_at ON forum_post_images(created_at);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at
CREATE TRIGGER update_forum_post_images_updated_at 
  BEFORE UPDATE ON forum_post_images 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Crear políticas RLS (Row Level Security) para forum_post_images
ALTER TABLE forum_post_images ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Users can view forum post images" ON forum_post_images
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción solo al autor del post
CREATE POLICY "Users can insert images to their own posts" ON forum_post_images
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM forum_posts WHERE id = post_id
    )
  );

-- Política para permitir eliminación solo al autor del post
CREATE POLICY "Users can delete images from their own posts" ON forum_post_images
  FOR DELETE USING (
    auth.uid() = (
      SELECT user_id FROM forum_posts WHERE id = post_id
    )
  );

-- 6. Crear función para obtener URLs de imágenes de un post
CREATE OR REPLACE FUNCTION get_post_images(post_uuid UUID)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fpi.id,
    fpi.file_path,
    fpi.file_name,
    fpi.file_size,
    fpi.mime_type,
    'https://' || (SELECT storage.buckets.name FROM storage.buckets WHERE id = 'forum-images') || '.supabase.co/storage/v1/object/public/forum-images/' || fpi.file_path as url
  FROM forum_post_images fpi
  WHERE fpi.post_id = post_uuid
  ORDER BY fpi.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear función para limpiar imágenes huérfanas
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM forum_post_images 
  WHERE post_id NOT IN (SELECT id FROM forum_posts);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear vista para posts con información de imágenes
CREATE OR REPLACE VIEW forum_posts_with_images AS
SELECT 
  fp.*,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', fpi.id,
        'file_path', fpi.file_path,
        'file_name', fpi.file_name,
        'file_size', fpi.file_size,
        'mime_type', fpi.mime_type,
        'url', 'https://' || (SELECT storage.buckets.name FROM storage.buckets WHERE id = 'forum-images') || '.supabase.co/storage/v1/object/public/forum-images/' || fpi.file_path
      )
    ) FROM forum_post_images fpi WHERE fpi.post_id = fp.id),
    '[]'::json
  ) as images
FROM forum_posts fp;

-- 9. Configurar permisos para la vista
GRANT SELECT ON forum_posts_with_images TO authenticated;

-- 10. Crear función para validar tipos de archivo
CREATE OR REPLACE FUNCTION validate_image_file(mime_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN mime_type LIKE 'image/%';
END;
$$ LANGUAGE plpgsql;

-- 11. Crear función para obtener estadísticas de imágenes
CREATE OR REPLACE FUNCTION get_image_stats()
RETURNS TABLE (
  total_images BIGINT,
  total_size BIGINT,
  avg_size NUMERIC,
  most_used_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_images,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    (SELECT mime_type FROM forum_post_images GROUP BY mime_type ORDER BY COUNT(*) DESC LIMIT 1) as most_used_type
  FROM forum_post_images;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Configurar Bucket de Storage

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un nuevo bucket llamado `forum-images`
3. Configuración del bucket:
   - **Public bucket**: ✅ Habilitado
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/*`

### 3. Configurar Políticas de Storage

Ejecuta también estas políticas para el bucket:

```sql
-- Políticas para el bucket forum-images
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'forum-images');

CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'forum-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🚀 Funcionalidades Implementadas

### ✅ Subida de Imágenes
- **Drag & Drop** o clic para seleccionar imágenes
- **Vista previa** de imágenes seleccionadas
- **Validación** de tipos de archivo (solo imágenes)
- **Límite de tamaño** (10MB por imagen)
- **Múltiples imágenes** por publicación

### ✅ Visualización de Imágenes
- **Grid responsivo** de imágenes en los posts
- **Modal de visualización** con navegación
- **Información de archivo** (nombre, tamaño)
- **Contador de imágenes** en cada post

### ✅ Experiencia de Usuario
- **Indicador de carga** durante la subida
- **Mensajes de error** informativos
- **Navegación con teclado** en el modal
- **Thumbnails** para navegación rápida

### ✅ Seguridad
- **Row Level Security** (RLS) habilitado
- **Validación de tipos** de archivo
- **Límites de tamaño** configurados
- **Políticas de acceso** por usuario

## 📊 Estructura de Datos

### Tabla `forum_post_images`
```sql
- id: UUID (Primary Key)
- post_id: UUID (Foreign Key to forum_posts)
- file_path: TEXT (Ruta en storage)
- file_name: TEXT (Nombre original del archivo)
- file_size: INTEGER (Tamaño en bytes)
- mime_type: TEXT (Tipo MIME)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Vista `forum_posts_with_images`
- Combina posts con sus imágenes en formato JSON
- URLs automáticas para acceso público
- Ordenadas por fecha de creación

## 🔧 Funciones Útiles

### `get_post_images(post_uuid)`
Obtiene todas las imágenes de un post específico

### `cleanup_orphaned_images()`
Limpia imágenes huérfanas (posts eliminados)

### `get_image_stats()`
Obtiene estadísticas de uso de imágenes

## 🎯 Uso en la Aplicación

1. **Crear publicación**: Los usuarios pueden seleccionar imágenes
2. **Vista previa**: Se muestran las imágenes seleccionadas
3. **Subida**: Las imágenes se suben a Supabase Storage
4. **Visualización**: Las imágenes aparecen en el post
5. **Modal**: Clic en imagen para ver en tamaño completo

## 🛠️ Mantenimiento

### Limpiar imágenes huérfanas
```sql
SELECT cleanup_orphaned_images();
```

### Ver estadísticas
```sql
SELECT * FROM get_image_stats();
```

### Ver imágenes de un post
```sql
SELECT * FROM get_post_images('post-uuid-here');
``` 