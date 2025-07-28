
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Heart, Trophy, Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImageModal } from '@/components/Forum/ImageModal';

interface ForumPostImage {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_points: number;
  comment_count: number;
  images?: ForumPostImage[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPostImages, setSelectedPostImages] = useState<ForumPostImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts_with_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (postsData) {
        // Get user profiles and comment counts separately
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, points')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const { data: comments, error: commentsError } = await supabase
          .from('forum_comments')
          .select('post_id');

        if (commentsError) throw commentsError;

        // Create profiles map and comment counts
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const commentCounts = comments?.reduce((acc, comment) => {
          acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Combine data
        const enrichedPosts: ForumPost[] = postsData.map(post => ({
          ...post,
          author_name: profilesMap.get(post.user_id)?.full_name || null,
          author_points: profilesMap.get(post.user_id)?.points || 0,
          comment_count: commentCounts[post.id] || 0
        }));

        setPosts(enrichedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Archivos no válidos",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
    }
    
    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const openImageModal = (images: ForumPostImage[], initialIndex: number = 0) => {
    setSelectedPostImages(images);
    setSelectedImageIndex(initialIndex);
    setImageModalOpen(true);
  };

  const uploadImages = async (postId: string): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedPaths: string[] = [];
    
    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('forum-images')
        .upload(filePath, image);

      if (uploadError) {
        throw new Error(`Error uploading ${image.name}: ${uploadError.message}`);
      }

      uploadedPaths.push(filePath);
    }

    return uploadedPaths;
  };

  const saveImageRecords = async (postId: string, imagePaths: string[]) => {
    const imageRecords = imagePaths.map((path, index) => ({
      post_id: postId,
      file_path: path,
      file_name: selectedImages[index].name,
      file_size: selectedImages[index].size,
      mime_type: selectedImages[index].type
    }));

    const { error } = await supabase
      .from('forum_post_images')
      .insert(imageRecords);

    if (error) throw error;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploadingImages(true);

    try {
      // Create the post first
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          user_id: user.id
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload images if any
      if (selectedImages.length > 0) {
        const uploadedPaths = await uploadImages(postData.id);
        await saveImageRecords(postData.id, uploadedPaths);
      }

      // Award points for creating a post
      await supabase.rpc('update_user_points', {
        user_uuid: user.id,
        points_to_add: 10
      });

      toast({
        title: "¡Publicación creada!",
        description: `Has ganado 10 puntos por participar en el foro.${selectedImages.length > 0 ? ` Se subieron ${selectedImages.length} imagen(es).` : ''}`
      });

      setFormData({ title: '', content: '', category: 'general' });
      setSelectedImages([]);
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'achievement': return 'bg-green-100 text-green-800';
      case 'question': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'achievement': return <Trophy className="h-4 w-4" />;
      case 'question': return <MessageSquare className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Foro de la Comunidad</h1>
            <p className="text-gray-600 mt-2">Comparte tus logros, haz preguntas y conecta con otros estudiantes</p>
          </div>
          <Button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Publicación
          </Button>
        </div>

        {showCreatePost && (
          <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Crear Nueva Publicación</CardTitle>
              <CardDescription>Comparte algo con la comunidad y gana 10 puntos</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Input
                    placeholder="Título de tu publicación"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">💬 General</SelectItem>
                      <SelectItem value="achievement">🏆 Logro</SelectItem>
                      <SelectItem value="question">❓ Pregunta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    placeholder="Escribe tu mensaje aquí..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    required
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Imágenes (opcional)</span>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Haz clic para seleccionar imágenes
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF hasta 10MB cada una
                      </span>
                    </label>
                  </div>

                  {/* Selected Images Preview */}
                  {selectedImages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Imágenes seleccionadas ({selectedImages.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={image.name}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {image.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      'Publicar'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreatePost(false);
                      setSelectedImages([]);
                    }}
                    disabled={uploadingImages}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay publicaciones aún</h3>
                <p className="text-gray-600 mb-4">¡Sé el primero en compartir algo con la comunidad!</p>
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Crear Primera Publicación
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {post.author_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {post.author_name || 'Usuario'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getCategoryColor(post.category)}>
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(post.category)}
                        {post.category === 'achievement' ? 'Logro' : 
                         post.category === 'question' ? 'Pregunta' : 'General'}
                      </span>
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {/* Images Display */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {post.images.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.url}
                              alt={image.file_name}
                              className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(post.images!, index)}
                            />
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {image.file_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count} comentarios
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {post.author_points} puntos
                    </span>
                    {post.images && post.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        {post.images.length} imagen{post.images.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        images={selectedPostImages}
        initialIndex={selectedImageIndex}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
