import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://nexusstrproject.duckdns.org';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para adicionar token Bearer
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tipos de resposta
export interface LoginResponse {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: 'admin' | 'developer' | 'client';
  balance: number;
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  role?: 'client' | 'developer';
}

// ============ STORE TYPES ============

export interface GamePreview {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  price: number;
  discount: number;
  final_price: number;
  is_free: boolean;
  cover_image: string;
  thumbnail_square: string;
  featured: boolean;
  downloads: number;
  avg_rating: number;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface GameDetail extends GamePreview {
  description: string;
  requirements: string;
  file_size: string;
  version: string;
  tags: string;
  created_at: string;
  approved_at: string | null;
  owned: boolean;
  wishlisted: boolean;
  reviews: Review[];
  screenshots: string[];
  developer: {
    id: number;
    username: string;
    display_name: string;
  } | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
  };
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface GamesResponse {
  games: GamePreview[];
  page: number;
  per_page: number;
  total: number;
  pages?: number;
}

export interface ApiService {
  // Auth
  login(email: string, password: string): Promise<LoginResponse>;
  register(data: RegisterData): Promise<LoginResponse>;
  logout(): void;

  // Store - Games
  getGames(filters?: {
    page?: number;
    per_page?: number;
    q?: string;
    category?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    price?: 'all' | 'free' | 'paid';
  }): Promise<GamesResponse>;
  getGameById(id: number): Promise<GameDetail>;
  getGameBySlug(slug: string): Promise<GameDetail>;

  // Store - Categories
  getCategories(): Promise<{ categories: CategoryItem[] }>;

  // Store - Library
  getUserLibrary(): Promise<{ games: GamePreview[] }>;

  // Store - Reviews
  addReview(gameId: number, rating: number, comment: string): Promise<Review>;

  // Store - Purchases
  buyGame(gameId: number): Promise<{ success: boolean; new_balance: number }>;

  // Store - Wishlist
  toggleWishlist(gameId: number): Promise<{ wishlisted: boolean }>;

  // Store - Downloads
  getDownloadUrl(gameId: number): Promise<{ download_url: string; executable_name: string }>;
};

export const apiService: ApiService = {
  // Auth
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/api/login', { email, password });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao fazer login');
      }
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/api/register', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao registrar');
      }
      throw error;
    }
  },

  logout: () => {
    sessionStorage.removeItem('authToken');
  },

  // Store - Games
  getGames: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.per_page) params.append('per_page', String(filters.per_page));
      if (filters.q) params.append('q', filters.q);
      if (filters.category) params.append('cat', filters.category);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.price) params.append('price', filters.price);

      const response = await api.get<GamesResponse>('/api/games', { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao carregar jogos');
      }
      throw error;
    }
  },

  getGameById: async (id: number) => {
    try {
      const response = await api.get<GameDetail>(`/api/games/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Jogo não encontrado');
      }
      throw error;
    }
  },

  getGameBySlug: async (slug: string) => {
    try {
      const response = await api.get<GameDetail>(`/api/games/${slug}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Jogo não encontrado');
      }
      throw error;
    }
  },

  // Store - Categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao carregar categorias');
      }
      throw error;
    }
  },

  // Store - Library
  getUserLibrary: async () => {
    try {
      const response = await api.get('/api/library');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao carregar biblioteca');
      }
      throw error;
    }
  },

  // Store - Reviews
  addReview: async (gameId: number, rating: number, comment: string) => {
    try {
      const response = await api.post<Review>(`/api/games/${gameId}/review`, {
        rating,
        comment,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao enviar avaliação');
      }
      throw error;
    }
  },

  // Store - Purchases
  buyGame: async (gameId: number) => {
    try {
      const response = await api.post<{ success: boolean; new_balance: number }>(
        `/api/buy/${gameId}`,
        {}
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao comprar jogo');
      }
      throw error;
    }
  },

  // Store - Wishlist
  toggleWishlist: async (gameId: number) => {
    try {
      const response = await api.post<{ wishlisted: boolean }>(
        `/api/wishlist/toggle/${gameId}`,
        {}
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao atualizar lista de desejos');
      }
      throw error;
    }
  },

  getDownloadUrl: async (gameId: number): Promise<{ download_url: string; executable_name: string }> => {
    try {
      const response = await api.get<{ download_url: string; executable_name: string }>(
        `/api/games/${gameId}/download-url`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || 'Erro ao obter URL de download');
      }
      throw error;
    }
  },
} as const;

export default api;
