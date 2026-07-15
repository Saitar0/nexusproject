import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-sidebar border-b border-slate-700 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-40">
      <div className="flex items-center flex-1 max-w-md">
        <Search size={20} className="text-slate-400" />
        <Input
          type="text"
          placeholder="Search games..."
          className="ml-3 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm">{user.username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut size={20} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
