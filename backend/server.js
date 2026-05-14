import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatar:   { type: String, default: '' },
    bio:      { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
userSchema.set('toJSON', {
  transform: (_, ret) => { delete ret.password; return ret; },
});
const User = mongoose.model('User', userSchema);

// ─────────────────────────────────────────

const gameSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, unique: true },
    description: { type: String, default: '' },
    genre:       [{ type: String }],
    platform:    [{ type: String }],
    developer:   { type: String, default: '' },
    publisher:   { type: String, default: '' },
    releaseYear: { type: Number },
    coverImage:  { type: String, default: '' },
    addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    avgRating:   { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
gameSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug =
      this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '-' + Date.now();
  }
  next();
});
const Game = mongoose.model('Game', gameSchema);

// ─────────────────────────────────────────

const reviewSchema = new mongoose.Schema(
  {
    game:        { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating:      { type: Number, required: true, min: 1, max: 10 },
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    body:        { type: String, required: true, trim: true, minlength: 20 },
    pros:        [{ type: String }],
    cons:        [{ type: String }],
    recommended: { type: Boolean, default: true },
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);
reviewSchema.index({ game: 1, user: 1 }, { unique: true });

async function updateGameStats(gameId) {
  const stats = await Review.aggregate([
    { $match: { game: gameId } },
    { $group: { _id: '$game', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Game.findByIdAndUpdate(gameId, {
      avgRating:   Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  } else {
    await Game.findByIdAndUpdate(gameId, { avgRating: 0, reviewCount: 0 });
  }
}
reviewSchema.post('save', function () { return updateGameStats(this.game); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) return updateGameStats(doc.game); });
const Review = mongoose.model('Review', reviewSchema);

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Não autorizado.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Usuário não encontrado.' });
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido.' });
  }
};

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─────────────────────────────────────────
// ROUTES — AUTH
// ─────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'Preencha todos os campos.' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'Email ou username já em uso.' });

    const user = await User.create({ username, email, password });
    res.status(201).json({ user, token: makeToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    res.json({ user, token: makeToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', protect, (req, res) => res.json(req.user));

// ─────────────────────────────────────────
// ROUTES — GAMES
// ─────────────────────────────────────────

// GET /api/games/meta/filters  ← deve vir ANTES de /api/games/:id
app.get('/api/games/meta/filters', async (req, res) => {
  try {
    const genres    = await Game.distinct('genre');
    const platforms = await Game.distinct('platform');
    res.json({ genres: genres.filter(Boolean), platforms: platforms.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/games
app.get('/api/games', async (req, res) => {
  try {
    const { search = '', genre, platform, sort = 'avgRating', page = 1, limit = 12 } = req.query;
    const query = {};
    if (search)   query.title    = { $regex: search, $options: 'i' };
    if (genre)    query.genre    = genre;
    if (platform) query.platform = platform;

    const sortMap = {
      avgRating: { avgRating: -1 },
      newest:    { createdAt:  -1 },
      title:     { title:       1 },
    };
    const sortObj = sortMap[sort] || sortMap.avgRating;

    const total = await Game.countDocuments(query);
    const games = await Game.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('addedBy', 'username');

    res.json({ games, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/games/:id
app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate('addedBy', 'username');
    if (!game) return res.status(404).json({ message: 'Jogo não encontrado.' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/games
app.post('/api/games', protect, async (req, res) => {
  try {
    const { title, description, genre, platform, developer, publisher, releaseYear, coverImage } = req.body;
    if (!title) return res.status(400).json({ message: 'Título é obrigatório.' });

    const game = await Game.create({
      title, description,
      genre:    Array.isArray(genre)    ? genre    : genre?.split(',').map(g => g.trim()).filter(Boolean),
      platform: Array.isArray(platform) ? platform : platform?.split(',').map(p => p.trim()).filter(Boolean),
      developer, publisher, releaseYear, coverImage,
      addedBy: req.user._id,
    });
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTES — REVIEWS
// ─────────────────────────────────────────

// GET /api/reviews/game/:gameId
app.get('/api/reviews/game/:gameId', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const sortMap = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt:  1 },
      rating_high: { rating:    -1 },
      rating_low:  { rating:     1 },
    };
    const reviews = await Review.find({ game: req.params.gameId })
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'username avatar');
    const total = await Review.countDocuments({ game: req.params.gameId });
    res.json({ reviews, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/user/:userId
app.get('/api/reviews/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('game', 'title coverImage avgRating');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews
app.post('/api/reviews', protect, async (req, res) => {
  try {
    const { game, rating, title, body, pros, cons, recommended } = req.body;
    if (!game || !rating || !title || !body)
      return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

    const existing = await Review.findOne({ game, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'Você já avaliou este jogo.' });

    const review = await Review.create({
      game, rating, title, body,
      pros:  Array.isArray(pros) ? pros : [],
      cons:  Array.isArray(cons) ? cons : [],
      recommended: recommended !== undefined ? recommended : true,
      user: req.user._id,
    });
    await review.populate('user', 'username avatar');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reviews/:id
app.delete('/api/reviews/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review não encontrado.' });
    if (review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Sem permissão.' });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review removido.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews/:id/like
app.post('/api/reviews/:id/like', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review não encontrado.' });
    const idx = review.likes.indexOf(req.user._id);
    if (idx === -1) review.likes.push(req.user._id);
    else review.likes.splice(idx, 1);
    await review.save();
    res.json({ likes: review.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });
