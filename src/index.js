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
Date.prototype.toJSON = function() {
  return this.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
