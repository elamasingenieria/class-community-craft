
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContentFormProps {
  type: 'module' | 'topic' | 'lesson';
  data: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ContentForm = ({ type, data, onSave, onCancel }: ContentFormProps) => {
  const [formData, setFormData] = useState(data);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `module-covers/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('module-covers')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('module-covers')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getTitle = () => {
    const typeNames = {
      module: 'Módulo',
      topic: 'Tema',
      lesson: 'Lección'
    };
    return `${formData.id ? 'Editar' : 'Crear'} ${typeNames[type]}`;
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {formData.id ? 'Modifica' : 'Crea'} {type === 'module' ? 'el módulo' : type === 'topic' ? 'el tema' : 'la lección'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ingresa el título"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ingresa la descripción"
              rows={3}
            />
          </div>

          {type === 'lesson' && (
            <div>
              <Label htmlFor="youtube_url">URL de YouTube</Label>
              <Input
                id="youtube_url"
                value={formData.youtube_url || ''}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {type === 'module' && (
            <div>
              <Label htmlFor="cover_image">Imagen de Portada</Label>
              <div className="space-y-2">
                <Input
                  id="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.cover_image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.cover_image_url} 
                      alt="Vista previa" 
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </div>
                )}
                {uploading && (
                  <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
            <Label htmlFor="is_published">Publicado</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {formData.id ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
