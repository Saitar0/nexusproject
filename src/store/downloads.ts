import { create } from 'zustand';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export type { UnlistenFn };

export interface Download {
  downloadId: string;
  gameId: number;
  gameTitle: string;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
  speedMbps: number;
  etaSeconds: number;
  error?: string;
  createdAt: number;
}

export interface DownloadsStore {
  downloads: Map<string, Download>;
  activeDownloads: () => Download[];
  completedDownloads: () => Download[];
  failedDownloads: () => Download[];
  addDownload: (download: Download) => void;
  updateDownload: (downloadId: string, partial: Partial<Download>) => void;
  removeDownload: (downloadId: string) => void;
  pauseDownload: (downloadId: string) => void;
  resumeDownload: (downloadId: string) => void;
  cancelDownload: (downloadId: string) => void;
  clearCompleted: () => void;
  initializeEventListeners: () => Promise<UnlistenFn[]>;
}

export const useDownloads = create<DownloadsStore>((set, get) => ({
  downloads: new Map(),

  activeDownloads: () => {
    const downloads = Array.from(get().downloads.values());
    return downloads.filter(
      (d) =>
        d.status === 'downloading' ||
        d.status === 'pending' ||
        d.status === 'paused'
    );
  },

  completedDownloads: () => {
    const downloads = Array.from(get().downloads.values());
    return downloads.filter((d) => d.status === 'completed');
  },

  failedDownloads: () => {
    const downloads = Array.from(get().downloads.values());
    return downloads.filter((d) => d.status === 'error');
  },

  addDownload: (download) => {
    set((state) => {
      const newMap = new Map(state.downloads);
      newMap.set(download.downloadId, download);
      return { downloads: newMap };
    });
  },

  updateDownload: (downloadId, partial) => {
    set((state) => {
      const existing = state.downloads.get(downloadId);
      if (!existing) return state;

      const updated = { ...existing, ...partial };
      const newMap = new Map(state.downloads);
      newMap.set(downloadId, updated);
      return { downloads: newMap };
    });
  },

  removeDownload: (downloadId) => {
    set((state) => {
      const newMap = new Map(state.downloads);
      newMap.delete(downloadId);
      return { downloads: newMap };
    });
  },

  pauseDownload: (downloadId) => {
    const download = get().downloads.get(downloadId);
    if (download && download.status === 'downloading') {
      get().updateDownload(downloadId, { status: 'paused' });
    }
  },

  resumeDownload: (downloadId) => {
    const download = get().downloads.get(downloadId);
    if (download && download.status === 'paused') {
      get().updateDownload(downloadId, { status: 'downloading' });
    }
  },

  cancelDownload: (downloadId) => {
    const download = get().downloads.get(downloadId);
    if (download && (download.status === 'downloading' || download.status === 'paused')) {
      get().removeDownload(downloadId);
    }
  },

  clearCompleted: () => {
    set((state) => {
      const newMap = new Map(state.downloads);
      for (const [id, download] of newMap.entries()) {
        if (download.status === 'completed') {
          newMap.delete(id);
        }
      }
      return { downloads: newMap };
    });
  },

  initializeEventListeners: async () => {
    const unlisteners: UnlistenFn[] = [];

    try {
      // Progress event
      const unlistenProgress = await listen<any>('download-progress', (event) => {
        const { download_id, game_id, progress } = event.payload;
        if (progress) {
          const download = get().downloads.get(download_id);
          if (!download) {
            get().addDownload({
              downloadId: download_id,
              gameId: game_id,
              gameTitle: '',
              status: 'downloading',
              bytesDownloaded: progress.bytes_downloaded,
              totalBytes: progress.total_bytes,
              percent: progress.percent,
              speedMbps: progress.speed_mbps,
              etaSeconds: progress.eta_seconds,
              createdAt: Date.now(),
            });
          } else {
            get().updateDownload(download_id, {
              status: 'downloading',
              bytesDownloaded: progress.bytes_downloaded,
              totalBytes: progress.total_bytes,
              percent: progress.percent,
              speedMbps: progress.speed_mbps,
              etaSeconds: progress.eta_seconds,
            });
          }
        }
      });
      unlisteners.push(unlistenProgress);

      // Completion event
      const unlistenCompleted = await listen<any>('download-completed', (event) => {
        const { download_id } = event.payload;
        get().updateDownload(download_id, {
          status: 'completed',
          percent: 100,
          etaSeconds: 0,
        });
      });
      unlisteners.push(unlistenCompleted);

      // Error event
      const unlistenError = await listen<any>('download-error', (event) => {
        const { download_id, message } = event.payload;
        get().updateDownload(download_id, {
          status: 'error',
          error: message,
        });
      });
      unlisteners.push(unlistenError);

      // Cancellation event
      const unlistenCancelled = await listen<any>('download-cancelled', (event) => {
        const { download_id } = event.payload;
        get().removeDownload(download_id);
      });
      unlisteners.push(unlistenCancelled);
    } catch (error) {
      console.error('Failed to initialize download event listeners:', error);
    }

    return unlisteners;
  },
}));
