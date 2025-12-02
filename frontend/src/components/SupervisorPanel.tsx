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
}

export default function SupervisorPanel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

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
      setRequests(data);
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
    if (!selectedRequestId) return;
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

      const response = await fetch(`${API_URL}/${selectedRequestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: rejectNotes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao reprovar solicitação');
      }

      setSuccess('Solicitação reprovada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setRejectNotes('');
      fetchRequests(); // Atualiza lista
    } catch (err: any) {
      setError(err.message || 'Erro ao reprovar solicitação');
      console.error('[SupervisorPanel] Erro ao reprovar:', err);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedRequestId(null);
    setRejectNotes('');
  };

  const handleEncaminharGerencia = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/${requestId}/encaminhar-gerencia`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao encaminhar para gerência');
      }

      setSuccess('Solicitação encaminhada para gerência!');
      setTimeout(() => setSuccess(null), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao encaminhar para gerência');
      console.error('[SupervisorPanel] Erro ao encaminhar:', err);
    }
  };

  const canApproveDirectly = (request: Request): boolean => {
    if (!request.product_minimo || !request.requested_price) return true;
    const priceNum = Number(request.requested_price.replace(',', '.'));
    const minPrice = Number(request.product_minimo.replace(',', '.'));
    return priceNum >= minPrice;
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const processedRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
        Painel do Supervisor — Aprovar/Reprovar Solicitações
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Solicitações Pendentes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} color="secondary.main" gutterBottom>
          Solicitações Pendentes ({pendingRequests.length})
        </Typography>
        {pendingRequests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma solicitação pendente no momento.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Vendedor</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Produto</strong></TableCell>
                  <TableCell align="right"><strong>Preço</strong></TableCell>
                  <TableCell align="center"><strong>Qtd.</strong></TableCell>
                  <TableCell><strong>Justificativa</strong></TableCell>
                  <TableCell><strong>Data</strong></TableCell>
                  <TableCell align="center"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((req) => (
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
                      <strong>{req.currency} {req.requested_price}</strong>
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
                        <Tooltip title="Preço abaixo do mínimo - Encaminhar para Gerência">
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={() => handleEncaminharGerencia(req._id)}
                          >
                            Encaminhar Gerência
                          </Button>
                        </Tooltip>
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
        <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
          Histórico Processado ({processedRequests.length})
        </Typography>
        {processedRequests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma solicitação processada ainda.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Vendedor</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Produto</strong></TableCell>
                  <TableCell align="right"><strong>Preço</strong></TableCell>
                  <TableCell align="center"><strong>Qtd.</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell><strong>Justificativa</strong></TableCell>
                  <TableCell><strong>Aprovado por</strong></TableCell>
                  <TableCell><strong>Data Aprovação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedRequests.map((req) => (
                  <TableRow
                    key={req._id}
                    sx={{
                      bgcolor: req.status === 'Alterado' ? '#e3f2fd' : req.status === 'Aprovado' ? '#e8f5e9' : req.status === 'Reprovado' ? '#ffebee' : 'inherit'
                    }}
                  >
                    <TableCell>{req.requester_name}</TableCell>
                    <TableCell>{req.customer_name || req.customer_code}</TableCell>
                    <TableCell>{req.product_name || req.product_id}</TableCell>
                    <TableCell align="right">
                      {req.currency} {req.requested_price}
                    </TableCell>
                    <TableCell align="center">
                      {req.quantity || '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={req.status}
                        color={
                          req.status === 'Alterado' ? 'info' : 
                          req.status === 'Aprovado' || req.status === 'Aprovado pela Gerência' ? 'success' : 
                          req.status === 'Aguardando Gerência' ? 'warning' :
                          'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{req.notes || '—'}</TableCell>
                    <TableCell>{req.approved_by || '—'}</TableCell>
                    <TableCell>
                      {req.approved_at ? new Date(req.approved_at).toLocaleDateString('pt-BR') : '—'}
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
    </Paper>
  );
}
