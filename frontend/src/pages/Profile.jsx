import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function ratingClass(r) {
  if (r >= 7) return 'rating-high';
  if (r >= 5) return 'rating-mid';
  return 'rating-low';
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get(`/reviews/user/${user._id}`)
      .then(({ data }) => setReviews(data))
      .finally(() => setLoading(false));
  }, [user]);

  function handleLogout() { logout(); navigate('/'); }

  if (!user) return null;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="profile-page container">
      {/* Header */}
      <div className="profile-header card">
        <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h1 className="page-title" style={{fontSize:'2rem'}}>@{user.username}</h1>
          <p style={{color:'var(--muted)', fontSize:14}}>{user.email}</p>
          <div className="profile-stats">
            <div className="stat"><span className="stat-num">{reviews.length}</span><span className="stat-label">Reviews</span></div>
            {avgRating && <div className="stat"><span className="stat-num">{avgRating}</span><span className="stat-label">Média</span></div>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{marginLeft:'auto', alignSelf:'flex-start'}}>Sair</button>
      </div>

      {/* Reviews */}
      <h2 className="section-h2" style={{marginBottom:20}}>Seus Reviews</h2>

      {loading ? <div className="spinner" /> : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <p>Você ainda não escreveu nenhum review.</p>
          <Link to="/games" className="btn btn-primary" style={{marginTop:16}}>Explorar Jogos</Link>
        </div>
      ) : (
        <div className="profile-reviews">
          {reviews.map(review => (
            <Link key={review._id} to={`/games/${review.game?._id}`} className="profile-review-card card">
              <div className="prc-cover">
                <img
                  src={review.game?.coverImage || `https://placehold.co/80x80/111118/444460?text=${encodeURIComponent(review.game?.title || '')}`}
                  alt={review.game?.title}
                />
              </div>
              <div className="prc-body">
                <div className="prc-top">
                  <strong>{review.game?.title}</strong>
                  <div className={`rating-pill ${ratingClass(review.rating)}`}>★ {review.rating}/10</div>
                </div>
                <p className="prc-title">{review.title}</p>
                <p className="prc-date">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
