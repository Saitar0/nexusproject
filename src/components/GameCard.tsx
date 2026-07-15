import { GamePreview } from '../services/api';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';

interface GameCardProps {
  game: GamePreview;
  onWishlist?: (id: number) => void;
}

const GameCard = ({ game, onWishlist }: GameCardProps) => {
  
  return (
    <Link
      to={`/game/${game.id}`}
      className="group cursor-pointer"
    >
      <div className="bg-sidebar rounded-lg overflow-hidden border border-slate-700 hover:border-accent transition-all hover:shadow-lg hover:shadow-accent/20">
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden bg-background">
          <img
            src={game.cover_image || '/default-game.png'}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Discount Badge */}
          {game.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              -{game.discount}%
            </div>
          )}
          
          {/* Free Badge */}
          {game.is_free && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
              GRÁTIS
            </div>
          )}
          
          {/* Featured Badge */}
          {game.featured && (
            <div className="absolute top-2 left-2 bg-accent text-black px-2 py-1 rounded text-xs font-bold">
              DESTAQUE
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
            {game.title}
          </h3>
          
          {/* Category */}
          {game.category && (
            <p className="text-xs text-slate-400 mt-1">{game.category.name}</p>
          )}
          
          {/* Description */}
          <p className="text-sm text-slate-300 mt-2 line-clamp-2">
            {game.short_description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-yellow-400">{game.avg_rating}</span>
            <span className="text-xs text-slate-500">({game.downloads} downloads)</span>
          </div>

          {/* Price & Wishlist */}
          <div className="flex items-center justify-between mt-4">
            <div>
              {game.is_free ? (
                <span className="text-lg font-bold text-green-400">Grátis</span>
              ) : (
                <div>
                  <span className="text-lg font-bold text-accent">R${game.final_price}</span>
                  {game.discount > 0 && (
                    <span className="text-sm text-slate-400 line-through ml-2">
                      R${game.price}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {onWishlist && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onWishlist(game.id);
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
