
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, User, Calendar, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  created_at: string;
  user_id: string;
}

interface PostCardProps {
  post: Post;
  comments: Comment[];
  onCommentAdded: () => void;
}

export const PostCard = ({ post, comments, onCommentAdded }: PostCardProps) => {
  const { user } = useAuth();
  const sb = supabase as any; // untyped access for tables not in generated types
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [likedByUser, setLikedByUser] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-muted text-muted-foreground',
      achievement: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      question: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      programming: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      design: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      announcements: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  // Load likes count and whether current user liked
  useEffect(() => {
    let isMounted = true;

    const fetchLikes = async () => {
      try {
        const { count } = await sb
          .from('forum_post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (isMounted) setLikesCount(count || 0);

        if (user) {
          const { data: likedRow } = await sb
            .from('forum_post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (isMounted) setLikedByUser(!!likedRow);
        } else {
          if (isMounted) setLikedByUser(false);
        }
      } catch (err) {
        // no-op
      }
    };

    fetchLikes();
    return () => {
      isMounted = false;
    };
  }, [post.id, user?.id]);

  const toggleLike = async () => {
    if (!user) {
      toast({ title: 'Inicia sesión', description: 'Debes iniciar sesión para dar like', variant: 'destructive' });
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (likedByUser) {
        const { error } = await sb
          .from('forum_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
        setLikedByUser(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await sb
          .from('forum_post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
        setLikedByUser(true);
        setLikesCount((c) => c + 1);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo actualizar el like', variant: 'destructive' });
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          content: newComment.trim(),
          post_id: post.id,
          user_id: user.id,
        });

      if (error) throw error;

      setNewComment('');
      onCommentAdded();
      toast({
        title: "¡Comentario agregado!",
        description: "Tu comentario se ha publicado exitosamente."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Cover image at top */}
      {post.image_url && (
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={post.image_url}
            alt="Imagen del post"
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold leading-tight mb-2">{post.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {/* Post author avatar: requires join upstream; placeholder for now */}
                  <AvatarFallback className="text-[10px]">U</AvatarFallback>
                </Avatar>
                <span>Usuario</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Likes */}
          <Button
            variant={likedByUser ? 'default' : 'outline'}
            size="sm"
            onClick={toggleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 ${likedByUser ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
            aria-pressed={likedByUser}
          >
            <Heart className={`h-4 w-4 ${likedByUser ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Comments header */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>
              {comments.length} comentario{comments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Comments list */}
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">U</AvatarFallback>
                </Avatar>
                <span>Usuario</span>
                <span>•</span>
                {new Date(comment.created_at).toLocaleDateString()}
              </div>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}

          {/* Comment composer */}
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? 'Escribe tu comentario...' : 'Inicia sesión para comentar'}
              rows={2}
              className="flex-1"
              disabled={!user}
            />
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim() || !user}
            >
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
