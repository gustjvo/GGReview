import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import './GameDetail.css';

function ratingClass(r) {
  if (r >= 7) return 'rating-high';
  if (r >= 5) return 'rating-mid';
  return 'rating-low';
}

export default function GameDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [game,    setGame]    = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,    setForm]    = useState({ rating: 7, title: '', body: '', pros: [''], cons: [''], recommended: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/reviews/game/${id}?limit=20`),
    ]).then(([gRes, rRes]) => {
      setGame(gRes.data);
      setReviews(rRes.data.reviews);
    }).finally(() => setLoading(false));
  }, [id]);

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true); setError('');
    try {
      const payload = {
        game: id,
        rating: form.rating,
        title: form.title,
        body: form.body,
        pros: form.pros.filter(Boolean),
        cons: form.cons.filter(Boolean),
        recommended: form.recommended,
      };
      const { data } = await api.post('/reviews', payload);
      setReviews(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ rating: 7, title: '', body: '', pros: [''], cons: [''], recommended: true });
      const gRes = await api.get(`/games/${id}`);
      setGame(gRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm('Remover seu review?')) return;
    await api.delete(`/reviews/${reviewId}`);
    setReviews(prev => prev.filter(r => r._id !== reviewId));
    const gRes = await api.get(`/games/${id}`);
    setGame(gRes.data);
  }

  function addPro()  { setForm(f => ({ ...f, pros: [...f.pros, ''] })); }
  function addCon()  { setForm(f => ({ ...f, cons: [...f.cons, ''] })); }
  function setPro(i, v) { setForm(f => { const p = [...f.pros]; p[i] = v; return { ...f, pros: p }; }); }
  function setCon(i, v) { setForm(f => { const c = [...f.cons]; c[i] = v; return { ...f, cons: c }; }); }

  if (loading) return <div className="spinner" style={{marginTop: 80}} />;
  if (!game)   return <div className="container" style={{padding:'60px 0'}}><p>Jogo não encontrado.</p></div>;

  const cover = game.coverImage || `https://placehold.co/800x400/111118/444460?text=${encodeURIComponent(game.title)}`;
  const alreadyReviewed = user && reviews.some(r => r.user?._id === user._id || r.user === user._id);

  return (
    <div className="game-detail">
      {/* Cover banner */}
      <div className="game-banner" style={{backgroundImage: `url(${cover})`}}>
        <div className="game-banner-overlay" />
        <div className="container game-banner-content">
          <div className="game-title-row">
            <h1 className="page-title">{game.title}</h1>
            {game.avgRating > 0 && (
              <div className={`rating-pill big-rating ${ratingClass(game.avgRating)}`}>
                ★ {game.avgRating}
              </div>
            )}
          </div>
          <div className="game-tags">
            {game.genre?.map(g   => <span key={g}   className="badge">{g}</span>)}
            {game.platform?.map(p => <span key={p}   className="badge">🎮 {p}</span>)}
            {game.releaseYear && <span className="badge">📅 {game.releaseYear}</span>}
          </div>
        </div>
      </div>

      <div className="container game-body">
        <div className="game-main">
          {/* Info */}
          {(game.description || game.developer) && (
            <section className="info-card card">
              {game.description && <p className="game-desc">{game.description}</p>}
              <div className="game-info-grid">
                {game.developer  && <div><span className="info-label">Desenvolvedora</span><span>{game.developer}</span></div>}
                {game.publisher  && <div><span className="info-label">Publicadora</span><span>{game.publisher}</span></div>}
                {game.addedBy    && <div><span className="info-label">Cadastrado por</span><span>@{game.addedBy.username}</span></div>}
              </div>
            </section>
          )}

          {/* Reviews header */}
          <div className="reviews-header">
            <h2 className="section-h2">Reviews <span className="muted">({reviews.length})</span></h2>
            {user && !alreadyReviewed && (
              <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
                {showForm ? '✕ Cancelar' : '+ Escrever Review'}
              </button>
            )}
            {!user && (
              <Link to="/login" className="btn btn-ghost">Entrar para avaliar</Link>
            )}
            {alreadyReviewed && <span className="badge" style={{color:'var(--accent)'}}>✓ Você já avaliou</span>}
          </div>

          {/* Review Form */}
          {showForm && (
            <form className="review-form card" onSubmit={submitReview}>
              <h3>Seu Review</h3>
              {error && <p className="form-error" style={{marginBottom:12}}>{error}</p>}

              <div className="form-group">
                <label className="form-label">Nota (1–10)</label>
                <StarRating value={form.rating} onChange={v => setForm(f => ({...f, rating: v}))} />
              </div>

              <div className="form-group">
                <label className="form-label">Título do Review *</label>
                <input required value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Resumo da sua opinião" />
              </div>

              <div className="form-group">
                <label className="form-label">Review Completo *</label>
                <textarea required minLength={20} value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} placeholder="Escreva sua análise detalhada..." rows={5} />
              </div>

              <div className="pros-cons-grid">
                <div className="form-group">
                  <label className="form-label">✅ Pontos Positivos</label>
                  {form.pros.map((p, i) => (
                    <input key={i} value={p} onChange={e => setPro(i, e.target.value)} placeholder={`Ponto positivo ${i+1}`} style={{marginBottom:6}} />
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addPro} style={{marginTop:4}}>+ Adicionar</button>
                </div>
                <div className="form-group">
                  <label className="form-label">❌ Pontos Negativos</label>
                  {form.cons.map((c, i) => (
                    <input key={i} value={c} onChange={e => setCon(i, e.target.value)} placeholder={`Ponto negativo ${i+1}`} style={{marginBottom:6}} />
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addCon} style={{marginTop:4}}>+ Adicionar</button>
                </div>
              </div>

              <div className="form-group recommend-toggle">
                <label className="form-label">Recomenda?</label>
                <div className="toggle-btns">
                  <button type="button" className={`toggle-btn ${form.recommended ? 'active-yes' : ''}`} onClick={() => setForm(f=>({...f,recommended:true}))}>👍 Sim</button>
                  <button type="button" className={`toggle-btn ${!form.recommended ? 'active-no' : ''}`} onClick={() => setForm(f=>({...f,recommended:false}))}>👎 Não</button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Publicar Review'}
              </button>
            </form>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="empty-state"><div className="icon">📝</div><p>Nenhum review ainda. Seja o primeiro!</p></div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review._id} className="review-card card">
                  <div className="review-top">
                    <div className="reviewer-info">
                      <div className="avatar-circle">{review.user?.username?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <strong>@{review.user?.username || 'Usuário'}</strong>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="review-top-right">
                      <div className={`rating-pill ${ratingClass(review.rating)}`}>★ {review.rating}/10</div>
                      <span className={`recommend-badge ${review.recommended ? 'yes' : 'no'}`}>
                        {review.recommended ? '👍 Recomenda' : '👎 Não recomenda'}
                      </span>
                      {user && (user._id === review.user?._id || user._id === review.user) && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteReview(review._id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                  <h4 className="review-title">{review.title}</h4>
                  <p className="review-body">{review.body}</p>
                  {(review.pros?.length > 0 || review.cons?.length > 0) && (
                    <div className="review-pros-cons">
                      {review.pros?.filter(Boolean).length > 0 && (
                        <div className="pros">
                          <strong>✅ Pontos Positivos</strong>
                          <ul>{review.pros.filter(Boolean).map((p,i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                      {review.cons?.filter(Boolean).length > 0 && (
                        <div className="cons">
                          <strong>❌ Pontos Negativos</strong>
                          <ul>{review.cons.filter(Boolean).map((c,i) => <li key={i}>{c}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
