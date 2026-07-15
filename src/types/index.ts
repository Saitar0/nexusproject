export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: 'admin' | 'developer' | 'client';
  balance: number;
  avatar?: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  images: string[];
  rating: number;
}

export interface Purchase {
  id: string;
  userId: string;
  gameId: string;
  purchaseDate: string;
  price: number;
}

export interface DownloadItem {
  id: string;
  gameId: string;
  progress: number;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  size: number;
  downloadedSize: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  gameId: string;
  addedDate: string;
}

export interface Review {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  comment: string;
  createdDate: string;
}
