import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'; 
import { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import logoImg from './assets/logo site.png';


// NAVBAR (A barra de navegação lá em cima)
// token pra saber se o usuario da cadastrado ou nao
const Navbar = ({ token, setToken }) => {
  const navigate = useNavigate(); // ferramenta pra levar o usuario pra outra pagina

  // botao de sair
  const handleLogout = () => {
    localStorage.removeItem('token'); // tira o token
    setToken(null);
    navigate('/'); 
  };

  return (
    <nav className="flex items-center justify-between p-6 border-b border-gray-800">
      <div className="flex items-center space-x-8">
        
        {/* logo */}
        <Link to="/" className="flex items-center">
          <img src={logoImg} alt="Logo GameVault" className="h-20 w-auto object-contain" />
        </Link>
      </div>
      
      <div className="space-x-4">
        {/* Se ta logado mostra o botao sair.
            se nao ta mostra botao de entrar e cadastrar*/}
        {token ? (
          <>
            <button onClick={handleLogout} className="px-4 py-2 border border-gray-700 rounded-md hover:bg-gray-800">Sair</button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-4 py-2 border border-gray-700 rounded-md hover:bg-gray-800 transition">Entrar</Link>
            <Link to="/register" className="px-4 py-2 bg-brand-accent text-black font-semibold rounded-md hover:bg-yellow-400 transition">Cadastrar</Link>
          </>
        )}
      </div>
    </nav>
  );
};



// tela principal
const Home = ({ token }) => {

  const [topReviews, setTopReviews] = useState([]);

  // roda na hora que a tela inicial abre
  useEffect(() => {
    const fetchTopReviews = async () => {
      try {
        // puxa 3 reviews do back
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews?limit=3`);
        setTopReviews(res.data.reviews); 
      } catch (err) {
        console.error("Erro ao buscar top reviews", err);
      }
    };
    fetchTopReviews();
  }, []); 

  return (
    <div className="flex flex-col items-center justify-center mt-24 text-center px-4">
      {/* texto princiapl*/}
      <p className="text-brand-accent font-semibold mb-4 text-sm tracking-widest uppercase">✦ Comunidade de Gamers</p>
      <h1 className="text-6xl font-black mb-6 leading-tight max-w-3xl">
        AVALIE, EXPLORE <br /> <span className="text-brand-accent">& DESCUBRA</span> <br /> JOGOS INCRÍVEIS
      </h1>
      <p className="text-gray-400 mb-10 max-w-lg text-lg">
        Compartilhe sua opinião, leia reviews da comunidade e encontre seu próximo jogo favorito.
      </p>
      
      <div className="flex space-x-6">
        <Link to="/explore" className="px-8 py-3 bg-brand-accent text-black font-bold rounded-md hover:bg-yellow-400 transition">
          Explorar Jogos
        </Link>
        
        {/* criar conta so aparece se nao tiver logado */}
        {!token && (
          <Link to="/register" className="px-8 py-3 border border-gray-700 bg-brand-gray text-white font-bold rounded-md hover:bg-gray-800 transition">
            Criar Conta
          </Link>
        )}
      </div>

      <div className="w-full max-w-5xl mt-32 text-left pb-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">🔥 AVALIAÇÕES PRINCIPAIS</h2>
          <Link to="/explore" className="text-sm px-4 py-2 border border-gray-700 rounded-full hover:bg-gray-800 transition">Ver todos →</Link>
        </div>
        
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topReviews.length === 0 ? (
            <p className="text-gray-400">Nenhuma avaliação encontrada ainda.</p>
          ) : (
            topReviews.map((review) => (
              <div key={review._id} className="bg-brand-gray border border-gray-800 rounded-lg overflow-hidden flex flex-col">
                
                {/* se colocou imagem mostra, se nao mostra tela escrito sem imagem */}
                {review.imageUrl ? (
                  <img src={review.imageUrl} alt={review.gameName} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-[#0d0d12] flex items-center justify-center text-gray-600">
                    Sem Imagem
                  </div>
                )}
                
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-brand-accent truncate pr-2">{review.gameName}</h3>
                    <span className="text-xl">{review.recommend ? '👍' : '👎'}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Por: {review.author?.username || 'Anônimo'}</p>
                  <p className="text-gray-200 text-sm line-clamp-3">{review.reviewText}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};



// CRIAR REVIEW 
const CreateReview = ({ token }) => {
// Guardar tudo que a pessoa digita no formulário
  const [formData, setFormData] = useState({ gameName: '', imageUrl: '', reviewText: '', recommend: true });
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault(); 
    try {
      // Manda os dado digitado pro back (Corrigido aqui!)
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, formData, {
        headers: { Authorization: `Bearer ${token}` } // Mostra o token pro back
      });
      navigate('/explore'); 
    } catch (err) {
      alert('Erro ao criar review.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 bg-brand-gray border border-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-brand-accent">Deixar uma Review</h2>
      
      {/* Formulário: Cada vez que a pessoa digita algo (onChange), atualiza a nossa caixinha 'formData' na hora */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input type="text" placeholder="Nome do Jogo" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
          onChange={e => setFormData({...formData, gameName: e.target.value})} />
        
        <input type="url" placeholder="URL da Capa do Jogo (Opcional)" className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
          onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
        
        <textarea placeholder="Sua avaliação..." required rows="5" className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
          onChange={e => setFormData({...formData, reviewText: e.target.value})}></textarea>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" checked={formData.recommend} className="w-5 h-5 accent-brand-accent"
            onChange={e => setFormData({...formData, recommend: e.target.checked})} />
          <span>Eu recomendo este jogo</span>
        </label>
        
        <button type="submit" className="mt-4 p-3 bg-brand-accent text-black font-bold rounded hover:bg-yellow-400">Publicar Review</button>
      </form>
    </div>
  );
};


// Login
const Login = ({ setToken }) => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Entrar
  const handleLogin = async (e) => {
    e.preventDefault(); 
    try {
      // verificar o login (Corrigido aqui!)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, { username, password });
      
      // salvar o token no navegador para nao deslogar quando fechar
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token); 
      navigate('/explore'); // Manda pros jogos
    } catch (err) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="flex justify-center items-center mt-32">
      <div className="p-8 bg-brand-gray border border-gray-800 rounded-lg w-96 text-center">
        <h2 className="text-3xl font-bold mb-6">Entrar</h2>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input type="text" placeholder="Nome de usuário" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
            onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Senha" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
            onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="p-3 bg-brand-accent text-black font-bold rounded hover:bg-yellow-400">Entrar</button>
        </form>
      </div>
    </div>
  );
};



// REGISTER (Tela de criar conta)
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // manda pro back criar a conta com essas informacoes (Corrigido aqui!)
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, { username, email, password });
      alert('Conta criada com sucesso! Faça login.');
      navigate('/login');
    } catch (err) {
      const mensagemErro = err.response?.data?.details || err.response?.data?.error || 'Erro de conexão com o servidor.';
      alert(`Falha ao criar conta: ${mensagemErro}`);
    }
  };

  return (
    <div className="flex justify-center items-center mt-32">
      <div className="p-8 bg-brand-gray border border-gray-800 rounded-lg w-96 text-center">
        <h2 className="text-3xl font-bold mb-6 text-brand-accent">Criar Conta</h2>
        <form onSubmit={handleRegister} className="flex flex-col space-y-4">
          <input type="text" placeholder="Nome de usuário" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
            onChange={e => setUsername(e.target.value)} />
          <input type="email" placeholder="E-mail" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
            onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" required className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white"
            onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="p-3 bg-brand-accent text-black font-bold rounded hover:bg-yellow-400">Cadastrar</button>
        </form>
      </div>
    </div>
  );
};


// explore

const Explore = () => {
  const [reviews, setReviews] = useState([]); // guarda os jogos avaliados
  const [search, setSearch] = useState(''); // guarda o que digitou na pesquisa

  // cada vez que a pesquisa atualiza, refaz a busca sozinho la no back
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // (Corrigido aqui também!)
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews?search=${search}`);
        setReviews(res.data.reviews);
      } catch (err) {
        console.error("Erro ao buscar reviews", err);
      }
    };
    fetchReviews();
  }, [search]); // pesquisa atualiza na hora

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Explorar Jogos</h2>
        
        <div className="flex items-center gap-4">
          <Link to="/create" className="px-6 py-3 bg-brand-accent text-black font-bold rounded-md hover:bg-yellow-400 transition">
            Nova Review
          </Link>

          {/* Barra de pesquisa*/}
          <input 
            type="text" 
            placeholder="Pesquisar jogo..." 
            className="p-3 bg-[#0d0d12] border border-gray-700 rounded text-white w-64"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Mesma lógica lá da Home, desenhando as caixinhas dos jogos... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length === 0 ? (
          <p className="text-gray-400">Nenhuma avaliação encontrada.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-brand-gray border border-gray-800 rounded-lg overflow-hidden flex flex-col">
              {review.imageUrl && (
                <img src={review.imageUrl} alt={review.gameName} className="w-full h-48 object-cover" />
              )}
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-brand-accent">{review.gameName}</h3>
                  <span className="text-2xl">{review.recommend ? '👍' : '👎'}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Por: {review.author?.username || 'Anônimo'}</p>
                <p className="text-gray-200 line-clamp-3">{review.reviewText}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};



// APP 
export default function App() {
  // Pega o token salvo no navegador, se tiver, pra pessoa não ter que logar de novo todo dia
  const [token, setToken] = useState(localStorage.getItem('token'));


  return (
    <Router>
      <div className="min-h-screen font-sans">
        
        {/* A Navbar fica aqui fora pra aparecer em todas as paginas */}
        <Navbar token={token} setToken={setToken} />
        
        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          
          {/* Se ta logado , deixa ele ir pra tela de criar Se nao, mostra o aviso */}
          <Route path="/create" element={token ? <CreateReview token={token} /> : <div className="text-center mt-20 text-xl font-bold text-red-500">Faça login para avaliar.</div>} />
        </Routes>
      </div>
    </Router>
  );
}