import { useEffect, useState } from 'react';
import { useDownloads, UnlistenFn } from '../store/downloads';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Pause, Play, X, Trash2, Download } from 'lucide-react';

function DownloadsPage() {
  const downloads = useDownloads();
  const [unlisteners, setUnlisteners] = useState<UnlistenFn[]>([]);

  useEffect(() => {
    // Initialize event listeners
    downloads.initializeEventListeners().then((listeners) => {
      setUnlisteners(listeners);
    });

    return () => {
      // Clean up listeners
      unlisteners.forEach((fn) => fn());
    };
  }, []);

  const activeDownloads = downloads.activeDownloads();
  const completedDownloads = downloads.completedDownloads();
  const failedDownloads = downloads.failedDownloads();

  const handlePause = async (downloadId: string) => {
    try {
      await invoke('pause_download', { downloadId });
      downloads.pauseDownload(downloadId);
    } catch (error) {
      console.error('Failed to pause download:', error);
    }
  };

  const handleResume = async (downloadId: string) => {
    try {
      await invoke('resume_download', { downloadId });
      downloads.resumeDownload(downloadId);
    } catch (error) {
      console.error('Failed to resume download:', error);
    }
  };

  const handleCancel = async (downloadId: string) => {
    try {
      await invoke('cancel_download', { downloadId });
      downloads.removeDownload(downloadId);
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Downloads</h1>
          </div>
          <p className="text-gray-400">Gerenciar downloads de jogos</p>
        </div>

        {/* Active Downloads Section */}
        {activeDownloads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Downloads Ativos</h2>
            <div className="space-y-4">
              {activeDownloads.map((download: any) => (
                <Card key={download.downloadId} className="bg-gray-800 border-gray-700 p-4">
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-white font-semibold">Game #{download.gameId}</h3>
                        <p className="text-sm text-gray-400">
                          {formatBytes(download.bytesDownloaded)} / {formatBytes(download.totalBytes)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{download.percent.toFixed(1)}%</p>
                        <p className="text-sm text-gray-400">{download.speedMbps.toFixed(2)} MB/s</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all"
                      style={{ width: `${download.percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      ETA: {formatTime(download.etaSeconds)}
                    </div>

                    <div className="flex gap-2">
                      {download.status === 'downloading' ? (
                        <Button
                          size="sm"
                          onClick={() => handlePause(download.downloadId)}
                          variant="outline"
                          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pausar
                        </Button>
                      ) : download.status === 'paused' ? (
                        <Button
                          size="sm"
                          onClick={() => handleResume(download.downloadId)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Retomar
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        onClick={() => handleCancel(download.downloadId)}
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Downloads Section */}
        {completedDownloads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Concluídos</h2>
            <div className="space-y-2">
              {completedDownloads.map((download: any) => (
                <Card key={download.downloadId} className="bg-gray-800 border-gray-700 border-green-700 p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">Game #{download.gameId}</p>
                      <p className="text-sm text-green-400">✓ Download concluído</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloads.removeDownload(download.downloadId)}
                      variant="outline"
                      className="border-gray-600 text-gray-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Failed Downloads Section */}
        {failedDownloads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Erros</h2>
            <div className="space-y-2">
              {failedDownloads.map((download: any) => (
                <Card key={download.downloadId} className="bg-gray-800 border-red-700 p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">Game #{download.gameId}</p>
                      <p className="text-sm text-red-400">✗ {download.error || 'Erro desconhecido'}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloads.removeDownload(download.downloadId)}
                      variant="outline"
                      className="border-red-600 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeDownloads.length === 0 && completedDownloads.length === 0 && failedDownloads.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 p-12 text-center">
            <Download className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum download ativo no momento</p>
            <p className="text-sm text-gray-500 mt-2">
              Acesse a biblioteca para instalar seus jogos
            </p>
          </Card>
        )}

        {/* Clear Completed Button */}
        {completedDownloads.length > 0 && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => downloads.clearCompleted()}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Limpar Concluídos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DownloadsPage;
