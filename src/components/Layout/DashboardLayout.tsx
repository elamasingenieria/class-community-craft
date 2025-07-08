
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
