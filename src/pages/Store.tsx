import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import GameCard from '../components/GameCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { apiService } from '../services/api';
import { useAppStore } from '../store';
import { Search, Grid3x3, ChevronDown } from 'lucide-react';

const Store = () => {
  const categories = useAppStore((state) => state.categories);
  const setCategories = useAppStore((state) => state.setCategories);

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carregar categorias ao montar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (categories.length === 0) {
          const response = await apiService.getCategories();
          setCategories(response.categories);
        }
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    };

    loadCategories();
  }, []);

  // Carregar jogos
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiService.getGames({
          page,
          per_page: 12,
          q: searchQuery,
          category: selectedCategory,
          sort: sortBy,
          price: priceFilter,
        });

        setGames(response.games);
        setTotalPages(response.pages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar jogos');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [page, searchQuery, selectedCategory, sortBy, priceFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    setPage(1);
  };

  const handlePriceChange = (price: typeof priceFilter) => {
    setPriceFilter(price);
    setPage(1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar jogos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-sidebar border-slate-700"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 bg-sidebar border border-slate-700 rounded-md text-white appearance-none cursor-pointer"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as any)}
                className="w-full px-4 py-2 bg-sidebar border border-slate-700 rounded-md text-white appearance-none cursor-pointer"
              >
                <option value="newest">Mais recentes</option>
                <option value="popular">Mais populares</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Price Filter */}
            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e) => handlePriceChange(e.target.value as any)}
                className="w-full px-4 py-2 bg-sidebar border border-slate-700 rounded-md text-white appearance-none cursor-pointer"
              >
                <option value="all">Todos os preços</option>
                <option value="free">Grátis</option>
                <option value="paid">Pagos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* View Mode (placeholder) */}
            <div className="flex items-center justify-end">
              <button className="p-2 hover:bg-sidebar rounded-md transition-colors" title="Grid view">
                <Grid3x3 className="w-5 h-5 text-accent" />
              </button>
            </div>
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
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum jogo encontrado
            </h3>
            <p className="text-slate-400 mb-4">
              Tente ajustar seus filtros ou faça uma nova busca
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSortBy('newest');
                setPriceFilter('all');
                setPage(1);
              }}
              className="bg-accent hover:bg-accent/90"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Games Grid */}
        {!loading && games.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onWishlist={(id) => console.log('Wishlist:', id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-sidebar hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </Button>

                <div className="text-slate-400">
                  Página {page} de {totalPages}
                </div>

                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="bg-sidebar hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Store;
