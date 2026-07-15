import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      <TopBar />
      <main className="flex-1 ml-64 mt-16 p-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
