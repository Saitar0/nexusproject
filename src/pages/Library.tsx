import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import MainLayout from '../components/layout/MainLayout';
import GameCard from '../components/GameCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { apiService } from '../services/api';
import { useDownloads } from '../store/downloads';
import { Grid3x3, List, Download, Trash2, Play } from 'lucide-react';

const Library = () => {
  const navigate = useNavigate();
  const downloads = useDownloads();

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [installedGames, setInstalledGames] = useState<Set<number>>(new Set());
  const [activeDownloadGames, setActiveDownloadGames] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiService.getUserLibrary();
        setGames(response.games);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar biblioteca');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, []);

  // Monitora downloads completados
  useEffect(() => {
    const completedDownloads = downloads.completedDownloads();
    const installedSet = new Set<number>();

    completedDownloads.forEach((download) => {
      installedSet.add(download.gameId);
    });

    setInstalledGames(installedSet);

    // Remove de active downloads
    const activeSet = new Set<number>();
    downloads.activeDownloads().forEach((d) => {
      activeSet.add(d.gameId);
    });
    setActiveDownloadGames(activeSet);
  }, [downloads.downloads]);

  const handleInstall = async (game: any) => {
    try {
      // Obter URL de download do backend
      const downloadInfo = await apiService.getDownloadUrl(game.id);

      const downloadId = await invoke<string>('start_download', {
        request: {
          game_id: game.id,
          game_title: game.title,
          download_url: downloadInfo.download_url,
        },
      });

      downloads.addDownload({
        downloadId,
        gameId: game.id,
        gameTitle: game.title,
        status: 'pending',
        bytesDownloaded: 0,
        totalBytes: 0,
        percent: 0,
        speedMbps: 0,
        etaSeconds: 0,
        createdAt: Date.now(),
      });

      setActiveDownloadGames((prev) => new Set([...prev, game.id]));
    } catch (err) {
      console.error('Failed to start download:', err);
      alert('Erro ao iniciar download: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handlePlay = async (game: any) => {
    try {
      // Por enquanto, assume que o executável é "game.exe"
      // Isso será configurável no backend
      const executableName = game.executable_name || 'game.exe';

      await invoke('execute_game', {
        request: {
          game_id: game.id,
          game_title: game.title,
          executable_name: executableName,
        },
      });
    } catch (err) {
      console.error('Failed to execute game:', err);
      alert('Erro ao executar jogo: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Minha Biblioteca</h1>
            <p className="text-slate-400 mt-1">
              {games.length} {games.length === 1 ? 'jogo' : 'jogos'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent text-black'
                  : 'bg-sidebar text-slate-400 hover:text-white'
              }`}
              title="Visualização em grid"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-black'
                  : 'bg-sidebar text-slate-400 hover:text-white'
              }`}
              title="Visualização em lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-md text-red-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Sua biblioteca está vazia
            </h3>
            <p className="text-slate-400 mb-4">
              Compre jogos na Store para adicioná-los à sua biblioteca
            </p>
            <Button
              onClick={() => navigate('/store')}
              className="bg-accent hover:bg-accent/90"
            >
              Ir para Store
            </Button>
          </div>
        )}

        {/* Grid View */}
        {!loading && games.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <div key={game.id} className="relative group">
                <GameCard game={game} />

                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  {installedGames.has(game.id) ? (
                    <button
                      onClick={() => handlePlay(game)}
                      className="p-3 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors"
                      title="Jogar"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  ) : activeDownloadGames.has(game.id) ? (
                    <div className="text-white text-sm">Baixando...</div>
                  ) : (
                    <button
                      onClick={() => handleInstall(game)}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                      title="Instalar"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="p-3 bg-accent hover:bg-accent/90 rounded-full text-black transition-colors"
                    title="Ver detalhes"
                  >
                    <Play className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => console.log('Remover:', game.id)}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                    title="Remover da biblioteca"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    installedGames.has(game.id)
                      ? 'bg-green-600 text-white'
                      : activeDownloadGames.has(game.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-200'
                  }`}>
                    {installedGames.has(game.id)
                      ? '✓ Instalado'
                      : activeDownloadGames.has(game.id)
                      ? '⬇ Baixando'
                      : 'Não instalado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && games.length > 0 && viewMode === 'list' && (
          <div className="space-y-2">
            {games.map((game) => (
              <Card
                key={game.id}
                className="bg-sidebar border-slate-700 hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Cover */}
                  <img
                    src={game.cover_image || '/default-game.png'}
                    alt={game.title}
                    className="w-20 h-20 rounded object-cover"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {game.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {game.category?.name}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        installedGames.has(game.id)
                          ? 'bg-green-900/30 text-green-300'
                          : activeDownloadGames.has(game.id)
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {installedGames.has(game.id)
                          ? '✓ Instalado'
                          : activeDownloadGames.has(game.id)
                          ? '⬇ Baixando'
                          : 'Não instalado'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {game.downloads} downloads
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {installedGames.has(game.id) ? (
                      <button
                        onClick={() => handlePlay(game)}
                        className="p-2 hover:bg-green-600/20 text-green-400 rounded transition-colors"
                        title="Jogar"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    ) : activeDownloadGames.has(game.id) ? (
                      <div className="text-blue-400 text-xs">Baixando...</div>
                    ) : (
                      <button
                        onClick={() => handleInstall(game)}
                        className="p-2 hover:bg-blue-600/20 text-blue-400 rounded transition-colors"
                        title="Instalar"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => console.log('Remover:', game.id)}
                      className="p-2 hover:bg-red-600/20 text-red-400 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Price Info */}
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Comprado por</p>
                    <p className="text-sm font-semibold text-accent">
                      R${game.final_price}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Library;
