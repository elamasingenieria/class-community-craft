
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ImageIcon, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive"
        });
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede ser mayor a 5MB",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('🖼️ Iniciando subida de imagen:', file.name, file.size, file.type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      console.log('📁 Ruta del archivo:', filePath);

      const { data, error: uploadError } = await supabase.storage
        .from('forum-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error al subir imagen:', uploadError);
        throw uploadError;
      }

      console.log('✅ Imagen subida exitosamente:', data);

      const { data: urlData } = supabase.storage
        .from('forum-images')
        .getPublicUrl(filePath);

      console.log('🔗 URL pública generada:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error en uploadImage:', error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    if (!user) {
      setError('Debes estar autenticado para crear una publicación');
      return false;
    }

    if (!title.trim()) {
      setError('El título es requerido');
      return false;
    }

    if (!content.trim()) {
      setError('El contenido es requerido');
      return false;
    }

    if (title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres');
      return false;
    }

    if (content.trim().length < 10) {
      setError('El contenido debe tener al menos 10 caracteres');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando creación de publicación...');
    console.log('👤 Usuario:', user?.email);
    console.log('📝 Título:', title);
    console.log('📄 Contenido:', content.substring(0, 50) + '...');
    console.log('🏷️ Categoría:', category);
    console.log('🖼️ Imagen:', imageFile ? 'Sí' : 'No');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;
      
      if (imageFile) {
        console.log('📤 Subiendo imagen...');
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setError('No se pudo subir la imagen. Verifica tu conexión e intenta de nuevo.');
          setIsSubmitting(false);
          return;
        }
        console.log('✅ Imagen subida:', imageUrl);
      }

      console.log('💾 Creando publicación en la base de datos...');
      
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        user_id: user.id,
        image_url: imageUrl,
      };

      console.log('📊 Datos del post:', postData);

      const { data, error } = await supabase
        .from('forum_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear post:', error);
        throw error;
      }

      console.log('✅ Post creado exitosamente:', data);

      toast({
        title: "¡Publicación creada!",
        description: "Tu publicación se ha creado exitosamente."
      });

      // Reset form
      setTitle('');
      setContent('');
      setCategory('general');
      setImageFile(null);
      setImagePreview(null);
      setError(null);
      
      onPostCreated();
    } catch (error: any) {
      console.error('❌ Error en handleSubmit:', error);
      
      let errorMessage = 'No se pudo crear la publicación';
      
      if (error?.code === '23505') {
        errorMessage = 'Ya existe una publicación con este título';
      } else if (error?.code === '42501') {
        errorMessage = 'No tienes permisos para crear publicaciones';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Crear nueva publicación</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe el título de tu publicación"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="achievement">Logro</SelectItem>
                <SelectItem value="question">Pregunta</SelectItem>
                <SelectItem value="programming">Programación</SelectItem>
                <SelectItem value="design">Diseño</SelectItem>
                <SelectItem value="announcements">Anuncios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Contenido *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido de tu publicación"
              rows={4}
              required
              minLength={10}
              maxLength={5000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {content.length}/5000 caracteres
            </div>
          </div>

          <div>
            <Label htmlFor="image">Imagen (opcional)</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs max-h-40 rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center gap-2 cursor-pointer hover:text-primary"
                  >
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm">
                      Haz clic para agregar una imagen
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Máximo 5MB (JPEG, PNG, GIF, WebP)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              'Crear Publicación'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
