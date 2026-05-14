import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Form.css';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form,   setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page container">
      <div className="form-box card">
        <h1 className="page-title" style={{fontSize:'2rem', marginBottom:8}}>ENTRAR</h1>
        <p style={{color:'var(--muted)', marginBottom:28, fontSize:14}}>
          Bem-vindo de volta, gamer!
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="seu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px', marginTop:8}} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="divider">ou</div>
        <p style={{textAlign:'center', fontSize:14, color:'var(--muted)'}}>
          Não tem conta? <Link to="/register" style={{color:'var(--accent)', fontWeight:600}}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
