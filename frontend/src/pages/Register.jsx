import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Form.css';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('As senhas não coincidem.');
    if (form.password.length < 6) return setError('Senha deve ter no mínimo 6 caracteres.');
    setLoading(true); setError('');
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="form-page container">
      <div className="form-box card">
        <h1 className="page-title" style={{fontSize:'2rem', marginBottom:8}}>CRIAR CONTA</h1>
        <p style={{color:'var(--muted)', marginBottom:28, fontSize:14}}>
          Junte-se à comunidade GameVault!
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input required minLength={3} maxLength={20} value={form.username} onChange={e => set('username', e.target.value)} placeholder="seu_username" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <input type="password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px', marginTop:8}} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="divider">ou</div>
        <p style={{textAlign:'center', fontSize:14, color:'var(--muted)'}}>
          Já tem conta? <Link to="/login" style={{color:'var(--accent)', fontWeight:600}}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
