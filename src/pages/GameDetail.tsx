import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { apiService } from '../services/api';
import { useAuth } from '../hooks';
import { Star, Heart, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        setError('');

        if (!id) {
          setError('Jogo não encontrado');
          return;
        }

        const gameData = await apiService.getGameById(parseInt(id));
        setGame(gameData);
        setWishlisted(gameData.wishlisted || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar jogo');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [id]);

  const handleBuyGame = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!game) return;

    try {
      setPurchasing(true);
      await apiService.buyGame(game.id);
      setGame({ ...game, owned: true });
      // Mostrar notificação de sucesso
      alert(`${game.title} foi adicionado à sua biblioteca!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao comprar jogo');
    } finally {
      setPurchasing(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!game) return;

    try {
      const result = await apiService.toggleWishlist(game.id);
      setWishlisted(result.wishlisted);
    } catch (err) {
      console.error('Erro ao atualizar wishlist:', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400">Carregando jogo...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !game) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error || 'Jogo não encontrado'}</p>
          <Button
            onClick={() => navigate('/store')}
            className="bg-accent hover:bg-accent/90"
          >
            Voltar para a Store
          </Button>
        </div>
      </MainLayout>
    );
  }

  const screenshots = game.screenshots || [];
  const hasScreenshots = screenshots.length > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/store')}
          className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Store
        </button>

        {/* Banner */}
        <div className="relative w-full h-80 rounded-lg overflow-hidden bg-sidebar border border-slate-700">
          <img
            src={game.cover_image || '/default-game.png'}
            alt={game.title}
            className="w-full h-full object-cover"
          />

          {/* Featured Badge */}
          {game.featured && (
            <div className="absolute top-4 left-4 bg-accent text-black px-4 py-2 rounded-lg font-bold">
              DESTAQUE
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4">
            {game.is_free ? (
              <div className="bg-green-600 text-white px-6 py-3 rounded-lg text-xl font-bold">
                GRÁTIS
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <div className="text-white text-sm font-semibold mb-1">
                  {game.discount > 0 && <span className="text-red-400">-{game.discount}%</span>}
                </div>
                <div className="bg-accent text-black px-6 py-3 rounded-lg text-xl font-bold">
                  R${game.final_price}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Info */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{game.title}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                {game.category && (
                  <span>{game.category.name}</span>
                )}
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400">{game.avg_rating} / 5</span>
                </div>
                <span>•</span>
                <span>{game.downloads} downloads</span>
              </div>
            </div>

            {/* Description */}
            <Card className="bg-sidebar border-slate-700">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-white mb-4">Descrição</h2>
                <p className="text-slate-300 whitespace-pre-wrap">{game.description}</p>
              </CardContent>
            </Card>

            {/* Screenshots */}
            {hasScreenshots && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Screenshots</h2>
                <div className="relative">
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-background border border-slate-700">
                    <img
                      src={screenshots[currentScreenshot] || '/default-screenshot.png'}
                      alt={`Screenshot ${currentScreenshot + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Carousel Controls */}
                  {screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentScreenshot((prev) =>
                            prev === 0 ? screenshots.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <button
                        onClick={() =>
                          setCurrentScreenshot((prev) =>
                            prev === screenshots.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Indicators */}
                      <div className="flex gap-2 mt-4 justify-center">
                        {screenshots.map((_: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentScreenshot(idx)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              idx === currentScreenshot ? 'bg-accent' : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            {game.reviews && game.reviews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Avaliações</h2>
                <div className="space-y-3">
                  {game.reviews.map((review: any, idx: number) => (
                    <Card key={idx} className="bg-sidebar border-slate-700">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-white">
                              {review.user.display_name}
                            </p>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* System Requirements */}
            {game.requirements && (
              <Card className="bg-sidebar border-slate-700">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Requisitos do Sistema
                  </h2>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm">
                    {game.requirements}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Buy Button */}
            {game.owned ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                <p className="text-green-200 font-semibold">✓ Você possui este jogo</p>
                <Button
                  onClick={() => navigate('/library')}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Ir para Biblioteca
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleBuyGame}
                disabled={purchasing}
                className="w-full bg-accent hover:bg-accent/90 text-base py-6"
              >
                {purchasing ? 'Processando...' : `Comprar por R$${game.final_price}`}
              </Button>
            )}

            {/* Wishlist Button */}
            <Button
              onClick={handleToggleWishlist}
              variant="outline"
              className={`w-full border-slate-700 ${
                wishlisted ? 'bg-red-900/20 text-red-400' : 'text-slate-400'
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 ${wishlisted ? 'fill-current' : ''}`} />
              {wishlisted ? 'Na Wishlist' : 'Adicionar à Wishlist'}
            </Button>

            {/* Share Button */}
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-400"
              onClick={() => {
                const url = `${window.location.origin}/game/${game.id}`;
                navigator.clipboard.writeText(url);
                alert('Link copiado!');
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>

            {/* Game Info Card */}
            <Card className="bg-sidebar border-slate-700">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400">DESENVOLVEDOR</p>
                  <p className="text-white font-semibold">
                    {game.developer?.display_name || 'Desconhecido'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">VERSÃO</p>
                  <p className="text-white">{game.version}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">TAMANHO</p>
                  <p className="text-white">{game.file_size}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">LANÇAMENTO</p>
                  <p className="text-white">
                    {new Date(game.approved_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GameDetail;
