// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- MODELOS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const reviewSchema = new mongoose.Schema({
  gameName: { type: String, required: true },
  imageUrl: { type: String },
  reviewText: { type: String, required: true },
  recommend: { type: Boolean, default: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Acesso negado' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

// --- ROTAS ---
// Registro
app.post('/api/register', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
  
    const newUser = new User({ 
      username: req.body.username, 
      email: req.body.email, 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    console.error("Erro real no back-end:", err); // Isso vai aparecer no seu terminal!
    // Enviamos o erro detalhado para o front-end ler
    res.status(400).json({ error: 'Erro ao registrar usuário', details: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
    
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Senha inválida' });
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Criar Review (Requer Login)
app.post('/api/reviews', auth, async (req, res) => {
  try {
    const review = new Review({
      gameName: req.body.gameName,
      imageUrl: req.body.imageUrl,
      reviewText: req.body.reviewText,
      recommend: req.body.recommend,
      author: req.user._id
    });
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar review' });
  }
});

// Listar Reviews (Público, com busca e paginação simplificada)
app.get('/api/reviews', async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    const query = { gameName: { $regex: search, $options: 'i' } };
    
    const reviews = await Review.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Review.countDocuments(query);
    
    res.json({ reviews, total });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar reviews' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));