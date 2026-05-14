import { Link } from 'react-router-dom';
import './GameCard.css';

function ratingClass(r) {
  if (r >= 7) return 'rating-high';
  if (r >= 5) return 'rating-mid';
  return 'rating-low';
}

function ratingEmoji(r) {
  if (r >= 8) return '🔥';
  if (r >= 6) return '👍';
  if (r >= 4) return '😐';
  return '👎';
}

export default function GameCard({ game }) {
  const cover = game.coverImage || `https://placehold.co/400x220/111118/444460?text=${encodeURIComponent(game.title)}`;

  return (
    <Link to={`/games/${game._id}`} className="game-card card">
      <div className="game-card-cover">
        <img src={cover} alt={game.title} loading="lazy" />
        {game.avgRating > 0 && (
          <div className={`game-rating-badge rating-pill ${ratingClass(game.avgRating)}`}>
            {ratingEmoji(game.avgRating)} {game.avgRating}
          </div>
        )}
      </div>
      <div className="game-card-body">
        <h3 className="game-card-title">{game.title}</h3>
        <div className="game-card-meta">
          {game.genre?.slice(0, 2).map(g => <span key={g} className="badge">{g}</span>)}
        </div>
        <div className="game-card-footer">
          <span className="game-reviews">{game.reviewCount} review{game.reviewCount !== 1 ? 's' : ''}</span>
          {game.releaseYear && <span className="game-year">{game.releaseYear}</span>}
        </div>
      </div>
    </Link>
  );
}
