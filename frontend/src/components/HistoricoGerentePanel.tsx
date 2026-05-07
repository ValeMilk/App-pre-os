import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Alert,
  TextField,
  Button,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.requests.base;

interface Request {
  _id?: string;
  id?: string;
  requester_name?: string;
  customer_code?: string;
  customer_name?: string;
  product_id?: string;
  product_name?: string;
  requested_price?: string | number;
  quantity?: string | number;
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

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary' | 'secondary'> = {
  'Pendente': 'warning',
  'Pending': 'warning',
  'Aguardando Gerência': 'warning',
  'Aprovado': 'success',
  'Aprovado pela Gerência': 'success',
  'Alterado': 'info',
  'Reprovado': 'error',
  'Cancelado': 'error',
  'Cancelamento Pendente': 'secondary',
};

export default function HistoricoGerentePanel() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [vendorSearch, setVendorSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [priceSearch, setPriceSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Token não encontrado. Faça login novamente.'); return; }

      const response = await fetch(`${API_URL}/gerente?limit=9999`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          return;
        }
        throw new Error(`Erro ao buscar histórico: ${response.statusText}`);
      }

      const data = await response.json();
      // Ordenar do mais recente para o mais antigo
      const sorted = [...data].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      setRequests(sorted);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const v = vendorSearch.trim().toLowerCase();
      const c = customerSearch.trim().toLowerCase();
      const cd = codeSearch.trim().toLowerCase();
      const p = productSearch.trim().toLowerCase();
      const pr = priceSearch.trim().replace(',', '.');
      const st = statusSearch.trim().toLowerCase();

      if (v && !(r.requester_name || '').toLowerCase().includes(v)) return false;
      if (c && !(r.customer_name || '').toLowerCase().includes(c)) return false;
      if (cd && !String(r.customer_code || '').toLowerCase().includes(cd)) return false;
      if (p && !(r.product_name || '').toLowerCase().includes(p) && !String(r.product_id || '').includes(p)) return false;
      if (pr && !String(r.requested_price || '').replace(',', '.').includes(pr)) return false;
      if (st && !(r.status || '').toLowerCase().includes(st)) return false;

      if (dateStart || dateEnd) {
        const d = r.created_at ? new Date(r.created_at as any) : null;
        if (!d || isNaN(d.getTime())) return false;
        if (dateStart) {
          const ds = new Date(dateStart);
          if (d < ds) return false;
        }
        if (dateEnd) {
          const de = new Date(dateEnd);
          de.setDate(de.getDate() + 1);
          if (d >= de) return false;
        }
      }

      return true;
    });
  }, [requests, vendorSearch, customerSearch, codeSearch, productSearch, priceSearch, statusSearch, dateStart, dateEnd]);

  const clearFilters = () => {
    setVendorSearch('');
    setCustomerSearch('');
    setCodeSearch('');
    setProductSearch('');
    setPriceSearch('');
    setStatusSearch('');
    setDateStart('');
    setDateEnd('');
  };

  const hasFilters = vendorSearch || customerSearch || codeSearch || productSearch || priceSearch || statusSearch || dateStart || dateEnd;

  const formatDate = (d: any) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 2, md: 4 }, width: '100%', overflowX: 'auto' }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 1.5, sm: 2.5, md: 3 },
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/gerente')}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}
          variant="outlined"
          size="small"
        >
          Voltar
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' } }}>
            📋 Histórico de Solicitações
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Todo o histórico de solicitações de preço
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Box sx={{
        p: { xs: 1.5, sm: 2 },
        mb: { xs: 1.5, sm: 2 },
        bgcolor: '#f5f9ff',
        border: '1px solid #cfe1ff',
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0d47a1', minWidth: 80, width: '100%' }}>
          🔎 Filtros
        </Typography>
        <TextField
          label="Vendedor"
          size="small"
          value={vendorSearch}
          onChange={e => setVendorSearch(e.target.value)}
          placeholder="Nome do vendedor"
          sx={{ minWidth: 160, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Cliente"
          size="small"
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
          placeholder="Nome do cliente"
          sx={{ minWidth: 160, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Código do cliente"
          size="small"
          value={codeSearch}
          onChange={e => setCodeSearch(e.target.value)}
          placeholder="Código"
          sx={{ minWidth: 130, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Produto"
          size="small"
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          placeholder="Nome ou código"
          sx={{ minWidth: 160, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Preço"
          size="small"
          value={priceSearch}
          onChange={e => setPriceSearch(e.target.value)}
          placeholder="Ex: 32.00"
          sx={{ minWidth: 110, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Status"
          size="small"
          value={statusSearch}
          onChange={e => setStatusSearch(e.target.value)}
          placeholder="Ex: Aprovado"
          sx={{ minWidth: 130, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          label="Data início"
          size="small"
          type="date"
          value={dateStart}
          onChange={e => setDateStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Data fim"
          size="small"
          type="date"
          value={dateEnd}
          onChange={e => setDateEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />
        {hasFilters && (
          <Button
            size="small"
            onClick={clearFilters}
            startIcon={<ClearIcon />}
            variant="outlined"
            color="secondary"
          >
            Limpar
          </Button>
        )}
      </Box>

      {/* Contagem */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Carregando...' : `${filtered.length} solicitação(ões) encontrada(s) de ${requests.length} no total`}
        </Typography>
        <Button size="small" onClick={fetchAll} disabled={loading} variant="text">
          🔄 Atualizar
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#1565c0', color: 'white', fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}>
                <TableCell>Data</TableCell>
                <TableCell>Vendedor</TableCell>
                <TableCell>Cód. Cliente</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Desconto</TableCell>
                <TableCell>Preço c/ desc.</TableCell>
                <TableCell>Qtd</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subrede</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => (
                  <TableRow
                    key={r._id || r.id || idx}
                    sx={{
                      '&:hover': { bgcolor: '#f0f7ff' },
                      bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 'inherit' }}>{formatDate(r.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>{r.requester_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>{r.customer_code || '-'}</TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>{r.customer_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>
                      <Box>
                        <div>{r.product_name || '-'}</div>
                        {r.product_id && <Typography variant="caption" color="text.secondary">Cód: {r.product_id}</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 'inherit' }}>
                      R$ {r.requested_price ?? '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>
                      {r.discount_percent ? (
                        <Chip label={`${r.discount_percent}%`} size="small" color="success" />
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>
                      {r.discounted_price ? (
                        <strong style={{ color: '#2e7d32' }}>R$ {r.discounted_price}</strong>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>{r.quantity ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>
                      <Chip
                        label={r.status || 'Desconhecido'}
                        size="small"
                        color={STATUS_COLORS[r.status || ''] || 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 'inherit' }}>{r.subrede_name || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
