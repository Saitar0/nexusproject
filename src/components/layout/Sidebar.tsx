import { Link, useLocation } from 'react-router-dom';
import { Store, Library, Download, User, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/store', label: 'Store', icon: Store },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/downloads', label: 'Downloads', icon: Download },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-accent">MinhaLoja</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname === path
                ? 'bg-accent text-white'
                : 'text-slate-400 hover:bg-slate-700'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
