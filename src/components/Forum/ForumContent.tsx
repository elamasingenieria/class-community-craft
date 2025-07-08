
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreatePostForm } from './CreatePostForm';
import { PostCard } from './PostCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  created_at: string;
  user_id: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
}

export const ForumContent = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchComments()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCommentsForPost = (postId: string) => {
    return comments.filter(comment => comment.post_id === postId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePostForm onPostCreated={fetchData} />

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="programming">Programación</SelectItem>
            <SelectItem value="design">Diseño</SelectItem>
            <SelectItem value="questions">Preguntas</SelectItem>
            <SelectItem value="announcements">Anuncios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || categoryFilter !== 'all' 
              ? 'No se encontraron publicaciones con los filtros actuales.'
              : 'No hay publicaciones aún. ¡Sé el primero en crear una!'
            }
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={getCommentsForPost(post.id)}
              onCommentAdded={fetchData}
            />
          ))
        )}
      </div>
    </div>
  );
};
