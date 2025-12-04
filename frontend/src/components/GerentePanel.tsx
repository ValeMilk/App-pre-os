import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { API_ENDPOINTS } from '../config/api';
import { RequestsArraySchema } from '../schemas';

const API_URL = API_ENDPOINTS.requests.base;

interface Request {
  _id?: string;
  id?: string;
  requester_name?: string;
  requester_id?: string;
  customer_code?: string;
  customer_name?: string;
  product_id?: string;
  product_name?: string;
  requested_price?: string | number;
  quantity?: string | number;
  product_maximo?: string | number;
  product_minimo?: string | number;
  product_promocional?: string | number;
  currency?: string;
  status?: string;
  notes?: string;
  created_at?: string | Date;
  approved_by?: string;
  approved_at?: string | Date;
  subrede_batch_id?: string;
  subrede_name?: string;
  discount_percent?: string | number;
  discounted_price?: string | number;
}

interface GroupedRequest {
  batchId: string;
  subrede_name: string;
  requests: Request[];
  requester_name: string;
  product_id: string;
  product_name: string;
  requested_price: string;
  quantity: string;
  product_minimo: string;
  product_promocional: string;
  currency: string;
  status: string;
  notes: string;
  created_at: string;
  clientCount: number;
  discount_percent?: string;
  discounted_price?: string;
}

export default function GerentePanel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [individualRequests, setIndividualRequests] = useState<Request[]>([]);
  const [groupedProcessed, setGroupedProcessed] = useState<GroupedRequest[]>([]);
  const [individualProcessed, setIndividualProcessed] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      // Buscar todas as solicitações da gerência (pendentes e processadas)
      const response = await fetch(`${API_URL}/gerente`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          return;
        }
        throw new Error(`Erro ao buscar solicitações: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dados recebidos do backend (GerentePanel):', data);
      
      // Validar com Zod
      let validatedData;
      try {
        validatedData = RequestsArraySchema.parse(data);
      } catch (err) {
        console.error('Erro ao validar solicitações:', err);
        setError('Dados inválidos recebidos do servidor');
        return;
      }
      
      // Separar pendentes e processadas
      const pending = validatedData.filter((r: any) => r.status === 'Aguardando Gerência');
      const processed = validatedData.filter((r: any) => 
        r.status === 'Aprovado pela Gerência' || r.status === 'Reprovado pela Gerência' || r.status === 'Alterado'
      );
      
      // Agrupar pendentes por subrede
      const groupedPending: { [key: string]: Request[] } = {};
      const individualPending: Request[] = [];
      
      pending.forEach((req: any) => {
        if (req.subrede_batch_id) {
          if (!groupedPending[req.subrede_batch_id]) {
            groupedPending[req.subrede_batch_id] = [];
          }
          groupedPending[req.subrede_batch_id].push(req);
        } else {
          individualPending.push(req);
        }
      });
      
      const groupedPendingArray: GroupedRequest[] = Object.entries(groupedPending).map(([batchId, reqs]) => {
        const firstReq = reqs[0];
        return {
          batchId,
          subrede_name: firstReq.subrede_name || 'SUBREDE',
          requests: reqs,
          requester_name: firstReq.requester_name || '',
          product_id: firstReq.product_id || '',
          product_name: firstReq.product_name || '',
          requested_price: String(firstReq.requested_price || '0'),
          quantity: String(firstReq.quantity || ''),
          product_minimo: String(firstReq.product_minimo || ''),
          product_promocional: String(firstReq.product_promocional || ''),
          currency: firstReq.currency || 'R$',
          status: firstReq.status || 'Pending',
          notes: firstReq.notes || '',
          created_at: String(firstReq.created_at || ''),
          clientCount: reqs.length,
          discount_percent: String(firstReq.discount_percent || ''),
          discounted_price: String(firstReq.discounted_price || '')
        };
      });
      
      // Agrupar processadas por subrede
      const groupedProc: { [key: string]: Request[] } = {};
      const individualProc: Request[] = [];
      
      processed.forEach((req: any) => {
        if (req.subrede_batch_id) {
          if (!groupedProc[req.subrede_batch_id]) {
            groupedProc[req.subrede_batch_id] = [];
          }
          groupedProc[req.subrede_batch_id].push(req);
        } else {
          individualProc.push(req);
        }
      });
      
      const groupedProcArray: GroupedRequest[] = Object.entries(groupedProc).map(([batchId, reqs]) => {
        const firstReq = reqs[0];
        return {
          batchId,
          subrede_name: firstReq.subrede_name || 'SUBREDE',
          requests: reqs,
          requester_name: firstReq.requester_name || '',
          product_id: firstReq.product_id || '',
          product_name: firstReq.product_name || '',
          requested_price: String(firstReq.requested_price || '0'),
          quantity: String(firstReq.quantity || ''),
          product_minimo: String(firstReq.product_minimo || ''),
          product_promocional: String(firstReq.product_promocional || ''),
          currency: firstReq.currency || 'R$',
          status: firstReq.status || 'Pending',
          notes: firstReq.notes || '',
          created_at: String(firstReq.created_at || ''),
          clientCount: reqs.length,
          discount_percent: String(firstReq.discount_percent || ''),
          discounted_price: String(firstReq.discounted_price || '')
        };
      });
      
      // Ordenar processadas por data (mais recente primeiro)
      const sortedProcessed = processed.sort((a: any, b: any) => {
        const dateA = new Date(a.approved_at || a.created_at || 0).getTime();
        const dateB = new Date(b.approved_at || b.created_at || 0).getTime();
        return dateB - dateA; // Mais recente primeiro
      });

      // Ordenar agrupadas por data (mais recente primeiro)
      const sortedGroupedProc = groupedProcArray.sort((a, b) => {
        const dateA = new Date(a.requests[0]?.approved_at || a.created_at || 0).getTime();
        const dateB = new Date(b.requests[0]?.approved_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      // Ordenar individuais processadas por data (mais recente primeiro)
      const sortedIndividualProc = individualProc.sort((a: any, b: any) => {
        const dateA = new Date(a.approved_at || a.created_at || 0).getTime();
        const dateB = new Date(b.approved_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setRequests(pending as any);
      setAllRequests(sortedProcessed as any);
      setGroupedRequests(groupedPendingArray);
      setIndividualRequests(individualPending);
      setGroupedProcessed(sortedGroupedProc);
      setIndividualProcessed(sortedIndividualProc);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar solicitações');
      console.error('[GerentePanel] Erro ao buscar solicitações:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Polling a cada 5 segundos para atualizar em tempo real
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/${requestId}/gerente-approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar solicitação');
      }

      setSuccess('Solicitação aprovada pela gerência!');
      setTimeout(() => setSuccess(null), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar solicitação');
      console.error('[GerentePanel] Erro ao aprovar:', err);
    }
  };

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedBatchId(null);
    setRejectNotes('');
    setRejectDialogOpen(true);
  };

  const handleApproveBatch = async (batchId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/batch/${batchId}/gerente-approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao aprovar subrede');
      const data = await response.json();
      setSuccess(`${data.count} solicitações aprovadas pela gerência!`);
      setTimeout(() => setSuccess(null), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar subrede');
    }
  };

  const handleRejectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedRequestId(null);
    setRejectNotes('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequestId && !selectedBatchId) return;
    if (!rejectNotes.trim()) {
      setError('Por favor, informe o motivo da reprovação.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      let url: string;
      let successMsg: string;

      if (selectedBatchId) {
        url = `${API_URL}/batch/${selectedBatchId}/gerente-reject`;
        successMsg = 'Subrede reprovada pela gerência!';
      } else {
        url = `${API_URL}/${selectedRequestId}/gerente-reject`;
        successMsg = 'Solicitação reprovada pela gerência!';
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: rejectNotes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao reprovar');
      }

      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 3000);
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setSelectedBatchId(null);
      setRejectNotes('');
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao reprovar');
      console.error('[GerentePanel] Erro ao reprovar:', err);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedRequestId(null);
    setSelectedBatchId(null);
    setRejectNotes('');
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 2, md: 4 }, width: '100%', overflowX: 'auto' }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #0898f8ff 0%, #63acffff 100%)',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 1.5, sm: 2.5, md: 3 },
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' } }}>
          👔 Painel do Gerente
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Aprovar preços especiais abaixo do mínimo estabelecido
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: { xs: 1, sm: 1.5, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {success}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: { xs: 1, sm: 2 }, 
        mb: { xs: 1.5, sm: 2 }
      }}>
        <Typography variant="h6" fontWeight={600} color="error.main" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem', md: '1.25rem' } }}>
          🕐 Aguardando Aprovação
        </Typography>
        <Chip 
          label={requests.length} 
          color="error" 
          size="small"
          sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' } }}
        />
      </Box>

      {requests.length === 0 ? (
        <Alert severity="success">
          ✅ Nenhuma solicitação aguardando aprovação da gerência no momento.
        </Alert>
      ) : (
        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Vendedor</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Cliente</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Produto</strong></TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Solicitado</strong></TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>% Desc.</strong></TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço c/ Desc.</strong></TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Mínimo</strong></TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Promocional</strong></TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Qtd.</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Justificativa</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Motivo Supervisor</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data</strong></TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Subredes agrupadas */}
              {groupedRequests.map((group) => (
                <TableRow 
                  key={group.batchId} 
                  sx={{ 
                    '&:hover': { bgcolor: '#fff3e0' },
                    bgcolor: '#fffde7'
                  }}
                >
                  <TableCell>{group.requester_name}</TableCell>
                  <TableCell>
                    <strong>SUBREDE: {group.subrede_name}</strong>
                    <br />
                  </TableCell>
                  <TableCell>
                    {group.product_name || group.product_id}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {group.product_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <strong style={{ color: '#d32f2f' }}>
                      {group.currency} {group.requested_price}
                    </strong>
                  </TableCell>
                  <TableCell align="center">
                    {group.discount_percent ? (
                      <Chip label={`${group.discount_percent}%`} size="small" color="success" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {group.discounted_price ? (
                      <strong style={{ color: '#2e7d32' }}>{group.currency} {group.discounted_price}</strong>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      R$ {group.product_minimo || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="primary.main">
                      R$ {group.product_promocional || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <strong>{group.quantity || '—'}</strong>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.notes || '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2" color="warning.main" fontWeight={600}>
                      {group.requests[0]?.supervisor_notes || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(group.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Aprovar Subrede">
                      <IconButton
                        color="success"
                        onClick={() => handleApproveBatch(group.batchId)}
                        size="small"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reprovar Subrede">
                      <IconButton
                        color="error"
                        onClick={() => handleRejectBatch(group.batchId)}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Solicitações individuais */}
              {individualRequests.map((req) => (
                <TableRow 
                  key={req._id} 
                  sx={{ 
                    '&:hover': { bgcolor: '#fff8e1' },
                    bgcolor: '#fffde7'
                  }}
                >
                  <TableCell>{req.requester_name}</TableCell>
                  <TableCell>
                    {req.customer_name || req.customer_code}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {req.customer_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {req.product_name || req.product_id}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {req.product_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <strong style={{ color: '#d32f2f' }}>
                      {req.currency} {req.requested_price}
                    </strong>
                  </TableCell>
                  <TableCell align="center">
                    {req.discount_percent ? (
                      <Chip label={`${req.discount_percent}%`} size="small" color="success" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {req.discounted_price ? (
                      <strong style={{ color: '#2e7d32' }}>{req.currency} {req.discounted_price}</strong>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      R$ {req.product_minimo || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="primary.main">
                      R$ {req.product_promocional || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <strong>{req.quantity || '—'}</strong>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {req.notes || '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2" color="warning.main" fontWeight={600}>
                      {(req as any).supervisor_notes || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {req.created_at ? new Date(req.created_at).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Aprovar">
                      <IconButton
                        color="success"
                        onClick={() => req._id && handleApprove(req._id)}
                        size="small"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reprovar">
                      <IconButton
                        color="error"
                        onClick={() => req._id && handleRejectClick(req._id)}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Histórico de Solicitações Processadas */}
      {allRequests.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              📊 Histórico de Decisões
            </Typography>
            <Chip 
              label={allRequests.length} 
              color="default" 
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Vendedor</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Cliente</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Produto</strong></TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Solicitado</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>% Desc.</strong></TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço c/ Desc.</strong></TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Mínimo</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Qtd.</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Status</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Observações</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Motivo Supervisor</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data/Hora Aprovação/Reprovação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Misturar e ordenar subredes + individuais por data */}
                {[
                  ...groupedProcessed.map(g => ({ type: 'grouped' as const, data: g, date: g.requests[0]?.approved_at || g.created_at })),
                  ...individualProcessed.map(r => ({ type: 'individual' as const, data: r, date: r.approved_at || r.created_at }))
                ]
                  .sort((a, b) => {
                    const dateA = new Date(a.date || 0).getTime();
                    const dateB = new Date(b.date || 0).getTime();
                    return dateB - dateA; // Mais recente primeiro
                  })
                  .map((item) => {
                    if (item.type === 'grouped') {
                      const group = item.data;
                      const isApproved = group.status === 'Aprovado pela Gerência';
                      const isAltered = group.status === 'Alterado';
                      return (
                        <TableRow 
                          key={group.batchId}
                          sx={{ 
                            bgcolor: isAltered ? '#e3f2fd' : (isApproved ? '#f1f8e9' : '#ffebee'),
                            '&:hover': { bgcolor: isAltered ? '#bbdefb' : (isApproved ? '#e8f5e9' : '#ffcdd2') }
                          }}
                        >
                          <TableCell>{group.requester_name}</TableCell>
                          <TableCell>
                            <strong>SUBREDE: {group.subrede_name}</strong>
                            <br />
                          
                          </TableCell>
                          <TableCell>
                            {group.product_name || group.product_id}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {group.product_id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <strong style={{ color: '#d32f2f' }}>
                              {group.currency} {group.requested_price}
                            </strong>
                          </TableCell>
                          <TableCell align="center">
                            {group.discount_percent ? (
                              <Chip label={`${group.discount_percent}%`} size="small" color="success" />
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {group.discounted_price ? (
                              <strong style={{ color: '#2e7d32' }}>
                                {group.currency} {group.discounted_price}
                              </strong>
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              R$ {group.product_minimo || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <strong>{group.quantity || '—'}</strong>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={group.status}
                              size="small"
                              color={isAltered ? 'info' : (isApproved ? 'success' : 'error')}
                              icon={isApproved ? <CheckCircleIcon /> : <CancelIcon />}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {group.notes || '—'}
                          </TableCell>
                          <TableCell>
                            {group.created_at ? new Date(group.created_at).toLocaleDateString('pt-BR') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      const req = item.data;
                      const isApproved = req.status === 'Aprovado pela Gerência';
                      const isAltered = req.status === 'Alterado';
                      return (
                        <TableRow 
                          key={req._id}
                          sx={{ 
                            bgcolor: isAltered ? '#e3f2fd' : (isApproved ? '#f1f8e9' : '#ffebee'),
                            '&:hover': { bgcolor: isAltered ? '#bbdefb' : (isApproved ? '#e8f5e9' : '#ffcdd2') }
                          }}
                        >
                          <TableCell>{req.requester_name}</TableCell>
                          <TableCell>
                            {req.customer_name || req.customer_code}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {req.customer_code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {req.product_name || req.product_id}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {req.product_id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <strong style={{ color: '#d32f2f' }}>
                              {req.currency} {req.requested_price}
                            </strong>
                          </TableCell>
                          <TableCell align="center">
                            {req.discount_percent ? (
                              <Chip label={`${req.discount_percent}%`} size="small" color="success" />
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {req.discounted_price ? (
                              <strong style={{ color: '#2e7d32' }}>
                                {req.currency} {req.discounted_price}
                              </strong>
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              R$ {req.product_minimo || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <strong>{req.quantity || '—'}</strong>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={req.status}
                              size="small"
                              color={isAltered ? 'info' : (isApproved ? 'success' : 'error')}
                              icon={isApproved ? <CheckCircleIcon /> : <CancelIcon />}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.notes || '—'}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              {(req as any).supervisor_notes || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {req.approved_at ? new Date(req.approved_at).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : req.created_at ? new Date(req.created_at).toLocaleString('pt-BR', {
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
