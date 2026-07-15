import { useEffect } from 'react';
import { useAppStore } from '../store';
import { apiService, RegisterData } from '../services/api';
import { storageService } from '../utils/storage';

export const useAuth = () => {
  const { user, setUser, isAuthenticated, setAuthenticated } = useAppStore();

  // Restaurar sessão ao montar o componente
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await storageService.getToken();
        const storedUser = await storageService.getUser();

        if (token && storedUser) {
          setUser(storedUser);
          setAuthenticated(true);
          sessionStorage.setItem('authToken', token);
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
      }
    };

    restoreSession();
  }, [setUser, setAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      // Armazenar token e usuário
      await storageService.setToken(response.access_token);
      await storageService.setUser(response);
      
      // Atualizar sessionStorage para interceptor
      sessionStorage.setItem('authToken', response.access_token);
      
      // Atualizar Zustand store
      setUser(response);
      setAuthenticated(true);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiService.register(data);

      // Armazenar token e usuário
      await storageService.setToken(response.access_token);
      await storageService.setUser(response);

      // Atualizar sessionStorage para interceptor
      sessionStorage.setItem('authToken', response.access_token);

      // Atualizar Zustand store
      setUser(response);
      setAuthenticated(true);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await storageService.clearAll();
      sessionStorage.removeItem('authToken');
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return { user, isAuthenticated, login, register, logout };
};
