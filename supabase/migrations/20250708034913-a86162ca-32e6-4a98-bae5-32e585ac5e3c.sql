
-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de módulos del curso
CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de temas
CREATE TABLE public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de clases
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de progreso del usuario
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Crear tabla de publicaciones del foro
CREATE TABLE public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'achievement', 'question')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de comentarios del foro
CREATE TABLE public.forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para módulos, temas y lecciones (lectura para todos, escritura solo para admins)
CREATE POLICY "Anyone can view published modules" ON public.modules FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

CREATE POLICY "Anyone can view published topics" ON public.topics FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

CREATE POLICY "Anyone can view published lessons" ON public.lessons FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

-- Políticas para progreso del usuario
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para foro
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum comments" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.forum_comments FOR UPDATE USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función para actualizar puntos
CREATE OR REPLACE FUNCTION public.update_user_points(user_uuid UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
