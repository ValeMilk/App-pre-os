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

    // 8. LISTA COMPLETA DE SOLICITAÇÕES COM TODOS OS DETALHES
    const allRequests = await PriceRequest.find(matchFilter)
      .sort({ created_at: -1 })
      .lean();

    // Enriquecer dados com campos calculados para facilitar análise no Power BI
    const enrichedRequests = allRequests.map((req: any) => {
      const precoSolicitado = parseFloat(req.requested_price || 0);
      const precoMinimo = req.product_minimo ? parseFloat(String(req.product_minimo).replace(',', '.')) : null;
      const precoMaximo = req.product_maximo ? parseFloat(String(req.product_maximo).replace(',', '.')) : null;
      const precoPromocional = req.product_promocional ? parseFloat(String(req.product_promocional).replace(',', '.')) : null;
      
      // Calcular Status do Preço
      let statusPreco = 'Sem preço mín.';
      if (precoMinimo && !isNaN(precoMinimo) && precoMinimo > 0) {
        if (precoSolicitado < precoMinimo) {
          statusPreco = 'Abaixo do Mínimo';
        } else if (precoSolicitado === precoMinimo) {
          statusPreco = 'Igual ao Mínimo';
        } else {
          statusPreco = 'Acima do Mínimo';
        }
      }

      // Calcular tempo de aprovação (em horas)
      let tempoAprovacaoHoras = null;
      if (req.approved_at && req.created_at) {
        const diff = new Date(req.approved_at).getTime() - new Date(req.created_at).getTime();
        tempoAprovacaoHoras = (diff / (1000 * 60 * 60)).toFixed(2);
      }

      // Calcular desconto (se preço solicitado vs preço máximo)
      let percentualDesconto = null;
      if (precoMaximo && !isNaN(precoMaximo) && precoMaximo > 0) {
        percentualDesconto = (((precoMaximo - precoSolicitado) / precoMaximo) * 100).toFixed(2);
      }

      return {
        // IDs e Identificação
        _id: req._id,
        created_at: req.created_at,
        updated_at: req.updated_at,
        
        // Vendedor
        requester_id: req.requester_id,
        requester_name: req.requester_name,
        
        // Cliente
        customer_code: req.customer_code,
        customer_name: req.customer_name,
        
        // Produto
        product_id: req.product_id,
        product_name: req.product_name,
        product_maximo: precoMaximo,
        product_minimo: precoMinimo,
        product_promocional: precoPromocional,
        
        // Preço e Quantidade
        requested_price: precoSolicitado,
        quantity: req.quantity || null,
        currency: req.currency,
        
        // Status e Aprovação
        status: req.status,
        approved_by: req.approved_by || null,
        approved_at: req.approved_at || null,
        rejected_by: req.rejected_by || null,
        rejected_at: req.rejected_at || null,
        
        // Supervisor
        codigo_supervisor: req.codigo_supervisor,
        nome_supervisor: req.nome_supervisor,
        
        // Observações
        notes: req.notes || null,
        rejection_reason: req.rejection_reason || null,
        
        // Cancelamento
        cancellation_requested: req.cancellation_requested || false,
        cancellation_reason: req.cancellation_reason || null,
        cancelled_by: req.cancelled_by || null,
        
        // Subrede (se aplicável)
        subrede_name: req.subrede_name || null,
        subrede_batch_id: req.subrede_batch_id || null,
        
        // Desconto (se aplicável)
        discount_percent: req.discount_percent || null,
        discounted_price: req.discounted_price || null,
        
        // ====== CAMPOS CALCULADOS PARA ANÁLISE ======
        statusPreco,
        tempoAprovacaoHoras,
        percentualDesconto,
        
        // Dia da semana da criação
        diaSemana: new Date(req.created_at).toLocaleDateString('pt-BR', { weekday: 'long' }),
        mes: new Date(req.created_at).toLocaleDateString('pt-BR', { month: 'long' }),
        ano: new Date(req.created_at).getFullYear(),
        
        // Flags booleanas para facilitar filtros
        isAprovado: req.status === 'Aprovado' || req.status === 'Aprovado pela Gerência',
        isRejeitado: req.status === 'Reprovado' || req.status === 'Reprovado pela Gerência',
        isPendente: req.status === 'Pendente' || req.status === 'Aguardando Gerência',
        isAlterado: req.status === 'Alterado',
        isCancelado: req.cancellation_requested === true,
        
        // Variação de preço
        variacaoPrecoMinimo: precoMinimo ? ((precoSolicitado - precoMinimo) / precoMinimo * 100).toFixed(2) : null,
        variacaoPrecoMaximo: precoMaximo ? ((precoSolicitado - precoMaximo) / precoMaximo * 100).toFixed(2) : null
      };
    });

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
      detailedRequests: enrichedRequests
    });
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar dashboard completo:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard', details: err });
  }
});

export default router;
