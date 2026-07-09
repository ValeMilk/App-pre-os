
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
import { erpService } from './services/ERPService';

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
      if (end_date) {
        // Adicionar 1 dia para incluir todo o dia especificado
        const endDatePlusOne = new Date(end_date as string);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        filter.created_at.$lt = endDatePlusOne;
      }
    }
    
    const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
    res.json(requests);
  });

  // Endpoint para debug: listar supervisores únicos nas solicitações
  app.get('/api/debug/supervisores', requireAuth, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.email !== 'admin@admin.com') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin.' });
    }
    
    try {
      const supervisores = await PriceRequest.aggregate([
        {
          $group: {
            _id: {
              codigo: '$codigo_supervisor',
              nome: '$nome_supervisor'
            },
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);
      
      res.json(supervisores);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar supervisores', details: err });
    }
  });

  app.get('/api/requests/supervisor', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const codigo_supervisor = req.user?.codigo_supervisor;
      const nome_user = req.user?.name;
      const tipo = req.user?.tipo;
      
      console.log('[SUPERVISOR] Buscando solicitações para:', { codigo_supervisor, nome_user, tipo });
      
      if (tipo !== 'supervisor') {
        return res.status(403).json({ error: 'Acesso permitido apenas para supervisores.' });
      }
      
      const filter: any = {};
      
      // Buscar por código OU por nome (fallback mais flexível)
      if (codigo_supervisor) {
        filter.$or = [
          { codigo_supervisor: codigo_supervisor },
          { nome_supervisor: nome_user }
        ];
      } else if (nome_user) {
        filter.nome_supervisor = nome_user;
      } else {
        return res.status(400).json({ error: 'Supervisor sem código/nome no token.' });
      }
      
      // Filtro de data: últimos 14 dias por padrão
      const { start_date, end_date } = req.query;
      if (start_date || end_date) {
        filter.created_at = {};
        if (start_date) filter.created_at.$gte = new Date(start_date as string);
        if (end_date) {
          // Adicionar 1 dia para incluir todo o dia especificado
          const endDatePlusOne = new Date(end_date as string);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          filter.created_at.$lt = endDatePlusOne;
        }
      }
      
      console.log('[SUPERVISOR] Filtro aplicado:', JSON.stringify(filter));
      
      const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
      
      console.log('[SUPERVISOR] Solicitações encontradas:', requests.length);
      if (requests.length > 0) {
        console.log('[SUPERVISOR] Exemplo de solicitação:', {
          id: requests[0]._id,
          codigo_supervisor: requests[0].codigo_supervisor,
          nome_supervisor: requests[0].nome_supervisor,
          status: requests[0].status
        });
      }
      
      res.json(requests);
    } catch (err) {
      console.error('[SUPERVISOR] Erro ao buscar solicitações:', err);
      res.status(500).json({ error: 'Erro ao buscar solicitações do supervisor', details: err });
    }
  });

  app.post('/api/requests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      console.log('[REQUESTS] POST by user:', req.user);
      const data = req.body;
      
      console.log('[REQUESTS] Dados recebidos:', {
        customer_code: data.customer_code,
        customer_name: data.customer_name,
        product_id: data.product_id,
        codigo_supervisor: data.codigo_supervisor,
        nome_supervisor: data.nome_supervisor,
        status: data.status
      });
      
      const created = await PriceRequest.create({
        ...data,
        requester_id: req.user?.userId,
        requester_name: req.user?.name,
        created_at: new Date()
      });
      
      console.log('[REQUESTS] Solicitação criada com ID:', created._id, 'para supervisor:', data.codigo_supervisor, data.nome_supervisor);
      
      res.status(201).json(created);
    } catch (err) {
      console.error('[REQUESTS] Erro ao criar solicitação:', err);
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
        if (end_date) {
          // Adicionar 1 dia para incluir todo o dia especificado
          const endDatePlusOne = new Date(end_date as string);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          filter.created_at.$lt = endDatePlusOne;
        }
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
      const nome_user = req.user?.name;
      
      console.log('[GERENTE] Buscando solicitações para:', { nome_user, tipo });
      
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
        if (end_date) {
          // Adicionar 1 dia para incluir todo o dia especificado
          const endDatePlusOne = new Date(end_date as string);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          filter.created_at.$lt = endDatePlusOne;
        }
      }
      
      console.log('[GERENTE] Filtro aplicado:', JSON.stringify(filter));
      
      const requests = await PriceRequest.find(filter).sort({ created_at: -1 });
      
      console.log('[GERENTE] Solicitações encontradas:', requests.length);
      if (requests.length > 0) {
        console.log('[GERENTE] Exemplo de solicitação:', {
          id: requests[0]._id,
          status: requests[0].status,
          customer_name: requests[0].customer_name
        });
      }
      
      res.json(requests);
    } catch (err) {
      console.error('[GERENTE] Erro ao buscar solicitações:', err);
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

// ============================================
// ERP Service Endpoints
// ============================================

/**
 * GET /api/clientes
 * Busca todos os clientes da carteira do SQL Server
 */
app.get('/api/clientes', async (req: Request, res: Response) => {
  try {
    console.log('[ERP] GET /api/clientes - iniciando busca...');
    const clientes = await erpService.getClientes();
    console.log(`[ERP] Retornando ${clientes.length} clientes`);
    res.json(clientes);
  } catch (error) {
    console.error('[ERP] Erro ao buscar clientes:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar clientes do SQL Server',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/produtos
 * Busca todos os produtos do SQL Server
 */
app.get('/api/produtos', async (req: Request, res: Response) => {
  try {
    console.log('[ERP] GET /api/produtos - iniciando busca...');
    const produtos = await erpService.getProdutos();
    console.log(`[ERP] Retornando ${produtos.length} produtos`);
    res.json(produtos);
  } catch (error) {
    console.error('[ERP] Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos do SQL Server',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/descontos?clienteId=XXXX
 * Busca os descontos do cliente baseado na última compra
 */
app.get('/api/descontos', async (req: Request, res: Response) => {
  try {
    const clienteId = req.query.clienteId;
    
    if (!clienteId) {
      return res.status(400).json({ 
        error: 'Parâmetro clienteId é obrigatório',
        example: '/api/descontos?clienteId=11747'
      });
    }

    const cliente = Number(clienteId);
    if (isNaN(cliente)) {
      return res.status(400).json({ 
        error: 'clienteId deve ser um número válido'
      });
    }

    console.log(`[ERP] GET /api/descontos?clienteId=${cliente} - iniciando busca...`);
    const descontos = await erpService.getDescontos(cliente);
    console.log(`[ERP] Retornando ${descontos.length} descontos para cliente ${cliente}`);
    res.json(descontos);
  } catch (error) {
    console.error('[ERP] Erro ao buscar descontos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar descontos do SQL Server',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * DEBUG: Endpoint para testar produto sem filtro de desconto
 */
app.get('/api/debug/produto/:id', async (req: Request, res: Response) => {
  try {
    const produtoId = Number(req.params.id) || 3;
    const clienteId = Number(req.query.clienteId) || 11747;
    
    console.log(`[DEBUG] Buscando compras do cliente ${clienteId} para produto ${produtoId}`);
    const descontos = await erpService.getDescontos(clienteId);
    
    const encontrado = descontos.find((d: any) => d.codigo_produto == produtoId);
    
    res.json({
      cliente_id: clienteId,
      produto_id_buscado: produtoId,
      encontrado_em_descontos: !!encontrado,
      desconto_encontrado: encontrado || null,
      total_descontos_cliente: descontos.length,
      primeiros_descontos: descontos.slice(0, 3),
      analise: 'Se encontrado_em_descontos=false, significa que este cliente NUNCA comprou este produto. A query getDescontos() retorna apenas produtos com histórico de compra.'
    });
  } catch (error) {
    console.error('[DEBUG] Erro:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * DEBUG: Query completa de M01 sem filtro para verificar histórico
 */
app.get('/api/debug/historicocompra/:produtoId/:clienteId', async (req: Request, res: Response) => {
  try {
    const produtoId = Number(req.params.produtoId) || 3;
    const clienteId = Number(req.params.clienteId) || 11747;
    
    const pool = (erpService as any).pool;
    if (!pool) {
      return res.status(500).json({ error: 'Conexão SQL não inicializada' });
    }
    
    const query = `
      SELECT TOP 10
          m00.M00_ID_A00,
          m01.M01_ID_E02,
          e02.E02_DESC,
          m00.M00_ENTSAI,
          m00.M00_STATUS,
          a24.A24_DESC_PERC
      FROM dbo.M01 AS m01
      INNER JOIN dbo.M00 AS m00 ON m01.M01_ID_M00 = m00.M00_ID
      INNER JOIN dbo.E02 AS e02 ON m01.M01_ID_E02 = e02.E02_ID
      LEFT JOIN dbo.A24 AS a24 ON a24.A24_ID_E02 = e02.E02_ID
      WHERE m00.M00_ID_A00 = ${clienteId}
      AND m01.M01_ID_E02 = ${produtoId}
      ORDER BY m00.M00_ENTSAI DESC
    `;
    
    const result = await pool.request().query(query);
    
    res.json({
      cliente_id: clienteId,
      produto_id: produtoId,
      registros_encontrados: result.recordset.length,
      compras: result.recordset,
      analise: result.recordset.length === 0 
        ? 'CLIENTE NUNCA COMPROU ESTE PRODUTO - Logo não terá desconto nele' 
        : 'Cliente tem histórico. Verificar por que getDescontos() não o incluiu'
    });
  } catch (error) {
    console.error('[DEBUG] Erro:', error);
    res.status(500).json({ error: String(error) });
  }
});

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'}`);
  console.log(`🔗 Acesse: http://0.0.0.0:${PORT}`);
});
