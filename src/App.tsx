import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { useDownloads } from './store/downloads';
import { useAuth } from './hooks';
import { useUpdater } from './hooks/useUpdater';
import Login from './pages/Login';
import Register from './pages/Register';
import Store from './pages/Store';
import GameDetail from './pages/GameDetail';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { UpdateModal } from './components/UpdateModal';

// Protected Route Component - redireciona para /login se não autenticado
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth Route Component - redireciona para /store se já autenticado
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/store" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Restaura sessão ao montar
  useAuth();

  // Initialize download event listeners
  const downloads = useDownloads();
  const updater = useUpdater();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    downloads.initializeEventListeners().catch(console.error);
  }, []);

  // Check for updates silently on app start
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        await updater.checkForUpdates();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    checkUpdates();
  }, []);

  // Show modal when update is available
  useEffect(() => {
    if (updater.updateInfo.available) {
      setShowUpdateModal(true);
    }
  }, [updater.updateInfo.available]);

  return (
    <>
      <UpdateModal
        isOpen={showUpdateModal}
        version={updater.updateInfo.version}
        changelog={updater.updateInfo.body}
        onInstall={updater.installUpdate}
        onClose={() => setShowUpdateModal(false)}
        isInstalling={updater.updateInfo.installing}
      />
      <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />

        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <Store />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:id"
          element={
            <ProtectedRoute>
              <GameDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />
        <Route
          path="/downloads"
          element={
            <ProtectedRoute>
              <Downloads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/store" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
