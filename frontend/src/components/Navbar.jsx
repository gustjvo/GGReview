import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎮</span>
          <span className="logo-text">GAME<span className="logo-accent">VAULT</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/games" className={`nav-link ${isActive('/games')}`}>Jogos</Link>
          {user && <Link to="/add-game" className={`nav-link ${isActive('/add-game')}`}>+ Cadastrar Jogo</Link>}
        </div>

        <div className="navbar-auth">
          {user ? (
            <>
              <Link to="/profile" className="nav-user">
                <div className="avatar-circle">{user.username[0].toUpperCase()}</div>
                <span>{user.username}</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Cadastrar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
