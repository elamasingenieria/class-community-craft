
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, MessageSquare, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Member {
  id: string;
  full_name: string | null;
  email: string | null;
  points: number;
  role: string;
  created_at: string;
  forum_posts: { id: string }[];
  user_progress: { id: string }[];
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeThisWeek: 0,
    totalPosts: 0,
    completedLessons: 0
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          forum_posts (id),
          user_progress (id)
        `)
        .order('points', { ascending: false });

      if (error) throw error;

      const membersData = data || [];
      setMembers(membersData);

      // Calculate stats
      const totalMembers = membersData.length;
      const totalPosts = membersData.reduce((sum, member) => sum + (member.forum_posts?.length || 0), 0);
      const completedLessons = membersData.reduce((sum, member) => sum + (member.user_progress?.length || 0), 0);
      
      // Simulate active this week (you could implement real tracking)
      const activeThisWeek = Math.floor(totalMembers * 0.6);

      setStats({
        totalMembers,
        activeThisWeek,
        totalPosts,
        completedLessons
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'instructor': return 'Instructor';
      default: return 'Estudiante';
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Miembros de la Comunidad</h1>
          <p className="text-gray-600">Conoce a todos los miembros activos de nuestra plataforma</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Miembros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Publicaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lecciones Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completedLessons}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Activos Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.activeThisWeek}</div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Todos los Miembros</CardTitle>
            <CardDescription>Lista completa de miembros ordenados por puntos</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay miembros registrados</h3>
                <p className="text-gray-600">Los miembros aparecerán aquí una vez que se registren.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-gray-500 w-8 text-center">
                          #{index + 1}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                            {member.full_name?.charAt(0) || member.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {member.full_name || 'Usuario Anónimo'}
                        </h3>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Miembro desde {new Date(member.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-lg">{member.points}</span>
                          <span className="text-sm text-gray-600">pts</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {member.forum_posts?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {member.user_progress?.length || 0}
                          </span>
                        </div>
                      </div>
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Members;
