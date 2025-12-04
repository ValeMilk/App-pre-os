
import 'dotenv/config';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { Request, Response } from 'express';
import authRoutes from './routes/auth';
import { requireAuth, AuthRequest } from './middleware/auth';

// dotenv already loaded via side-effect import above

const app = express();

// Configuração de CORS para produção
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permite requisições sem origin (como Postman, curl, etc) ou de dominios vercel.app
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4000',
      'https://app-pre-os.vercel.app',
    ];
    
    // Se não tem origin (requisições do servidor) ou é um dominio permitido ou termina em .vercel.app
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Temporariamente permitindo tudo para debug
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API App Preços rodando!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

// Diagnostic logs to help debugging environment issues
console.log('[STARTUP] PORT=', process.env.PORT || 'not set');
console.log('[STARTUP] MONGO_URI present=', Boolean(process.env.MONGO_URI));
console.log('[STARTUP] JWT_SECRET present=', Boolean(process.env.JWT_SECRET));

const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri) {
  console.error('MONGO_URI não definido no .env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB conectado!'))
  .catch(err => {
    console.error('Erro ao conectar no MongoDB:', err);
    process.exit(1);
  });

const priceRequestSchema = new mongoose.Schema({
  requester_name: String,
  requester_id: { type: String, required: true },
  customer_code: String,
  customer_name: String,
  product_id: String,
  product_name: String,
  requested_price: String,
  quantity: String,
  product_maximo: String,
  product_minimo: String,
  product_promocional: String,
  currency: String,
  status: String,
  notes: String,
  created_at: { type: Date, default: Date.now },
  approved_by: String,
  approved_at: Date,
  altered_by: String,
  altered_at: Date,
  codigo_supervisor: String,
  nome_supervisor: String,
  subrede_batch_id: String,
  subrede_name: String,
  discount_percent: String,
  discounted_price: String,
  supervisor_notes: String
});
const PriceRequest = mongoose.model('PriceRequest', priceRequestSchema);

  app.get('/api/requests/all', requireAuth, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.email !== 'admin@admin.com') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin pode ver todas as solicitações.' });
    }
    const requests = await PriceRequest.find({}).sort({ created_at: -1 });
    res.json(requests);
  });

  app.get('/api/requests/supervisor', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const codigo_supervisor = req.user?.codigo_supervisor;
      const nome_supervisor = req.user?.nome_supervisor;
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const filter: any = {};
      if (codigo_supervisor) filter.codigo_supervisor = codigo_supervisor;
      else if (nome_supervisor) filter.nome_supervisor = nome_supervisor;
      else return res.status(400).json({ error: 'Supervisor sem código/nome no token.' });
      const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar solicitações do supervisor', details: err });
    }
  });

  app.post('/api/requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      console.log('[REQUESTS] POST by user:', req.user);
      const data = req.body;
      const created = await PriceRequest.create({
        ...data,
        requester_id: req.user?.userId,
        requester_name: req.user?.name,
        created_at: new Date()
      });
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: 'Erro ao criar solicitação', details: err });
    }
  });

  // Listar solicitações do vendedor autenticado
  app.get('/api/requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      console.log('[REQUESTS] GET by user:', req.user);
      const userId = req.user?.userId;
      const requests = await PriceRequest.find({ requester_id: userId }).sort({ created_at: -1 });
      res.json(requests);
    } catch (err) {
      console.error('[REQUESTS] Error fetching requests for user', req.user, err);
      res.status(500).json({ error: 'Erro ao buscar solicitações', details: err });
    }
  });

  app.patch('/api/requests/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const request = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Aprovado',
          approved_by: req.user?.name,
          approved_at: new Date(),
          notes: req.body.notes || ''
        },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar solicitação', details: err });
    }
  });

  app.patch('/api/requests/:id/reject', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Justificativa obrigatória para reprovação.' });
      const request = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Reprovado',
          approved_by: req.user?.name,
          approved_at: new Date(),
          notes
        },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao reprovar solicitação', details: err });
    }
  });

  app.patch('/api/requests/:id/mark-altered', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || req.user.email !== 'admin@admin.com') {
        return res.status(403).json({ error: 'Acesso permitido apenas para admin.' });
      }
      const request = await PriceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      
      const allowedStatuses = ['Aprovado', 'Reprovado', 'Aprovado pela Gerência', 'Reprovado pela Gerência'];
      if (!request.status || !allowedStatuses.includes(request.status)) {
        return res.status(400).json({ error: 'Apenas solicitações aprovadas ou reprovadas podem ser marcadas como alteradas.' });
      }

      const updatedRequest = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Alterado',
          altered_by: req.user?.name,
          altered_at: new Date()
        },
        { new: true }
      );
      res.json(updatedRequest);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao marcar solicitação como alterada', details: err });
    }
  });

  // Endpoints do Gerente
  app.patch('/api/requests/:id/encaminhar-gerencia', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const { supervisor_notes } = req.body;
      const request = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Aguardando Gerência',
          approved_by: req.user?.name,
          approved_at: new Date(),
          supervisor_notes: supervisor_notes || ''
        },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao encaminhar para gerência', details: err });
    }
  });

  // Aprovar em lote (subrede)
  app.patch('/api/requests/batch/:batchId/approve', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const result = await PriceRequest.updateMany(
        { subrede_batch_id: req.params.batchId },
        {
          status: 'Aprovado',
          approved_by: req.user?.name,
          approved_at: new Date()
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações aprovadas`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar lote', details: err });
    }
  });

  // Reprovar em lote (subrede)
  app.patch('/api/requests/batch/:batchId/reject', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Justificativa obrigatória para reprovação.' });
      const result = await PriceRequest.updateMany(
        { subrede_batch_id: req.params.batchId },
        {
          status: 'Reprovado',
          approved_by: req.user?.name,
          approved_at: new Date(),
          notes
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações reprovadas`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao reprovar lote', details: err });
    }
  });

  // Encaminhar para gerência em lote (subrede)
  app.patch('/api/requests/batch/:batchId/encaminhar-gerencia', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      const { supervisor_notes } = req.body;
      const result = await PriceRequest.updateMany(
        { subrede_batch_id: req.params.batchId },
        {
          status: 'Aguardando Gerência',
          approved_by: req.user?.name,
          approved_at: new Date(),
          supervisor_notes: supervisor_notes || ''
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações encaminhadas para gerência`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao encaminhar lote para gerência', details: err });
    }
  });

  app.get('/api/requests/gerente', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'gerente') {
        return res.status(403).json({ error: 'Acesso permitido apenas para gerentes.' });
      }
      // Retorna solicitações pendentes E processadas pela gerência (incluindo Alterado)
      const requests = await PriceRequest.find({ 
        status: { 
          $in: ['Aguardando Gerência', 'Aprovado pela Gerência', 'Reprovado pela Gerência', 'Alterado'] 
        } 
      }).sort({ created_at: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar solicitações da gerência', details: err });
    }
  });

  app.patch('/api/requests/:id/gerente-approve', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'gerente') {
        return res.status(403).json({ error: 'Acesso permitido apenas para gerentes.' });
      }
      const request = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Aprovado pela Gerência',
          approved_by: req.user?.name,
          approved_at: new Date()
        },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar pela gerência', details: err });
    }
  });

  app.patch('/api/requests/:id/gerente-reject', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'gerente') {
        return res.status(403).json({ error: 'Acesso permitido apenas para gerentes.' });
      }
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Motivo obrigatório para reprovação pela gerência.' });
      
      const request = await PriceRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Reprovado pela Gerência',
          approved_by: req.user?.name,
          approved_at: new Date(),
          notes
        },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: 'Solicitação não encontrada.' });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao reprovar pela gerência', details: err });
    }
  });

  // Aprovar em lote pela gerência (subrede)
  app.patch('/api/requests/batch/:batchId/gerente-approve', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'gerente') {
        return res.status(403).json({ error: 'Acesso permitido apenas para gerentes.' });
      }
      const result = await PriceRequest.updateMany(
        { subrede_batch_id: req.params.batchId },
        {
          status: 'Aprovado pela Gerência',
          approved_by: req.user?.name,
          approved_at: new Date()
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações aprovadas pela gerência`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar lote pela gerência', details: err });
    }
  });

  // Reprovar em lote pela gerência (subrede)
  app.patch('/api/requests/batch/:batchId/gerente-reject', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'gerente') {
        return res.status(403).json({ error: 'Acesso permitido apenas para gerentes.' });
      }
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Motivo obrigatório para reprovação pela gerência.' });
      const result = await PriceRequest.updateMany(
        { subrede_batch_id: req.params.batchId },
        {
          status: 'Reprovado pela Gerência',
          approved_by: req.user?.name,
          approved_at: new Date(),
          notes
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações reprovadas pela gerência`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao reprovar lote pela gerência', details: err });
    }
  });

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'}`);
  console.log(`🔗 Acesse: http://0.0.0.0:${PORT}`);
});
