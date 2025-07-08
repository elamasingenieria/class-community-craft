
import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'instructor' | 'student';
  allowedRoles?: ('admin' | 'instructor' | 'student')[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles = [] 
}: ProtectedRouteProps) => {
  const { profile, loading } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">No se pudo verificar tu perfil de usuario.</p>
        </CardContent>
      </Card>
    );
  }

  // Check specific role requirement
  if (requiredRole && profile.role !== requiredRole) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">
            Esta sección requiere permisos de {requiredRole === 'admin' ? 'administrador' : 'instructor'}.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role as any)) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
