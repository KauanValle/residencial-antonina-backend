import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import registroRoutes from './routes/registros.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'https://residencial-antonina-frontend.vercel.app'],
  credentials: true,
}));

app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/registros', registroRoutes);
app.use('/api/users', userRoutes);

// Sobrescreve o toJSON do Date para não converter para UTC
// Serializa datas com offset de SP em vez de UTC
Date.prototype.toJSON = function () {
  const offset = -3 * 60; // SP = UTC-3
  const sp = new Date(this.getTime() + offset * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const y = sp.getUTCFullYear();
  const mo = pad(sp.getUTCMonth() + 1);
  const d = pad(sp.getUTCDate());
  const h = pad(sp.getUTCHours());
  const mi = pad(sp.getUTCMinutes());
  const s = pad(sp.getUTCSeconds());
  return `${y}-${mo}-${d}T${h}:${mi}:${s}-03:00`;
};

const agora = new Date();
console.log('UTC:', agora.toISOString());
console.log('getHours:', agora.getHours());
console.log('TZ:', process.env.TZ);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
