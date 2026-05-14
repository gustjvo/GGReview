import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import GameCard from '../components/GameCard';
import { useAuth } from '../context/AuthContext';
import './GamesPage.css';

export default function GamesPage() {
  const { user } = useAuth();
  const [games,   setGames]   = useState([]);
  const [filters, setFilters] = useState({ genres: [], platforms: [] });
  const [params,  setParams]  = useState({ search: '', genre: '', platform: '', sort: 'avgRating', page: 1 });
  const [meta,    setMeta]    = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/games/meta/filters').then(({ data }) => setFilters(data));
  }, []);

  const fetchGames = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ ...params, limit: 12 });
    api.get(`/games?${q}`)
      .then(({ data }) => { setGames(data.games); setMeta({ total: data.total, pages: data.pages }); })
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  function set(key, value) { setParams(p => ({ ...p, [key]: value, page: 1 })); }

  return (
    <div className="games-page container">
      <div className="games-header">
        <h1 className="page-title">JOGOS</h1>
        {user && <Link to="/add-game" className="btn btn-primary">+ Cadastrar Jogo</Link>}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="search" placeholder="🔍 Buscar jogo..."
          value={params.search}
          onChange={e => set('search', e.target.value)}
          className="search-input"
        />
        <select value={params.genre} onChange={e => set('genre', e.target.value)}>
          <option value="">Todos os Gêneros</option>
          {filters.genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={params.platform} onChange={e => set('platform', e.target.value)}>
          <option value="">Todas as Plataformas</option>
          {filters.platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={params.sort} onChange={e => set('sort', e.target.value)}>
          <option value="avgRating">Melhor Avaliados</option>
          <option value="newest">Mais Recentes</option>
          <option value="title">A-Z</option>
        </select>
      </div>

      <p className="results-count">{meta.total} jogo{meta.total !== 1 ? 's' : ''} encontrado{meta.total !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="spinner" />
      ) : games.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🕹️</div>
          <p>Nenhum jogo encontrado. <Link to="/add-game" style={{color:'var(--accent)'}}>Cadastre um!</Link></p>
        </div>
      ) : (
        <>
          <div className="games-grid">
            {games.map(g => <GameCard key={g._id} game={g} />)}
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="pagination">
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${params.page === p ? 'active' : ''}`}
                  onClick={() => setParams(prev => ({ ...prev, page: p }))}
                >{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
