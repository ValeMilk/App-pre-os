import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
// Use JWT secret in runtime; fail requests if missing rather than throwing at import
const JWT_SECRET = process.env.JWT_SECRET as string | undefined;


// Registro público (não recomendado para produção)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'E-mail já cadastrado.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  res.status(201).json({ id: user._id, name: user.name, email: user.email });
});


// Registro de vendedor pelo admin
router.post('/admin-register', requireAuth, async (req: AuthRequest, res) => {
  // Só permite se o usuário logado for admin
  if (!req.user || req.user.email !== 'admin@admin.com') {
    return res.status(403).json({ error: 'Acesso negado. Apenas admin pode cadastrar usuários.' });
  }
  const { name, email, password, vendedor_code } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'E-mail já cadastrado.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, vendedor_code, tipo: 'vendedor' });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, vendedor_code: user.vendedor_code });
});

// Registro de supervisor pelo admin
router.post('/supervisor-register', requireAuth, async (req: AuthRequest, res) => {
  // Só permite se o usuário logado for admin
  if (!req.user || req.user.email !== 'admin@admin.com') {
    return res.status(403).json({ error: 'Acesso negado. Apenas admin pode cadastrar supervisores.' });
  }
  const { name, email, password, codigo_supervisor } = req.body;
  if (!name || !email || !password || !codigo_supervisor) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'E-mail já cadastrado.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, codigo_supervisor, tipo: 'supervisor' });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, codigo_supervisor: user.codigo_supervisor });
});

// Registro de gerente pelo admin
router.post('/gerente-register', requireAuth, async (req: AuthRequest, res) => {
  // Só permite se o usuário logado for admin
  if (!req.user || req.user.email !== 'admin@admin.com') {
    return res.status(403).json({ error: 'Acesso negado. Apenas admin pode cadastrar gerentes.' });
  }
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'E-mail já cadastrado.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, tipo: 'gerente' });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, tipo: user.tipo });
});

// Buscar lista de usuários (apenas nomes para dropdown de login)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email').sort({ name: 1 });
    res.json(users.map(u => ({ name: u.name, email: u.email })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Endpoint para corrigir admin (desenvolvimento apenas)
router.post('/fix-admin', async (req, res) => {
  try {
    const admin = await User.findOneAndUpdate(
      { email: 'admin@admin.com' },
      { tipo: 'admin' },
      { new: true }
    );
    if (!admin) {
      return res.status(404).json({ error: 'Admin não encontrado' });
    }
    res.json({ message: 'Admin corrigido com sucesso', user: admin });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao corrigir admin', details: err });
  }
});

// Login
router.post('/login', async (req, res) => {
  const JWT_SECRET = process.env.JWT_SECRET as string | undefined;
  if (!JWT_SECRET) {
    console.error('[LOGIN] JWT_SECRET não definido no ambiente!');
    return res.status(500).json({ error: 'Configuração do servidor inválida.' });
  }
  console.log('[LOGIN] JWT_SECRET em uso:', Boolean(JWT_SECRET));
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Usuário não encontrado.' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Senha inválida.' });
  const token = jwt.sign({ 
    userId: user._id, 
    name: user.name, 
    email: user.email, 
    vendedor_code: user.vendedor_code, 
    codigo_supervisor: user.codigo_supervisor,
    tipo: user.tipo 
  }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      vendedor_code: user.vendedor_code, 
      codigo_supervisor: user.codigo_supervisor,
      tipo: user.tipo 
    } 
  });
});

export default router;
