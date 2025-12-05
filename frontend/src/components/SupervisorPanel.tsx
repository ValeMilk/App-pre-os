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
  _id: string;
  requester_name: string;
  requester_id: string;
  customer_code: string;
  customer_name?: string;
  product_id: string;
  product_name?: string;
  requested_price: string;
  quantity?: string;
  product_maximo?: string;
  product_minimo?: string;
  product_promocional?: string;
  currency: string;
  status: string;
  notes?: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  subrede_batch_id?: string;
  subrede_name?: string;
  discount_percent?: string;
  discounted_price?: string;
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
  product_maximo: string;
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

export default function SupervisorPanel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [individualRequests, setIndividualRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [encaminharDialogOpen, setEncaminharDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [encaminharNotes, setEncaminharNotes] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/supervisor`, {
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
      console.log('📊 Dados recebidos do backend (SupervisorPanel):', data);
      
      // Validar com Zod
      try {
        const validatedRequests = RequestsArraySchema.parse(data);
        setRequests(validatedRequests as any);
      } catch (err) {
        console.error('Erro ao validar solicitações:', err);
        setError('Dados inválidos recebidos do servidor');
        return;
      }
      
      // Agrupar solicitações por subrede_batch_id
      const grouped: { [key: string]: Request[] } = {};
      const individual: Request[] = [];
      
      data.forEach((req: Request) => {
        if (req.subrede_batch_id) {
          if (!grouped[req.subrede_batch_id]) {
            grouped[req.subrede_batch_id] = [];
          }
          grouped[req.subrede_batch_id].push(req);
        } else {
          individual.push(req);
        }
      });
      
      // Converter para array de GroupedRequest
      const groupedArray: GroupedRequest[] = Object.entries(grouped).map(([batchId, reqs]) => {
        const firstReq = reqs[0];
        return {
          batchId,
          subrede_name: firstReq.subrede_name || 'SUBREDE',
          requests: reqs,
          requester_name: firstReq.requester_name,
          product_id: firstReq.product_id,
          product_name: firstReq.product_name || '',
          requested_price: firstReq.requested_price,
          quantity: firstReq.quantity || '',
          product_maximo: firstReq.product_maximo || '',
          product_minimo: firstReq.product_minimo || '',
          product_promocional: firstReq.product_promocional || '',
          currency: firstReq.currency,
          status: firstReq.status,
          notes: firstReq.notes || '',
          created_at: firstReq.created_at,
          clientCount: reqs.length,
          discount_percent: firstReq.discount_percent,
          discounted_price: firstReq.discounted_price
        };
      });
      
      setGroupedRequests(groupedArray);
      setIndividualRequests(individual);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar solicitações');
      console.error('[SupervisorPanel] Erro ao buscar solicitações:', err);
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

      const response = await fetch(`${API_URL}/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao aprovar solicitação');
      }

      setSuccess('Solicitação aprovada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      fetchRequests(); // Atualiza lista
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar solicitação');
      console.error('[SupervisorPanel] Erro ao aprovar:', err);
    }
  };

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId);
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
        // Reprovar em lote
        url = `${API_URL}/batch/${selectedBatchId}/reject`;
        successMsg = 'Subrede reprovada com sucesso!';
      } else {
        // Reprovar individual
        url = `${API_URL}/${selectedRequestId}/reject`;
        successMsg = 'Solicitação reprovada com sucesso!';
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
        throw new Error(errorData.erro || 'Erro ao reprovar');
      }

      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 3000);
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setSelectedBatchId(null);
      setRejectNotes('');
      fetchRequests(); // Atualiza lista
    } catch (err: any) {
      setError(err.message || 'Erro ao reprovar');
      console.error('[SupervisorPanel] Erro ao reprovar:', err);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedRequestId(null);
    setSelectedBatchId(null);
    setRejectNotes('');
  };

  const handleOpenEncaminharDialog = (requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedBatchId(null);
    setEncaminharNotes('');
    setEncaminharDialogOpen(true);
  };

  const handleOpenEncaminharBatchDialog = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedRequestId(null);
    setEncaminharNotes('');
    setEncaminharDialogOpen(true);
  };

  const handleConfirmEncaminhar = async () => {
    if (!encaminharNotes.trim()) {
      setError('Por favor, forneça uma justificativa para encaminhar à gerência');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      let url = '';
      if (selectedRequestId) {
        url = `${API_URL}/${selectedRequestId}/encaminhar-gerencia`;
      } else if (selectedBatchId) {
        url = `${API_URL}/batch/${selectedBatchId}/encaminhar-gerencia`;
      } else {
        return;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ supervisor_notes: encaminharNotes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao encaminhar para gerência');
      }

      setSuccess('Solicitação encaminhada para gerência com justificativa!');
      setTimeout(() => setSuccess(null), 3000);
      setEncaminharDialogOpen(false);
      setEncaminharNotes('');
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao encaminhar para gerência');
      console.error('[SupervisorPanel] Erro ao encaminhar:', err);
    }
  };

  // Funções para aprovar/reprovar/encaminhar em lote (subrede)
  const handleApproveBatch = async (batchId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/batch/${batchId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao aprovar subrede');
      const data = await response.json();
      setSuccess(`${data.count} solicitações aprovadas com sucesso!`);
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



  const canApproveDirectly = (request: Request | GroupedRequest): boolean => {
    if (!request.product_minimo || !request.requested_price) return true;
    const priceNum = Number(request.requested_price.replace(',', '.'));
    const minPrice = Number(request.product_minimo.replace(',', '.'));
    return priceNum >= minPrice;
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const processedRequests = requests
    .filter(r => r.status !== 'Pending')
    .sort((a, b) => {
      const dateA = a.approved_at ? new Date(a.approved_at).getTime() : 0;
      const dateB = b.approved_at ? new Date(b.approved_at).getTime() : 0;
      return dateB - dateA; // Mais recente primeiro
    });

  return (
    <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 2, md: 4 }, width: '100%', overflowX: 'auto' }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #000000ff 0%, #0c0c0cff 100%)',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 1.5, sm: 2.5, md: 3 },
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' } }}>
          🎯 Painel do Supervisor
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Aprovar ou reprovar solicitações de preços dos vendedores
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

      {/* Solicitações Pendentes */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 1, sm: 2 }, 
          mb: 2 
        }}>
          <Typography variant="h6" fontWeight={600} color="secondary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            ⏳ Solicitações Pendentes
          </Typography>
          <Chip 
            label={pendingRequests.length} 
            color="warning" 
            size="small"
            sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' } }}
          />
        </Box>
        {pendingRequests.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Nenhuma solicitação pendente no momento.
          </Typography>
        ) : (
          <TableContainer sx={{ 
            overflowX: 'auto', 
            maxWidth: '100%',
            borderRadius: { xs: 1, sm: 2 },
            border: '1px solid #e0e0e0',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Table size="small" sx={{ width: '100%', minWidth: { xs: 800, md: '100%' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Vendedor</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Cliente</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Produto</strong></TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Solicitado</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>% Desc.</strong></TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço c/ Desc.</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Qtd.</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Justificativa</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Solicitações agrupadas por subrede */}
                {groupedRequests.filter(g => g.status === 'Pending').map((group) => (
                  <TableRow key={group.batchId} sx={{ '&:hover': { bgcolor: '#fff9c4' }, bgcolor: '#fffde7' }}>
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
                    <strong>R$ {group.requested_price}</strong>
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
                    <TableCell align="center">
                      <strong>{group.quantity || '—'}</strong>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {group.notes ? group.notes.replace(/\[SUBREDE:.*?\]\s*/gi, '').trim() || '—' : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(group.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell align="center">
                      {canApproveDirectly(group) ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <Tooltip title="Encaminhar Subrede para Gerência">
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={() => handleOpenEncaminharBatchDialog(group.batchId)}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: '#ff9800',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)',
                                '&:hover': {
                                  bgcolor: '#f57c00',
                                  boxShadow: '0 3px 6px rgba(255, 152, 0, 0.4)'
                                }
                              }}
                            >
                              Gerência
                            </Button>
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
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Solicitações individuais */}
                {individualRequests.filter(r => r.status === 'Pending').map((req) => (
                  <TableRow key={req._id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
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
                    <strong>R$ {req.requested_price}</strong>
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
                        <strong style={{ color: '#2e7d32' }}>R$ {req.discounted_price}</strong>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <strong>{req.quantity || '—'}</strong>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.notes || '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell align="center">
                      {canApproveDirectly(req) ? (
                        <>
                          <Tooltip title="Aprovar">
                            <IconButton
                              color="success"
                              onClick={() => handleApprove(req._id)}
                              size="small"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reprovar">
                            <IconButton
                              color="error"
                              onClick={() => handleRejectClick(req._id)}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Encaminhar para Gerência">
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={() => handleOpenEncaminharDialog(req._id)}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: { xs: '0.35rem', sm: '0.75rem' },
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: '#ff9800',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)',
                                '&:hover': {
                                  bgcolor: '#f57c00',
                                  boxShadow: '0 3px 6px rgba(255, 152, 0, 0.4)'
                                }
                              }}
                            >
                              Gerência
                            </Button>
                          </Tooltip>
                          <Tooltip title="Reprovar">
                            <IconButton
                              color="error"
                              onClick={() => handleRejectClick(req._id)}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Histórico Processado */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            📋 Histórico Processado
          </Typography>
          <Chip 
            label={processedRequests.length} 
            color="default" 
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        {processedRequests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma solicitação processada ainda.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Vendedor</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Cliente</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Produto</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço Solicitado</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>% Desc.</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço c/ Desc.</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Qtd.</strong></TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Status</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Justificativa</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Aprovado por</strong></TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data/Hora Aprovação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedRequests.map((req) => (
                  <TableRow
                    key={req._id}
                    sx={{
                      bgcolor: req.status === 'Cancelado' ? '#d8d2d2ff' : req.status === 'Alterado' ? '#a8dbffff' : req.status === 'Aprovado pela Gerência' ? '#f8f8f8ff' : req.status === 'Aprovado' ? '#fafdfaff' :req.status === 'Reprovado' ? '#f18a9aff' : 'inherit'
                    }}
                  >
                    <TableCell>{req.requester_name}</TableCell>
                    <TableCell>{req.customer_name || req.customer_code}</TableCell>
                    <TableCell>{req.product_name || req.product_id}</TableCell>
                    <TableCell align="right">
                      <strong style={{ color: '#d32f2f' }}>
                        R$ {req.requested_price}
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
                          R$ {req.discounted_price}
                        </strong>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {req.quantity || '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={req.status}
                        color={
                          req.status === 'Alterado' ? 'info' : 
                          req.status === 'Aprovado' ? 'success' :
                          req.status === 'Aprovado pela Gerência' ? 'warning' : 
                          req.status === 'Aguardando Gerência' ? 'warning' :
                          req.status === 'Cancelado' ? 'default' :
                          'error'
                        }
                        size="small"
                        sx={
                          req.status === 'Cancelado' ? { bgcolor: '#000', color: 'white', fontWeight: 600 } :
                          req.status === 'Aprovado pela Gerência' ? { bgcolor: '#ffe44aff', color: '#000', fontWeight: 700 } : 
                          {}
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{req.notes || '—'}</TableCell>
                    <TableCell>{req.approved_by || '—'}</TableCell>
                    <TableCell>
                      {req.approved_at ? new Date(req.approved_at).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Dialog de Reprovação */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Reprovar Solicitação</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo da Reprovação"
            multiline
            rows={4}
            fullWidth
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Explique o motivo da reprovação..."
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={!rejectNotes.trim()}
          >
            Confirmar Reprovação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Encaminhar para Gerência com Justificativa */}
      <Dialog open={encaminharDialogOpen} onClose={() => setEncaminharDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Encaminhar para Gerência</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor, forneça uma justificativa para o encaminhamento desta solicitação à gerência.
          </Typography>
          <TextField
            label="Justificativa do Supervisor"
            multiline
            rows={4}
            fullWidth
            value={encaminharNotes}
            onChange={(e) => setEncaminharNotes(e.target.value)}
            placeholder="Explique o motivo do encaminhamento para gerência..."
            autoFocus
            sx={{ mt: 1 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEncaminharDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmEncaminhar}
            color="warning"
            variant="contained"
            disabled={!encaminharNotes.trim()}
          >
            Confirmar Encaminhamento
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
