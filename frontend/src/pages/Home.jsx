import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import GameCard from '../components/GameCard';
import './Home.css';

export default function Home() {
  const [topGames, setTopGames] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/games?sort=avgRating&limit=6')
      .then(({ data }) => setTopGames(data.games))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <p className="hero-eyebrow">✦ Comunidade de gamers</p>
          <h1 className="page-title hero-title">
            AVALIE, EXPLORE<br />
            <span className="title-accent">& DESCUBRA</span><br />
            JOGOS INCRÍVEIS
          </h1>
          <p className="hero-sub">
            Compartilhe sua opinião, leia reviews da comunidade e encontre
            seu próximo jogo favorito.
          </p>
          <div className="hero-actions">
            <Link to="/games"    className="btn btn-primary">Explorar Jogos</Link>
            <Link to="/register" className="btn btn-ghost">Criar Conta</Link>
          </div>
        </div>
      </section>

      {/* Top Games */}
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">🔥 Mais Bem Avaliados</h2>
          <Link to="/games" className="btn btn-ghost btn-sm">Ver todos →</Link>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : topGames.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎮</div>
            <p>Nenhum jogo ainda. <Link to="/add-game" style={{color:'var(--accent)'}}>Cadastre o primeiro!</Link></p>
          </div>
        ) : (
          <div className="games-grid">
            {topGames.map(g => <GameCard key={g._id} game={g} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="cta-section container">
        <div className="cta-box">
          <h2>Não achou seu jogo?</h2>
          <p>Cadastre ele na plataforma e seja o primeiro a deixar um review!</p>
          <Link to="/add-game" className="btn btn-primary">+ Cadastrar Jogo</Link>
        </div>
      </section>
    </div>
  );
}
