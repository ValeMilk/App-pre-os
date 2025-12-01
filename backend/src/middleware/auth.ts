import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Não ler JWT_SECRET em tempo de import — ler em tempo de execução onde necessário

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    name: string;
    email: string;
    tipo?: string;
    codigo_supervisor?: string;
    nome_supervisor?: string;
    vendedor_code?: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const JWT_SECRET = process.env.JWT_SECRET as string | undefined;
  if (!JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET não definido no ambiente!');
    return res.status(500).json({ error: 'Configuração do servidor inválida.' });
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  const token = auth.replace('Bearer ', '');
  // DEBUG LOGS
  console.log('[AUTH] JWT_SECRET em uso:', JWT_SECRET);
  console.log('[AUTH] Token recebido:', token);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[AUTH] Erro ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
