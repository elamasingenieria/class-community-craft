
import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main content area */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : ''}`}>
        {/* Header with sidebar toggle */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-background border-b border-border p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <main className="py-6 px-4 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
