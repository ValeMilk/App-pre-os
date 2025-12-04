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
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.requests.base;

interface CancellationRequest {
  _id: string;
  requester_name: string;
  requester_id: string;
  customer_code: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  requested_price: string;
  quantity: string;
  currency: string;
  status: string;
  cancellation_reason: string;
  cancellation_requested_at: string;
  created_at: string;
}

export default function AdminLixeira() {
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCancellationRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/cancellation-requests`, {
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
        throw new Error(`Erro ao buscar solicitações de cancelamento: ${response.statusText}`);
      }

      const data = await response.json();
      setCancellationRequests(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar solicitações de cancelamento');
      console.error('[AdminLixeira] Erro ao buscar:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellationRequests();
    // Polling a cada 5 segundos
    const interval = setInterval(fetchCancellationRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveCancel = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/${requestId}/approve-cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar cancelamento');
      }

      setSuccess('Cancelamento aprovado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      fetchCancellationRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar cancelamento');
      console.error('[AdminLixeira] Erro ao aprovar:', err);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', overflowX: 'auto' }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 1.5, sm: 2.5, md: 3 },
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' } }}>
          🗑️ Lixeira - Solicitações de Cancelamento
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Aprovar ou rejeitar solicitações de cancelamento dos vendedores
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
        <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem', md: '1.25rem' } }}>
          🗑️ Cancelamentos Pendentes
        </Typography>
        <Chip 
          label={cancellationRequests.length} 
          color="warning" 
          size="small"
          sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' } }}
        />
      </Box>

      {loading ? (
        <Typography color="text.secondary">Carregando solicitações de cancelamento...</Typography>
      ) : cancellationRequests.length === 0 ? (
        <Alert severity="info">
          ✅ Nenhuma solicitação de cancelamento pendente no momento.
        </Alert>
      ) : (
        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Vendedor</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Cliente</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Produto</strong></TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Preço</strong></TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Qtd.</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Status Atual</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Motivo do Cancelamento</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data Solicitação</strong></TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Data Cancelamento</strong></TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cancellationRequests.map((req) => (
                <TableRow 
                  key={req._id} 
                  sx={{ 
                    '&:hover': { bgcolor: '#fff3e0' },
                    bgcolor: '#fffde7'
                  }}
                >
                  <TableCell>
                    <strong>{req.requester_name}</strong>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {req.requester_id}
                    </Typography>
                  </TableCell>
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
                    <strong>{req.quantity || '—'}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={req.status}
                      size="small"
                      color={
                        req.status === 'Aprovado' || req.status === 'Aprovado pela Gerência' ? 'success' :
                        req.status === 'Reprovado' || req.status === 'Reprovado pela Gerência' ? 'error' :
                        req.status === 'Aguardando Gerência' ? 'warning' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      {req.cancellation_reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(req.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(req.cancellation_requested_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Aprovar Cancelamento">
                      <IconButton
                        color="success"
                        onClick={() => handleApproveCancel(req._id)}
                        size="small"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
