import React, { useEffect, useState, useMemo } from 'react';
import { Box, Paper, Typography, Button, Stack, Alert, Avatar, Divider, Tooltip, Chip, IconButton, TextField, InputAdornment, Menu, MenuItem } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { API_ENDPOINTS } from '../config/api';
import { RequestsArraySchema } from '../schemas';

const API_URL = API_ENDPOINTS.requests.all;

export default function AdminRequestsPanel() {
  const token = localStorage.getItem('token');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterColumn, setFilterColumn] = useState<string>('');

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
        
        // Validar com Zod
        try {
          const validatedRequests = RequestsArraySchema.parse(data);
          setRequests(validatedRequests);
          setError(null);
        } catch (err) {
          console.error('Erro ao validar solicitações:', err);
          setError('Dados inválidos recebidos do servidor');
        }
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

  // Filtragem de dados
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Filtro por status
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filtro de pesquisa global
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.requester_name?.toLowerCase().includes(term) ||
        r.customer_code?.toLowerCase().includes(term) ||
        r.customer_name?.toLowerCase().includes(term) ||
        r.product_name?.toLowerCase().includes(term) ||
        r.product_id?.toLowerCase().includes(term) ||
        r.notes?.toLowerCase().includes(term) ||
        r.status?.toLowerCase().includes(term) ||
        r.requested_price?.toString().includes(term) ||
        r.quantity?.toString().includes(term)
      );
    }

    return filtered;
  }, [requests, searchTerm, statusFilter]);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>, column: string) => {
    setAnchorEl(event.currentTarget);
    setFilterColumn(column);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
    setFilterColumn('');
  };

  const handleStatusFilterSelect = (status: string) => {
    setStatusFilter(status);
    handleFilterClose();
  };

  function exportCsv() {
    if (filteredRequests.length === 0) {
      setError('Nenhuma solicitação para exportar.');
      return;
    }
    setError(null);
    const rows = filteredRequests.map((r: any) => [
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
  }

  return (
    <Paper elevation={6} sx={{
      p: { xs: 1.5, sm: 2.5, md: 4 },
      borderRadius: { xs: 2, sm: 3 },
      bgcolor: '#feffffff',
      width: '100%',
      maxWidth: 'none',
      margin: 0,
      boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)',
      height: 'fit-content',
      minHeight: '85vh'
    }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={2} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={2} flex={1} width={{ xs: '100%', md: 'auto' }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: { xs: 40, sm: 44, md: 48 }, height: { xs: 40, sm: 44, md: 48 } }}>
            <TableChartIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }}>Central de Solicitações</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>Todas as solicitações do sistema</Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} width={{ xs: '100%', md: 'auto' }}>
          <Tooltip title="Atualizar solicitações">
            <Button 
              onClick={fetchRequests} 
              variant="outlined" 
              color="primary" 
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
              disabled={loading}
              sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, flex: { xs: 1, sm: 'initial' } }}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </Tooltip>
          <Tooltip title="Exportar todas as solicitações para CSV">
            <Button onClick={exportCsv} variant="contained" color="success" size="small" startIcon={<DownloadIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />} sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, flex: { xs: 1, sm: 'initial' } }}>
              Exportar
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Barra de Pesquisa e Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <TextField
          placeholder="Pesquisar em todas as colunas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: { xs: '100%', sm: 400 } }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => handleFilterClick(e, 'status')}
          size="small"
          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
        >
          Status: {statusFilter}
        </Button>
        {(searchTerm || statusFilter !== 'Todos') && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('Todos');
            }}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Limpar Filtros
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 'auto' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
          {filteredRequests.length} de {requests.length} solicitações
        </Typography>
      </Stack>

      {/* Menu de Filtro */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleStatusFilterSelect('Todos')}>Todos</MenuItem>
        <MenuItem onClick={() => handleStatusFilterSelect('Pendente')}>Pendente</MenuItem>
        <MenuItem onClick={() => handleStatusFilterSelect('Aprovado')}>Aprovado</MenuItem>
        <MenuItem onClick={() => handleStatusFilterSelect('Reprovado')}>Reprovado</MenuItem>
        <MenuItem onClick={() => handleStatusFilterSelect('Alterado')}>Alterado</MenuItem>
      </Menu>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? (
          <Typography color="text.secondary">Carregando solicitações...</Typography>
        ) : (
          <Box sx={{ 
            maxHeight: '65vh', 
            overflow: 'auto', 
            overflowX: { xs: 'auto', md: 'auto' },
            borderRadius: 2, 
            border: '1px solid #e0e0e0', 
            bgcolor: '#fafafa',
            WebkitOverflowScrolling: 'touch' // suporte smooth scroll iOS
          }}>
            <table style={{ width: '100%', minWidth: 1300, borderCollapse: 'collapse', fontSize: 14 }}>
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
                {filteredRequests.map(r => (
                  <tr key={r._id} style={{ 
                    borderBottom: '1px solid #e8e8e8', 
                    background: 
                      r.status === 'Alterado' ? '#e3f2fd' : 
                      r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? '#e8f5e9' : 
                      r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? '#ffebee' :
                      r.status === 'Aguardando Gerência' ? '#fff3e0' :
                      '#fff'
                  }}>
                    <td style={{ padding: 10, color: '#666', fontSize: 16, wordBreak: 'break-all' }}>{r._id.substring(0, 6)}...</td>
                    <td style={{ padding: 10, fontWeight: 500 }}>{r.requester_name}</td>
                    <td style={{ padding: 10 }}>{r.customer_code}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word' }}>{r.customer_name}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word', fontSize: 13 }}>{r.product_name || r.product_id}</td>
                    <td style={{ padding: 10, color: '#1976d2', fontWeight: 600, textAlign: 'right' }}>R$ {Number(r.requested_price).toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>{r.quantity || '—'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <Chip
                        label={r.status}
                        color={
                          r.status === 'Alterado' ? 'info' : 
                          r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? 'success' : 
                          r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? 'error' : 
                          'warning'
                        }
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 14 }}
                      />
                    </td>
                    <td style={{ padding: 10, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: 10, wordBreak: 'break-word', fontSize: 14, maxWidth: 150 }}>{r.notes || '—'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {(r.status === 'Aprovado' || r.status === 'Reprovado' || r.status === 'Aprovado pela Gerência' || r.status === 'Reprovado pela Gerência') && (
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
            {filteredRequests.length === 0 && requests.length > 0 && (
              <Typography color="text.secondary" mt={3} mb={2} align="center">
                Nenhuma solicitação encontrada com os filtros aplicados.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
  );
}
