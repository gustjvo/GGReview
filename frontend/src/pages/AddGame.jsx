import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Form.css';

const GENRES    = ['Ação','Aventura','RPG','Estratégia','Simulação','Esportes','Corrida','Luta','Terror','Plataforma','Puzzle','FPS','MMORPG','Battle Royale','Indie'];
const PLATFORMS = ['PC','PlayStation 5','PlayStation 4','Xbox Series X/S','Xbox One','Nintendo Switch','Mobile','Nintendo 3DS'];

export default function AddGame() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', genre: [], platform: [],
    developer: '', publisher: '', releaseYear: '', coverImage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!user) return (
    <div className="form-page container">
      <div className="form-box card">
        <p>Você precisa estar logado. <Link to="/login" style={{color:'var(--accent)'}}>Entrar</Link></p>
      </div>
    </div>
  );

  function toggleArr(key, val) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Título é obrigatório.');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/games', { ...form, releaseYear: form.releaseYear || undefined });
      navigate(`/games/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar jogo.');
    } finally {
      setLoading(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="form-page container">
      <div className="form-box card">
        <h1 className="page-title" style={{fontSize:'2rem', marginBottom:8}}>CADASTRAR JOGO</h1>
        <p style={{color:'var(--muted)', marginBottom:28, fontSize:14}}>
          Não encontrou o jogo que queria avaliar? Cadastre ele aqui!
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nome do jogo" />
          </div>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Breve descrição do jogo..." rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Desenvolvedora</label>
              <input value={form.developer} onChange={e => set('developer', e.target.value)} placeholder="Ex: FromSoftware" />
            </div>
            <div className="form-group">
              <label className="form-label">Publicadora</label>
              <input value={form.publisher} onChange={e => set('publisher', e.target.value)} placeholder="Ex: Bandai Namco" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ano de Lançamento</label>
              <input type="number" min="1970" max="2030" value={form.releaseYear} onChange={e => set('releaseYear', e.target.value)} placeholder="2024" />
            </div>
            <div className="form-group">
              <label className="form-label">URL da Capa (imagem)</label>
              <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {form.coverImage && (
            <div className="cover-preview">
              <img src={form.coverImage} alt="preview" onError={e => e.target.style.display='none'} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Gêneros</label>
            <div className="chip-grid">
              {GENRES.map(g => (
                <button key={g} type="button"
                  className={`chip ${form.genre.includes(g) ? 'active' : ''}`}
                  onClick={() => toggleArr('genre', g)}
                >{g}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Plataformas</label>
            <div className="chip-grid">
              {PLATFORMS.map(p => (
                <button key={p} type="button"
                  className={`chip ${form.platform.includes(p) ? 'active' : ''}`}
                  onClick={() => toggleArr('platform', p)}
                >{p}</button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}} disabled={loading}>
            {loading ? 'Cadastrando...' : '+ Cadastrar Jogo'}
          </button>
        </form>
      </div>
    </div>
  );
}
