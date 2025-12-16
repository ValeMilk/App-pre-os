import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PriceRequest } from '../models/PriceRequest';

const router = Router();

/**
 * GET /api/analytics/requests
 * Retorna todas as solicitações com filtros opcionais
 * Query params: start_date, end_date, status, vendedor_id, supervisor_code
 */
router.get('/requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Apenas admin, gerente e supervisor podem acessar analytics
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin, gerente ou supervisor.' });
    }

    const { start_date, end_date, status, vendedor_id, supervisor_code } = req.query;

    const filter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date as string);
      if (end_date) filter.created_at.$lte = new Date(end_date as string);
    }

    // Filtro por status
    if (status) {
      filter.status = status;
    }

    // Filtro por vendedor
    if (vendedor_id) {
      filter.requester_id = vendedor_id;
    }

    // Filtro por supervisor
    if (supervisor_code) {
      filter.codigo_supervisor = supervisor_code;
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        filter.codigo_supervisor = codigo_supervisor;
      }
    }

    const requests = await PriceRequest.find(filter)
      .sort({ created_at: -1 })
      .lean();

    res.json({
      total: requests.length,
      data: requests
    });
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar requests:', err);
    res.status(500).json({ error: 'Erro ao buscar dados', details: err });
  }
});

/**
 * GET /api/analytics/summary
 * Retorna resumo geral: total, aprovados, rejeitados, em análise, cancelados
 */
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date } = req.query;
    const filter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date as string);
      if (end_date) filter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        filter.codigo_supervisor = codigo_supervisor;
      }
    }

    const total = await PriceRequest.countDocuments(filter);
    const aprovados = await PriceRequest.countDocuments({ ...filter, status: 'aprovado' });
    const rejeitados = await PriceRequest.countDocuments({ ...filter, status: 'rejeitado' });
    const pendentes = await PriceRequest.countDocuments({ ...filter, status: 'pendente' });
    const cancelados = await PriceRequest.countDocuments({ ...filter, cancellation_requested: true });

    // Calcular taxa de aprovação
    const taxaAprovacao = total > 0 ? ((aprovados / total) * 100).toFixed(2) : '0';
    const taxaRejeicao = total > 0 ? ((rejeitados / total) * 100).toFixed(2) : '0';

    res.json({
      total,
      aprovados,
      rejeitados,
      pendentes,
      cancelados,
      taxaAprovacao: `${taxaAprovacao}%`,
      taxaRejeicao: `${taxaRejeicao}%`
    });
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar summary:', err);
    res.status(500).json({ error: 'Erro ao buscar resumo', details: err });
  }
});

/**
 * GET /api/analytics/by-product
 * Retorna solicitações agrupadas por produto
 */
router.get('/by-product', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            product_id: '$product_id',
            product_name: '$product_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: {
            $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] }
          },
          rejeitados: {
            $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] }
          },
          pendentes: {
            $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
          }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar by-product:', err);
    res.status(500).json({ error: 'Erro ao agrupar por produto', details: err });
  }
});

/**
 * GET /api/analytics/by-vendedor
 * Retorna performance de cada vendedor
 */
router.get('/by-vendedor', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            requester_id: '$requester_id',
            requester_name: '$requester_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: {
            $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] }
          },
          rejeitados: {
            $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] }
          },
          pendentes: {
            $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
          }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar by-vendedor:', err);
    res.status(500).json({ error: 'Erro ao agrupar por vendedor', details: err });
  }
});

/**
 * GET /api/analytics/by-period
 * Retorna dados agregados por dia/semana/mês
 * Query param: period = 'day' | 'week' | 'month'
 */
router.get('/by-period', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date, period = 'day' } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    // Definir formato de data baseado no período
    let dateFormat: any;
    switch (period) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%U', date: '$created_at' } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$created_at' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: dateFormat,
          total_solicitacoes: { $sum: 1 },
          aprovados: {
            $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] }
          },
          rejeitados: {
            $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] }
          },
          pendentes: {
            $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar by-period:', err);
    res.status(500).json({ error: 'Erro ao agrupar por período', details: err });
  }
});

/**
 * GET /api/analytics/by-supervisor
 * Retorna performance de cada supervisor
 */
router.get('/by-supervisor', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin ou gerente.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            codigo_supervisor: '$codigo_supervisor',
            nome_supervisor: '$nome_supervisor'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: {
            $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] }
          },
          rejeitados: {
            $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] }
          },
          pendentes: {
            $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
          }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar by-supervisor:', err);
    res.status(500).json({ error: 'Erro ao agrupar por supervisor', details: err });
  }
});

/**
 * GET /api/analytics/by-customer
 * Retorna solicitações agrupadas por cliente
 */
router.get('/by-customer', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            customer_code: '$customer_code',
            customer_name: '$customer_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: {
            $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] }
          },
          rejeitados: {
            $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] }
          },
          pendentes: {
            $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
          }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar by-customer:', err);
    res.status(500).json({ error: 'Erro ao agrupar por cliente', details: err });
  }
});

/**
 * GET /api/analytics/tempo-aprovacao
 * Retorna tempo médio de aprovação (diferença entre created_at e approved_at)
 */
router.get('/tempo-aprovacao', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {
      status: 'aprovado',
      approved_at: { $exists: true }
    };

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    const result = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $project: {
          tempo_horas: {
            $divide: [
              { $subtract: ['$approved_at', '$created_at'] },
              1000 * 60 * 60 // Converter milissegundos para horas
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          tempo_medio_horas: { $avg: '$tempo_horas' },
          tempo_minimo_horas: { $min: '$tempo_horas' },
          tempo_maximo_horas: { $max: '$tempo_horas' },
          total_aprovacoes: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({
        tempo_medio_horas: 0,
        tempo_minimo_horas: 0,
        tempo_maximo_horas: 0,
        total_aprovacoes: 0
      });
    }

    const data = result[0];
    res.json({
      tempo_medio_horas: data.tempo_medio_horas.toFixed(2),
      tempo_minimo_horas: data.tempo_minimo_horas.toFixed(2),
      tempo_maximo_horas: data.tempo_maximo_horas.toFixed(2),
      total_aprovacoes: data.total_aprovacoes
    });
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar tempo-aprovacao:', err);
    res.status(500).json({ error: 'Erro ao calcular tempo de aprovação', details: err });
  }
});

/**
 * GET /api/analytics/dashboard
 * Endpoint único que consolida TODOS os dados do dashboard em uma única chamada
 * Query params: start_date, end_date
 */
router.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.tipo;
    if (!['admin', 'gerente', 'supervisor'].includes(userType || '')) {
      return res.status(403).json({ error: 'Acesso negado. Apenas admin, gerente ou supervisor.' });
    }

    const { start_date, end_date } = req.query;
    const matchFilter: any = {};

    // Filtro por data
    if (start_date || end_date) {
      matchFilter.created_at = {};
      if (start_date) matchFilter.created_at.$gte = new Date(start_date as string);
      if (end_date) matchFilter.created_at.$lte = new Date(end_date as string);
    }

    // Se for supervisor, limitar aos dados dele
    if (userType === 'supervisor') {
      const codigo_supervisor = req.user?.codigo_supervisor;
      if (codigo_supervisor) {
        matchFilter.codigo_supervisor = codigo_supervisor;
      }
    }

    // 1. RESUMO GERAL
    const totalDocs = await PriceRequest.countDocuments(matchFilter);
    const aprovados = await PriceRequest.countDocuments({ ...matchFilter, status: 'aprovado' });
    const rejeitados = await PriceRequest.countDocuments({ ...matchFilter, status: 'rejeitado' });
    const pendentes = await PriceRequest.countDocuments({ ...matchFilter, status: 'pendente' });
    const cancelados = await PriceRequest.countDocuments({ ...matchFilter, cancellation_requested: true });

    const taxaAprovacao = totalDocs > 0 ? ((aprovados / totalDocs) * 100).toFixed(2) : '0';
    const taxaRejeicao = totalDocs > 0 ? ((rejeitados / totalDocs) * 100).toFixed(2) : '0';

    // 2. DADOS POR PRODUTO
    const byProduct = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            product_id: '$product_id',
            product_name: '$product_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } },
          rejeitados: { $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] } },
          pendentes: { $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] } }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    // 3. DADOS POR VENDEDOR
    const byVendedor = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            requester_id: '$requester_id',
            requester_name: '$requester_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } },
          rejeitados: { $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] } },
          pendentes: { $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] } }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    // 4. DADOS POR CLIENTE
    const byCustomer = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            customer_code: '$customer_code',
            customer_name: '$customer_name'
          },
          total_solicitacoes: { $sum: 1 },
          aprovados: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } },
          rejeitados: { $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] } },
          pendentes: { $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] } }
        }
      },
      { $sort: { total_solicitacoes: -1 } }
    ]);

    // 5. DADOS POR PERÍODO (MÊS)
    const byPeriod = await PriceRequest.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          total_solicitacoes: { $sum: 1 },
          aprovados: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } },
          rejeitados: { $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] } },
          pendentes: { $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 6. TEMPO MÉDIO DE APROVAÇÃO
    const tempoAprovacaoResult = await PriceRequest.aggregate([
      { $match: { ...matchFilter, status: 'aprovado', approved_at: { $exists: true } } },
      {
        $project: {
          tempo_horas: {
            $divide: [
              { $subtract: ['$approved_at', '$created_at'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          tempo_medio_horas: { $avg: '$tempo_horas' },
          tempo_minimo_horas: { $min: '$tempo_horas' },
          tempo_maximo_horas: { $max: '$tempo_horas' },
          total_aprovacoes: { $sum: 1 }
        }
      }
    ]);

    const tempoAprovacao = tempoAprovacaoResult.length > 0 
      ? {
          tempo_medio_horas: parseFloat(tempoAprovacaoResult[0].tempo_medio_horas.toFixed(2)),
          tempo_minimo_horas: parseFloat(tempoAprovacaoResult[0].tempo_minimo_horas.toFixed(2)),
          tempo_maximo_horas: parseFloat(tempoAprovacaoResult[0].tempo_maximo_horas.toFixed(2)),
          total_aprovacoes: tempoAprovacaoResult[0].total_aprovacoes
        }
      : {
          tempo_medio_horas: 0,
          tempo_minimo_horas: 0,
          tempo_maximo_horas: 0,
          total_aprovacoes: 0
        };

    // 7. DADOS POR SUPERVISOR (apenas admin/gerente podem ver)
    let bySupervisor = [];
    if (['admin', 'gerente'].includes(userType || '')) {
      bySupervisor = await PriceRequest.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              codigo_supervisor: '$codigo_supervisor',
              nome_supervisor: '$nome_supervisor'
            },
            total_solicitacoes: { $sum: 1 },
            aprovados: { $sum: { $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0] } },
            rejeitados: { $sum: { $cond: [{ $eq: ['$status', 'rejeitado'] }, 1, 0] } },
            pendentes: { $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] } }
          }
        },
        { $sort: { total_solicitacoes: -1 } }
      ]);
    }

    // 8. LISTA COMPLETA DE SOLICITAÇÕES
    const allRequests = await PriceRequest.find(matchFilter)
      .sort({ created_at: -1 })
      .lean();

    // Consolidar tudo em um único objeto
    res.json({
      summary: {
        total: totalDocs,
        aprovados,
        rejeitados,
        pendentes,
        cancelados,
        taxaAprovacao: `${taxaAprovacao}%`,
        taxaRejeicao: `${taxaRejeicao}%`
      },
      byProduct,
      byVendedor,
      byCustomer,
      byPeriod,
      tempoAprovacao,
      bySupervisor: ['admin', 'gerente'].includes(userType || '') ? bySupervisor : [],
      allRequests
    });
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar dashboard completo:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard', details: err });
  }
});

export default router;
