import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Edit, Trash2, BookOpen, Users, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ContentEditor } from '@/components/Admin/ContentEditor/ContentEditor';
import { WebhookDiagnostics } from '@/components/VirtualTutor/WebhookDiagnostics';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  module_id: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  order_index: number;
  is_published: boolean;
  topic_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  points: number;
}

const Admin = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', is_published: false });
  const [topicForm, setTopicForm] = useState({ title: '', description: '', module_id: '', is_published: false });
  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    description: '', 
    youtube_url: '', 
    topic_id: '', 
    is_published: false 
  });

  useEffect(() => {
    if (user) {
      checkAuthorization();
    }
  }, [user]);

  const checkAuthorization = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserProfile(data);
      
      if (data.role === 'admin' || data.role === 'instructor') {
        setIsAuthorized(true);
        fetchData();
      } else {
        setIsAuthorized(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      setIsAuthorized(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch modules with topics and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          topics (
            *,
            lessons (*)
          )
        `)
        .order('order_index');

      if (modulesError) throw modulesError;

      // Fetch profiles for user management
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setModules(modulesData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('modules')
        .insert({
          title: moduleForm.title,
          description: moduleForm.description,
          order_index: modules.length + 1,
          is_published: moduleForm.is_published
        });

      if (error) throw error;

      toast({
        title: "¡Módulo creado!",
        description: "El módulo se ha creado exitosamente."
      });

      setModuleForm({ title: '', description: '', is_published: false });
      fetchData();
    } catch (error) {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el módulo",
        variant: "destructive"
      });
    }
  };

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const module = modules.find(m => m.id === topicForm.module_id);
      if (!module) return;

      const { error } = await supabase
        .from('topics')
        .insert({
          title: topicForm.title,
          description: topicForm.description,
          module_id: topicForm.module_id,
          order_index: module.topics.length + 1,
          is_published: topicForm.is_published
        });

      if (error) throw error;

      toast({
        title: "¡Tema creado!",
        description: "El tema se ha creado exitosamente."
      });

      setTopicForm({ title: '', description: '', module_id: '', is_published: false });
      fetchData();
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el tema",
        variant: "destructive"
      });
    }
  };

  const createLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const topic = modules
        .flatMap(m => m.topics)
        .find(t => t.id === lessonForm.topic_id);
      
      if (!topic) return;

      const { error } = await supabase
        .from('lessons')
        .insert({
          title: lessonForm.title,
          description: lessonForm.description,
          youtube_url: lessonForm.youtube_url,
          topic_id: lessonForm.topic_id,
          order_index: topic.lessons.length + 1,
          is_published: lessonForm.is_published
        });

      if (error) throw error;

      toast({
        title: "¡Lección creada!",
        description: "La lección se ha creado exitosamente."
      });

      setLessonForm({ 
        title: '', 
        description: '', 
        youtube_url: '', 
        topic_id: '', 
        is_published: false 
      });
      fetchData();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la lección",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "¡Rol actualizado!",
        description: "El rol del usuario se ha actualizado exitosamente."
      });

      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive"
      });
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

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de administración.
              Solo los administradores e instructores pueden acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Gestiona el contenido del curso y los usuarios de la plataforma</p>
        </div>

        <Tabs defaultValue="content-editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content-editor" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Editor Visual
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Gestión de Contenido
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestión de Usuarios
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Diagnóstico Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content-editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Editor Visual de Contenido</CardTitle>
                <CardDescription>
                  Crea y edita módulos, temas y lecciones usando el editor visual tipo mapa mental
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Create Module */}
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Módulo</CardTitle>
                <CardDescription>Los módulos son las secciones principales del curso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createModule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Título del módulo"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                      required
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="module-published"
                        checked={moduleForm.is_published}
                        onCheckedChange={(checked) => setModuleForm({...moduleForm, is_published: checked})}
                      />
                      <Label htmlFor="module-published">Publicado</Label>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Descripción del módulo"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Módulo
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Topic */}
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Tema</CardTitle>
                <CardDescription>Los temas agrupan las lecciones dentro de un módulo</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTopic} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={topicForm.module_id}
                      onChange={(e) => setTopicForm({...topicForm, module_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar módulo</option>
                      {modules.map(module => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Título del tema"
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({...topicForm, title: e.target.value})}
                      required
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="topic-published"
                        checked={topicForm.is_published}
                        onCheckedChange={(checked) => setTopicForm({...topicForm, is_published: checked})}
                      />
                      <Label htmlFor="topic-published">Publicado</Label>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Descripción del tema"
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                  />
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Tema
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Lesson */}
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Lección</CardTitle>
                <CardDescription>Las lecciones contienen el contenido educativo individual</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createLesson} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={lessonForm.topic_id}
                      onChange={(e) => setLessonForm({...lessonForm, topic_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar tema</option>
                      {modules.flatMap(module => 
                        module.topics.map(topic => (
                          <option key={topic.id} value={topic.id}>
                            {module.title} → {topic.title}
                          </option>
                        ))
                      )}
                    </select>
                    <Input
                      placeholder="Título de la lección"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="URL de YouTube"
                      value={lessonForm.youtube_url}
                      onChange={(e) => setLessonForm({...lessonForm, youtube_url: e.target.value})}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lesson-published"
                        checked={lessonForm.is_published}
                        onCheckedChange={(checked) => setLessonForm({...lessonForm, is_published: checked})}
                      />
                      <Label htmlFor="lesson-published">Publicado</Label>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Descripción de la lección"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  />
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Lección
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Content Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Contenido</CardTitle>
                <CardDescription>Vista general de todos los módulos, temas y lecciones</CardDescription>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay módulos creados aún.</p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{module.title}</h3>
                          <Badge variant={module.is_published ? "default" : "secondary"}>
                            {module.is_published ? "Publicado" : "Borrador"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{module.description}</p>
                        <div className="pl-4 space-y-2">
                          {module.topics.map((topic) => (
                            <div key={topic.id} className="border-l-2 border-gray-200 pl-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{topic.title}</h4>
                                <Badge variant={topic.is_published ? "default" : "secondary"} className="text-xs">
                                  {topic.is_published ? "Publicado" : "Borrador"}
                                </Badge>
                              </div>
                              <div className="pl-4 mt-2 space-y-1">
                                {topic.lessons.map((lesson) => (
                                  <div key={lesson.id} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground">{lesson.title}</span>
                                    <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                                      {lesson.is_published ? "Publicado" : "Borrador"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Administra los roles y permisos de los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                {profiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay usuarios registrados.</p>
                ) : (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{profile.full_name || 'Usuario sin nombre'}</h3>
                                                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">{profile.points} puntos</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                            profile.role === 'instructor' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {profile.role === 'admin' ? 'Administrador' :
                             profile.role === 'instructor' ? 'Instructor' : 'Estudiante'}
                          </Badge>
                          {userProfile?.role === 'admin' && (
                            <select
                              className="text-sm border rounded px-2 py-1"
                              value={profile.role}
                              onChange={(e) => updateUserRole(profile.id, e.target.value)}
                            >
                              <option value="student">Estudiante</option>
                              <option value="instructor">Instructor</option>
                              <option value="admin">Administrador</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico de Webhooks</CardTitle>
                <CardDescription>
                  Prueba y monitorea el estado de los webhooks del Tutor Virtual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookDiagnostics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
