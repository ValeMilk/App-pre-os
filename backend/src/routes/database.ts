import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

const pgPool = new Pool({
  host: 'localhost',
  database: 'dbactions',
  user: 'apiuser',
  password: 'Postgres@2026!',
  port: 5432
});

// GET /api/produtos
router.get('/produtos', async (req: Request, res: Response) => {
  try {
    const result = await pgPool.query('SELECT * FROM produtos ORDER BY e02_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/clientes
router.get('/clientes', async (req: Request, res: Response) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        c.*,
        COALESCE(s.subrede, '-') as subrede
      FROM clientes c
      LEFT JOIN subredes s ON c.a00_id = s.a00_id
      ORDER BY c.a00_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

export default router;
