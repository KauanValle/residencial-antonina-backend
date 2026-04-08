import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function listar(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

export async function criar(req, res) {
  const { nome, username, password, role } = req.body;

  if (!nome || !username || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  if (!['admin', 'operator'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida.' });
  }

  try {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ error: 'Username já existe.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nome, username, passwordHash, role },
      select: { id: true, nome: true, username: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
}

export async function atualizar(req, res) {
  const { nome, username, password, role } = req.body;
  const id = parseInt(req.params.id);

  try {
    // Evita remover o próprio acesso admin
    if (req.user.id === id && role === 'operator') {
      return res.status(400).json({ error: 'Você não pode rebaixar sua própria conta.' });
    }

    const data = {};
    if (nome) data.nome = nome;
    if (username) data.username = username;
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nome: true, username: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
}

export async function deletar(req, res) {
  const id = parseInt(req.params.id);

  if (req.user.id === id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
  }

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
}
