import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Stack, Alert, Avatar, Divider, Tooltip, Chip, IconButton } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.requests.all;

export default function AdminRequestsPanel() {
  const token = localStorage.getItem('token');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRequests = () => {
    if (!token) return;
    setLoading(true);
    fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (res.status === 401 || res.status === 403) {
          setError('Acesso negado. Apenas admin pode ver todas as solicitações.');
          return;
        }
        if (!res.ok) throw new Error('Erro ao buscar solicitações');
        const data = await res.json();
        setRequests(data);
        setError(null);
      })
      .catch(() => setError('Erro ao buscar solicitações do servidor.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  async function handleMarkAltered(requestId: string) {
    try {
      const res = await fetch(`${API_ENDPOINTS.requests.base}/${requestId}/mark-altered`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao marcar como alterado');
      }
      setSuccess('Solicitação marcada como Alterado!');
      setTimeout(() => setSuccess(null), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar solicitação');
    }
  }

  function exportCsv() {
    if (requests.length === 0) {
      setError('Nenhuma solicitação para exportar.');
      return;
    }
    setError(null);
    const rows = requests.map((r: any) => [
      r._id || '',
      r.requester_name,
      r.requester_id || '',
      r.customer_code,
      (r.customer_name || '').replace(/"/g, '""'),
      r.product_id,
      r.product_name || '',
      r.requested_price,
      r.currency,
      r.status,
      (r.notes || '').replace(/"/g, '""'),
      r.created_at,
      r.approved_by || '',
      r.approved_at || ''
    ]);
    const header = [
      'ID', 'Vendedor', 'ID Vendedor', 'Código Cliente', 'Cliente', 'ID Produto', 'Produto', 'Preço', 'Moeda', 'Status', 'Justificativa', 'Criado em', 'Aprovado por', 'Aprovado em'
    ];
    const csv = [header, ...rows].map((r: (string | number)[]) => r.map((c: string | number) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'todas_solicitacoes.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Arquivo CSV exportado!');
  }

  return (
    <Paper elevation={6} sx={{
      p: 4,
      borderRadius: 3,
      bgcolor: '#fff',
      width: '100%',
      boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)',
      height: 'fit-content',
      minHeight: 500
    }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
        <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
          <TableChartIcon />
        </Avatar>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700} color="primary.main">Central de Solicitações</Typography>
          <Typography variant="body2" color="text.secondary">Todas as solicitações do sistema</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar solicitações">
            <Button 
              onClick={fetchRequests} 
              variant="outlined" 
              color="primary" 
              size="small"
              startIcon={<RefreshIcon />} 
              disabled={loading}
              sx={{ fontWeight: 600 }}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </Tooltip>
          <Tooltip title="Exportar todas as solicitações para CSV">
            <Button onClick={exportCsv} variant="contained" color="success" size="small" startIcon={<DownloadIcon />} sx={{ fontWeight: 600 }}>
              Exportar
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? (
          <Typography color="text.secondary">Carregando solicitações...</Typography>
        ) : (
          <Box sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
            <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', fontSize: 14 }}>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5fb', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Vendedor</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Cód. Cliente</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Produto</th>
                  <th style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>Preço</th>
                  <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Qtd.</th>
                  <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Data</th>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Justificativa</th>
                  <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} style={{ 
                    borderBottom: '1px solid #e8e8e8', 
                    background: r.status === 'Alterado' ? '#e3f2fd' : r.status === 'Aprovado' ? '#e8f5e9' : r.status === 'Reprovado' ? '#ffebee' : '#fff'
                  }}>
                    <td style={{ padding: 10, color: '#666', fontSize: 12, wordBreak: 'break-all' }}>{r._id.substring(0, 6)}...</td>
                    <td style={{ padding: 10, fontWeight: 500 }}>{r.requester_name}</td>
                    <td style={{ padding: 10 }}>{r.customer_code}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word' }}>{r.customer_name}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word', fontSize: 13 }}>{r.product_name || r.product_id}</td>
                    <td style={{ padding: 10, color: '#1976d2', fontWeight: 600, textAlign: 'right' }}>R$ {Number(r.requested_price).toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>{r.quantity || '—'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <Chip
                        label={r.status}
                        color={r.status === 'Alterado' ? 'info' : r.status === 'Aprovado' ? 'success' : r.status === 'Reprovado' ? 'error' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </td>
                    <td style={{ padding: 10, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word', fontSize: 12, maxWidth: 150 }}>{r.notes || '—'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {(r.status === 'Aprovado' || r.status === 'Reprovado') && (
                        <Tooltip title="Marcar como Alterado">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleMarkAltered(r._id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {r.status === 'Alterado' && (
                        <Typography variant="caption" color="text.secondary">✓</Typography>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <Typography color="text.secondary" mt={3} mb={2} align="center">
                Nenhuma solicitação registrada.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
  );
}
