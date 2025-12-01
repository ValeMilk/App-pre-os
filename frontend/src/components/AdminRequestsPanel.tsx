import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Stack, Alert, Avatar, Divider, Tooltip, Chip } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
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
      'ID', 'Vendedor', 'ID Vendedor', 'Código Cliente', 'Cliente', 'ID Produto', 'Produto', 'Preço', 'Moeda', 'Status', 'Notas', 'Criado em', 'Aprovado por', 'Aprovado em'
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
    <Box height="100%" display="flex" alignItems="stretch">
      <Paper elevation={6} sx={{
        p: 5,
        borderRadius: 4,
        bgcolor: '#fff',
        minWidth: 400,
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)',
        overflowX: 'auto'
      }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
            <TableChartIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">Central de Solicitações</Typography>
            <Typography variant="subtitle2" color="text.secondary">Visualize e exporte todas as solicitações do sistema</Typography>
          </Box>
          <Box flex={1} />
          <Tooltip title="Atualizar solicitações">
            <Button 
              onClick={fetchRequests} 
              variant="outlined" 
              color="primary" 
              startIcon={<RefreshIcon />} 
              disabled={loading}
              sx={{ fontWeight: 600, mr: 1 }}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </Tooltip>
          <Tooltip title="Exportar todas as solicitações para CSV">
            <Button onClick={exportCsv} variant="contained" color="success" startIcon={<DownloadIcon />} sx={{ fontWeight: 600 }}>
              Exportar CSV
            </Button>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? (
          <Typography color="text.secondary">Carregando solicitações...</Typography>
        ) : (
          <Box sx={{ maxHeight: 500, overflow: 'auto', borderRadius: 2, border: '1px solid #e0e0e0', bgcolor: '#fff', width: '100%' }}>
            <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', fontSize: 15, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead style={{ background: '#f1f5fb' }}>
                <tr>
                  <th style={{ padding: 8 }}>ID</th>
                  <th style={{ padding: 8 }}>Vendedor</th>
                  <th style={{ padding: 8 }}>Cód. Cliente</th>
                  <th style={{ padding: 8 }}>Cliente</th>
                  <th style={{ padding: 8 }}>Produto</th>
                  <th style={{ padding: 8 }}>Preço</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Data</th>
                  <th style={{ padding: 8 }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} style={{ 
                    borderBottom: '1px solid #f0f0f0', 
                    background: r.status === 'Aprovado' ? '#c8e6c9' : r.status === 'Reprovado' ? '#ffcdd2' : 'inherit' 
                  }}>
                    <td style={{ padding: 8, color: '#888', wordBreak: 'break-all' }}>{r._id}</td>
                    <td style={{ padding: 8, fontWeight: 500, wordBreak: 'break-word' }}>{r.requester_name}</td>
                    <td style={{ padding: 8 }}>{r.customer_code}</td>
                    <td style={{ padding: 8, wordBreak: 'break-word' }}>{r.customer_name}</td>
                    <td style={{ padding: 8, wordBreak: 'break-word' }}>{r.product_name || r.product_id}</td>
                    <td style={{ padding: 8, color: '#1976d2', fontWeight: 600 }}>R$ {Number(r.requested_price).toFixed(2)}</td>
                    <td style={{ padding: 8 }}>
                      <Chip
                        label={r.status}
                        color={r.status === 'Aprovado' ? 'success' : r.status === 'Reprovado' ? 'error' : 'warning'}
                        size="small"
                        icon={<AssignmentIcon />}
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </td>
                    <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8, wordBreak: 'break-word' }}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <Typography color="text.secondary" mt={2} align="center">Nenhuma solicitação registrada.</Typography>}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
