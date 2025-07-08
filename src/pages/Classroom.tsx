
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, CheckCircle, BookOpen, Clock, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  order_index: number;
  user_progress: { id: string }[];
}

const Classroom = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          topics (
            *,
            lessons (
              *,
              user_progress (id)
            )
          )
        `)
        .eq('is_published', true)
        .order('order_index');

      if (error) throw error;

      // Process the data to include user progress
      const processedModules = (data || []).map(module => ({
        ...module,
        topics: module.topics
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((topic: any) => ({
            ...topic,
            lessons: topic.lessons
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((lesson: any) => ({
                ...lesson,
                user_progress: lesson.user_progress.filter((progress: any) => 
                  user && progress.user_id === user.id
                )
              }))
          }))
      }));

      // Extract completed lessons
      const completed = new Set<string>();
      processedModules.forEach(module => {
        module.topics.forEach(topic => {
          topic.lessons.forEach(lesson => {
            if (lesson.user_progress.length > 0) {
              completed.add(lesson.id);
            }
          });
        });
      });

      setModules(processedModules);
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los módulos del curso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId
        });

      if (error) {
        // If lesson already completed, ignore the error
        if (error.code === '23505') {
          return;
        }
        throw error;
      }

      // Award points for completing a lesson
      await supabase.rpc('update_user_points', {
        user_uuid: user.id,
        points_to_add: 25
      });

      setCompletedLessons(prev => new Set([...prev, lessonId]));
      
      toast({
        title: "¡Lección completada!",
        description: "Has ganado 25 puntos por completar esta lección."
      });
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la lección como completada",
        variant: "destructive"
      });
    }
  };

  const calculateProgress = () => {
    let totalLessons = 0;
    let completedCount = 0;

    modules.forEach(module => {
      module.topics.forEach(topic => {
        totalLessons += topic.lessons.length;
        completedCount += topic.lessons.filter(lesson => 
          completedLessons.has(lesson.id)
        ).length;
      });
    });

    return totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const openYouTubeVideo = (url: string) => {
    window.open(url, '_blank');
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

  const progress = calculateProgress();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mi Curso</h1>
          
          {/* Progress Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-blue-600" />
                    Progreso General
                  </CardTitle>
                  <CardDescription>
                    {Math.round(progress)}% completado
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {modules.reduce((total, module) => 
                    total + module.topics.reduce((topicTotal, topic) => 
                      topicTotal + topic.lessons.filter(lesson => completedLessons.has(lesson.id)).length, 0
                    ), 0
                  )} / {modules.reduce((total, module) => 
                    total + module.topics.reduce((topicTotal, topic) => topicTotal + topic.lessons.length, 0), 0
                  )} lecciones
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </CardHeader>
          </Card>
        </div>

        {modules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay módulos disponibles</h3>
              <p className="text-gray-600">Los módulos del curso se mostrarán aquí una vez que estén publicados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {moduleIndex + 1}
                    </div>
                    {module.title}
                  </CardTitle>
                  {module.description && (
                    <CardDescription>{module.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {module.topics.map((topic, topicIndex) => (
                      <AccordionItem key={topic.id} value={topic.id}>
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 text-gray-700 rounded w-6 h-6 flex items-center justify-center text-xs font-semibold">
                              {topicIndex + 1}
                            </div>
                            <span className="text-left">{topic.title}</span>
                            <Badge variant="outline" className="ml-auto">
                              {topic.lessons.filter(lesson => completedLessons.has(lesson.id)).length} / {topic.lessons.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          {topic.description && (
                            <p className="text-gray-600 mb-4">{topic.description}</p>
                          )}
                          <div className="space-y-3">
                            {topic.lessons.map((lesson, lessonIndex) => {
                              const isCompleted = completedLessons.has(lesson.id);
                              const videoId = lesson.youtube_url ? getYouTubeVideoId(lesson.youtube_url) : null;
                              
                              return (
                                <div
                                  key={lesson.id} 
                                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                    isCompleted 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={`rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold ${
                                      isCompleted 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-700'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        lessonIndex + 1
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                      {lesson.description && (
                                        <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                                      )}
                                      {videoId && (
                                        <div className="mt-2">
                                          <img 
                                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                            alt={lesson.title}
                                            className="w-24 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => lesson.youtube_url && openYouTubeVideo(lesson.youtube_url)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.youtube_url && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openYouTubeVideo(lesson.youtube_url)}
                                        className="flex items-center gap-1"
                                      >
                                        <PlayCircle className="h-4 w-4" />
                                        Ver Video
                                      </Button>
                                    )}
                                    {!isCompleted && (
                                      <Button
                                        onClick={() => markLessonComplete(lesson.id)}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Marcar Completo
                                      </Button>
                                    )}
                                    {isCompleted && (
                                      <Badge className="bg-green-500 text-white">
                                        Completado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Classroom;
