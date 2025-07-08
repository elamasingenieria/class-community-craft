
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ImageIcon, X } from 'lucide-react';
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `forum-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('forum-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('forum-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Título y contenido son requeridos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "No se pudo subir la imagen",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category,
          user_id: user.id,
          image_url: imageUrl,
        });

      if (error) throw error;

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
      
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe el título de tu publicación"
              required
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
                <SelectItem value="programming">Programación</SelectItem>
                <SelectItem value="design">Diseño</SelectItem>
                <SelectItem value="questions">Preguntas</SelectItem>
                <SelectItem value="announcements">Anuncios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido de tu publicación"
              rows={4}
              required
            />
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
                      Máximo 5MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creando...' : 'Crear Publicación'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
