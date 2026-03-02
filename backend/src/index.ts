
import 'dotenv/config';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { Request, Response } from 'express';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import { requireAuth, AuthRequest } from './middleware/auth';
import { PriceRequest } from './models/PriceRequest';

// dotenv already loaded via side-effect import above

const app = express();

// Configuração de CORS - permitir todas as origens (necessário para Power BI)
app.use(cors({
  origin: '*', // Permitir qualquer origem
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API App Preços rodando!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

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

// PriceRequest model agora importado de ./models/PriceRequest.ts

  app.get('/api/requests/all', requireAuth, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.email !== 'admin@admin.com') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin pode ver todas as solicitações.' });
    }
    
    const filter: any = {};
    
    // Filtro de data: últimos 14 dias por padrão
    const { start_date, end_date } = req.query;
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date as string);
      if (end_date) filter.created_at.$lte = new Date(end_date as string);
    }
    
    const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
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
      
      // Filtro de data: últimos 14 dias por padrão
      const { start_date, end_date } = req.query;
      if (start_date || end_date) {
        filter.created_at = {};
        if (start_date) filter.created_at.$gte = new Date(start_date as string);
        if (end_date) filter.created_at.$lte = new Date(end_date as string);
      }
      
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
      const filter: any = { requester_id: userId };
      
      // Filtro de data: últimos 14 dias por padrão
      const { start_date, end_date } = req.query;
      if (start_date || end_date) {
        filter.created_at = {};
        if (start_date) filter.created_at.$gte = new Date(start_date as string);
        if (end_date) filter.created_at.$lte = new Date(end_date as string);
      }
      
      const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
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
          supervisor_notes: req.body.notes || ''
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
          supervisor_notes: notes
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
          supervisor_notes: notes
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
      const filter: any = {
        status: { 
          $in: ['Aguardando Gerência', 'Aprovado pela Gerência', 'Reprovado pela Gerência', 'Alterado'] 
        }
      };
      
      // Filtro de data: últimos 14 dias por padrão
      const { start_date, end_date } = req.query;
      if (start_date || end_date) {
        filter.created_at = {};
        if (start_date) filter.created_at.$gte = new Date(start_date as string);
        if (end_date) filter.created_at.$lte = new Date(end_date as string);
      }
      
      const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
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
          supervisor_notes: notes
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
          supervisor_notes: notes
        }
      );
      res.json({ message: `${result.modifiedCount} solicitações reprovadas pela gerência`, count: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao reprovar lote pela gerência', details: err });
    }
  });

  // Solicitar cancelamento (vendedor)
  app.post('/api/requests/:id/request-cancel', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const tipo = req.user?.tipo;
      if (tipo !== 'vendedor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para vendedores.' });
      }
      const { cancellation_reason } = req.body;
      if (!cancellation_reason || !cancellation_reason.trim()) {
        return res.status(400).json({ error: 'Motivo do cancelamento é obrigatório.' });
      }
      
      const request = await PriceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      
      // Verificar se o vendedor é dono da solicitação
      if (request.requester_id !== req.user?.userId) {
        console.log('❌ Cancelamento negado:', {
          requester_id: request.requester_id,
          user_userId: req.user?.userId
        });
        return res.status(403).json({ error: 'Você só pode solicitar cancelamento das suas próprias solicitações.' });
      }
      
      // Verificar se já não está cancelada
      if (request.status === 'Cancelado') {
        return res.status(400).json({ error: 'Esta solicitação já está cancelada.' });
      }
      
      // Marcar como solicitação de cancelamento pendente
      request.cancellation_requested = true;
      request.cancellation_reason = cancellation_reason;
      request.cancellation_requested_at = new Date();
      await request.save();
      
      res.json({ message: 'Solicitação de cancelamento enviada para aprovação do admin.' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao solicitar cancelamento', details: err });
    }
  });

  // Listar solicitações de cancelamento pendentes (admin apenas)
  app.get('/api/requests/cancellation-requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || req.user.email !== 'admin@admin.com') {
        return res.status(403).json({ error: 'Acesso negado. Apenas admin pode ver solicitações de cancelamento.' });
      }
      
      const requests = await PriceRequest.find({ 
        cancellation_requested: true,
        status: { $ne: 'Cancelado' }
      }).sort({ cancellation_requested_at: -1 });
      
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar solicitações de cancelamento', details: err });
    }
  });

  // Aprovar cancelamento (admin apenas)
  app.patch('/api/requests/:id/approve-cancel', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || req.user.email !== 'admin@admin.com') {
        return res.status(403).json({ error: 'Acesso negado. Apenas admin pode aprovar cancelamentos.' });
      }
      
      const request = await PriceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      
      if (!request.cancellation_requested) {
        return res.status(400).json({ error: 'Esta solicitação não tem cancelamento pendente.' });
      }
      
      request.status = 'Cancelado';
      request.approved_by = req.user?.name || 'Admin';
      request.approved_at = new Date();
      await request.save();
      
      res.json({ message: 'Cancelamento aprovado com sucesso.' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao aprovar cancelamento', details: err });
    }
  });

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'}`);
  console.log(`🔗 Acesse: http://0.0.0.0:${PORT}`);
});
