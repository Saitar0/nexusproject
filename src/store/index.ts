import { create } from 'zustand';
import { User, Game, DownloadItem } from '../types';
import { GamePreview, CategoryItem } from '../services/api';

interface AppStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;

  // Store - Cache
  games: GamePreview[];
  setGames: (games: GamePreview[]) => void;
  
  categories: CategoryItem[];
  setCategories: (categories: CategoryItem[]) => void;
  
  // Library
  library: Game[];
  setLibrary: (games: Game[]) => void;
  
  // Downloads
  downloads: DownloadItem[];
  addDownload: (download: DownloadItem) => void;
  updateDownload: (id: string, progress: number) => void;
  removeDownload: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  
  // Store - Cache
  games: [],
  setGames: (games) => set({ games }),
  
  categories: [],
  setCategories: (categories) => set({ categories }),
  
  // Library
  library: [],
  setLibrary: (library) => set({ library }),
  
  // Downloads
  downloads: [],
  addDownload: (download) => set((state) => ({ downloads: [...state.downloads, download] })),
  updateDownload: (id, progress) => set((state) => ({
    downloads: state.downloads.map((d) => 
      d.id === id ? { ...d, progress } : d
    ),
  })),
  removeDownload: (id) => set((state) => ({
    downloads: state.downloads.filter((d) => d.id !== id),
  })),
}));
