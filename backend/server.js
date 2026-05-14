require('dotenv').config(); //
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// criando o servidor
const app = express();
app.use(cors()); // conexao front
app.use(express.json());

// conexao com o banco
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// modelos
// modelo de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }

});
const User = mongoose.model('User', userSchema); // cria colecao de usuarios no banco

// modelo de review
const reviewSchema = new mongoose.Schema({
  gameName: { type: String, required: true }, 
  imageUrl: { type: String }, 
  reviewText: { type: String, required: true }, 
  recommend: { type: Boolean, default: true }, 
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);



// middleware de autenticacao
// ele olha se os usuarios tao logados
const auth = (req, res, next) => {
  const token = req.header('Authorization'); // verificar o token
  if (!token) return res.status(401).json({ error: 'Acesso negado' }); // nao tem token é barrado
  
  try {
    // tenta ler o token usando o jwt no .env
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified; // validacao
    next(); 
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' }); // erro token nao existe
  }
};



// rotas

// rota de registro
app.post('/api/register', async (req, res) => {
  try {
    // senha segura usando bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // cria o novo usuário com os dados que vieram do React
    const newUser = new User({ 
      username: req.body.username, 
      email: req.body.email, 
      password: hashedPassword // salva a senha embaralhada pelo bcrypt
    });
    
    await newUser.save(); // salva no mongo
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    console.error("Erro real no back-end:", err); 
    res.status(400).json({ error: 'Erro ao registrar usuário', details: err.message }); 
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    // procura se existe alguem com esse usuario
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
    
    // verifica a senha
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Senha inválida' });
    
    // gera o token do usuariop
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username }); // Manda o crachá lá pro React guardar
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

//criar review
// so pode criar o review se ele tiver logado
app.post('/api/reviews', auth, async (req, res) => {
  try {
    // monta a avaliacao
    const review = new Review({
      gameName: req.body.gameName,
      imageUrl: req.body.imageUrl,
      reviewText: req.body.reviewText,
      recommend: req.body.recommend,
      author: req.user._id // Pega o ID de quem é o dono do crachá e anota como autor
    });
    const savedReview = await review.save(); 
    res.status(201).json(savedReview); 
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar review' });
  }
});

// Listar reviews
app.get('/api/reviews', async (req, res) => {
  try {
    // pega oque a pessoa pesquisou
    const search = req.query.search || ''; 
    const limit = parseInt(req.query.limit) || 10; // quantidade de avaliaçoes pra trazer
    const skip = parseInt(req.query.skip) || 0; 
    
    const query = { gameName: { $regex: search, $options: 'i' } };
    
    // busca as reviews no banco
    const reviews = await Review.find(query)
      .populate('author', 'username') 
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit);
      

    const total = await Review.countDocuments(query);
    
    // manda tudo pro react
    res.json({ reviews, total });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar reviews' });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));