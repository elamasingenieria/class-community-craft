
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
import { MessageSquare, Heart, Trophy, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    points: number;
  };
  forum_comments: { id: string }[];
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles (full_name, points),
          forum_comments (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          user_id: user.id
        });

      if (error) throw error;

      // Award points for creating a post
      await supabase.rpc('update_user_points', {
        user_uuid: user.id,
        points_to_add: 10
      });

      toast({
        title: "¡Publicación creada!",
        description: "Has ganado 10 puntos por participar en el foro."
      });

      setFormData({ title: '', content: '', category: 'general' });
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive"
      });
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
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Publicar
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreatePost(false)}
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
                          {post.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {post.profiles?.full_name || 'Usuario'}
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
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {post.forum_comments?.length || 0} comentarios
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {post.profiles?.points || 0} puntos
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
