
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Trophy,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Foro', href: '/dashboard', icon: MessageSquare, roles: ['admin', 'instructor', 'student'] },
  { name: 'Curso', href: '/dashboard/classroom', icon: BookOpen, roles: ['admin', 'instructor', 'student'] },
  { name: 'Miembros', href: '/dashboard/members', icon: Users, roles: ['admin', 'instructor', 'student'] },
  { name: 'Clasificación', href: '/dashboard/leaderboard', icon: Trophy, roles: ['admin', 'instructor', 'student'] },
  { name: 'Administración', href: '/dashboard/admin', icon: Settings, roles: ['admin', 'instructor'] },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile, loading } = useRole();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'instructor': return 'Instructor';
      default: return 'Estudiante';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    !profile || item.roles.includes(profile.role)
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CoC Platform
            </span>
          </div>

          {/* User Profile Section */}
          {profile && !loading && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
                <Badge className={getRoleColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-600">
                <Trophy className="h-3 w-3 mr-1" />
                {profile.points} puntos
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
