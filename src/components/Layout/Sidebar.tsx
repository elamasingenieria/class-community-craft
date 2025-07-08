
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Foro', href: '/dashboard', icon: MessageSquare },
  { name: 'Curso', href: '/dashboard/classroom', icon: BookOpen },
  { name: 'Miembros', href: '/dashboard/members', icon: Users },
  { name: 'Clasificación', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Administración', href: '/dashboard/admin', icon: Settings },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
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
