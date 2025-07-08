
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  email: string | null;
  points: number;
  role: string;
  post_count: number;
  progress_count: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);

      if (profilesError) throw profilesError;

      if (profiles) {
        // Get post counts
        const { data: posts, error: postsError } = await supabase
          .from('forum_posts')
          .select('user_id');

        if (postsError) throw postsError;

        // Get progress counts
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('user_id');

        if (progressError) throw progressError;

        // Count posts per user
        const postCounts = posts?.reduce((acc, post) => {
          acc[post.user_id] = (acc[post.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Count progress per user
        const progressCounts = progress?.reduce((acc, prog) => {
          acc[prog.user_id] = (acc[prog.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Combine data
        const enrichedLeaderboard: LeaderboardEntry[] = profiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          points: profile.points || 0,
          role: profile.role || 'student',
          post_count: postCounts[profile.id] || 0,
          progress_count: progressCounts[profile.id] || 0
        }));

        setLeaderboard(enrichedLeaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la tabla de clasificación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-6 w-6 text-blue-500" />;
    }
  };

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">🥇 Campeón</Badge>;
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white">🥈 Subcampeón</Badge>;
      case 3:
        return <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">🥉 Tercer Lugar</Badge>;
      default:
        if (position <= 10) {
          return <Badge variant="secondary">⭐ Top 10</Badge>;
        }
        return <Badge variant="outline">#{position}</Badge>;
    }
  };

  const getCardStyle = (position: number) => {
    switch (position) {
      case 1:
        return "border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg";
      case 2:
        return "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 shadow-md";
      case 3:
        return "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md";
      default:
        return "border-gray-200 hover:border-gray-300 transition-colors";
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Tabla de Clasificación
          </h1>
          <p className="text-gray-600">Los miembros más activos y destacados de nuestra comunidad</p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">🏆 Podio de Campeones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Second Place */}
              <Card className={`${getCardStyle(2)} transform md:translate-y-4`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(2)}
                  </div>
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-600 text-white text-xl">
                      {leaderboard[1]?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{leaderboard[1]?.full_name || 'Usuario'}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-2">{leaderboard[1]?.points} pts</div>
                  {getRankBadge(2)}
                </CardContent>
              </Card>

              {/* First Place */}
              <Card className={getCardStyle(1)}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(1)}
                  </div>
                  <Avatar className="h-20 w-20 mx-auto mb-2">
                    <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-2xl">
                      {leaderboard[0]?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl">{leaderboard[0]?.full_name || 'Usuario'}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{leaderboard[0]?.points} pts</div>
                  {getRankBadge(1)}
                </CardContent>
              </Card>

              {/* Third Place */}
              <Card className={`${getCardStyle(3)} transform md:translate-y-4`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(3)}
                  </div>
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xl">
                      {leaderboard[2]?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{leaderboard[2]?.full_name || 'Usuario'}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-2">{leaderboard[2]?.points} pts</div>
                  {getRankBadge(3)}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Complete Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Clasificación Completa</CardTitle>
            <CardDescription>Todos los miembros ordenados por puntos obtenidos</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos de clasificación</h3>
                <p className="text-gray-600">Los puntos aparecerán aquí cuando los miembros participen en actividades.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const position = index + 1;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getCardStyle(position)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold text-gray-600 w-8 text-center">
                            {position}
                          </div>
                          {position <= 3 && getRankIcon(position)}
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {entry.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {entry.full_name || 'Usuario Anónimo'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{entry.post_count} publicaciones</span>
                            <span>{entry.progress_count} lecciones completadas</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{entry.points}</div>
                          <div className="text-sm text-gray-600">puntos</div>
                        </div>
                        {getRankBadge(position)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Guide */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-center">¿Cómo ganar puntos?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-semibold">Publicar en el foro</div>
                <div className="text-blue-600 font-bold">+10 puntos</div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-semibold">Completar lección</div>
                <div className="text-blue-600 font-bold">+25 puntos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
