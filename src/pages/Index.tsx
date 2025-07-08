
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Trophy, MessageSquare, BookOpen, Star } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CoC Platform
            </span>
          </div>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Acceder
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tu plataforma de cursos
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              sin mensualidades
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Aloja y gestiona tus cursos online sin pagar comisiones mensuales. 
            Una alternativa poderosa a Skool y Kajabi, diseñada para creadores de contenido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                Comenzar Gratis
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para tu curso online
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Una plataforma completa con todas las herramientas que necesitas para crear, 
            gestionar y hacer crecer tu comunidad educativa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Gestión de Cursos</CardTitle>
              <CardDescription>
                Organiza tu contenido en módulos, temas y lecciones. 
                Integración perfecta con YouTube para tus videos.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Foro Comunitario</CardTitle>
              <CardDescription>
                Construye una comunidad vibrante donde tus estudiantes 
                pueden interactuar, hacer preguntas y celebrar logros.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Gamificación</CardTitle>
              <CardDescription>
                Sistema de puntos y clasificaciones que motiva a tus estudiantes 
                a completar lecciones y participar activamente.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle>Gestión de Miembros</CardTitle>
              <CardDescription>
                Administra fácilmente a todos tus estudiantes, 
                ve su progreso y gestiona roles y permisos.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Sin Comisiones</CardTitle>
              <CardDescription>
                A diferencia de otras plataformas, no cobramos mensualidades. 
                Tu curso, tus reglas, tus ganancias.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle>Diseño Profesional</CardTitle>
              <CardDescription>
                Interfaz moderna y responsive que funciona perfectamente 
                en todos los dispositivos.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <CardContent className="py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para lanzar tu curso?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a los creadores que ya han elegido la libertad de CoC Platform
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Comenzar Ahora - Es Gratis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">CoC Platform</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 CoC Platform. Todos los derechos reservados.</p>
            <p className="mt-2">Creado con ❤️ para creadores de contenido</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
