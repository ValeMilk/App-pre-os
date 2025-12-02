import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { Cliente } from '../utils/parseCsv'
import { Produto } from '../utils/parseProdutosCsv'
import { Box, Button, TextField, Typography, Alert, Stack, Paper, Autocomplete, Divider, Slide, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material'
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';

type Props = {
  clientes: Cliente[]
  produtos: Produto[]
  onClientesLoaded: (c: Cliente[]) => void
}

type PriceRequest = {
  id: string
  requester_name: string
  requester_id?: string
  customer_code: string
  customer_name?: string
  product_id: string
  product_name?: string
  requested_price: string
  quantity?: string
  currency: string
  status: string
  notes?: string
  created_at: string
  approved_by?: string
  approved_at?: string
}

import { API_ENDPOINTS } from '../config/api';
const API_URL = API_ENDPOINTS.requests.base;

export default function RequestForm({ clientes, produtos, onClientesLoaded }: Props) {
  const token = localStorage.getItem('token');
  // Estados do formulário e feedback
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [requests, setRequests] = useState<PriceRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Carregar solicitações do backend
  const fetchRequests = () => {
    if (!token) return;
    fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          return;
        }
        if (!res.ok) throw new Error('Erro ao buscar solicitações');
        const data = await res.json();
        setRequests(data);
      })
      .catch(() => setError('Erro ao buscar solicitações do servidor.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchRequests();
    // Polling a cada 5 segundos para atualizar status em tempo real
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Upload de clientes.csv
  function onFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      complete: (res: any) => {
        const parsed = res.data
          .filter((r: any[]) => r.length >= 2)
          .map((r: any[]) => ({
            codigo: r[0]?.trim(),
            nome_fantasia: String(r[1] || '').trim(),
            vendedor_code: r[2]?.trim(),
            vendedor_name: r[3]?.trim(),
            extra: r[4]?.trim()
          }))
        onClientesLoaded(parsed)
      }
    })
  }

  // Validação e submit do formulário

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedCustomer) {
      setError('Selecione um cliente válido.');
      return;
    }
    if (!selectedProduct) {
      setError('Selecione um produto válido.');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Informe um preço válido (número maior que zero).');
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError('Informe uma quantidade válida (número maior que zero).');
      return;
    }

    // Validação de faixa de preço do produto
    if (selectedProduct.promocional && selectedProduct.maximo && selectedProduct.minimo) {
      const priceNum = Number(price.replace(',', '.'));
      const minPrice = Number(selectedProduct.minimo.replace(',', '.'));
      const maxPrice = Number(selectedProduct.maximo.replace(',', '.'));
      const promocionalPrice = Number(selectedProduct.promocional.replace(',', '.'));
      
      // Se preço acima do máximo, bloqueia
      if (priceNum > maxPrice) {
        setError(`Preço acima do máximo permitido. Máximo: R$ ${selectedProduct.maximo}`);
        return;
      }

      // Se preço abaixo do mínimo, solicita confirmação
      if (priceNum < minPrice && !pendingSubmit) {
        setConfirmDialogOpen(true);
        return;
      }
    }

    // Prosseguir com o envio
    await processSubmit();
  }

  async function processSubmit() {
    setPendingSubmit(false);
    setConfirmDialogOpen(false);

    const req = {
      requester_name: 'Vendedor (frontend)',
      requester_id: '',
      customer_code: selectedCustomer.codigo,
      customer_name: selectedCustomer.nome_fantasia,
      product_id: selectedProduct.codigo_produto,
      product_name: selectedProduct.nome_produto,
      requested_price: price,
      quantity: quantity,
      product_maximo: selectedProduct.maximo || '',
      product_minimo: selectedProduct.minimo || '',
      product_promocional: selectedProduct.promocional || '',
      currency: 'BRL',
      status: 'Pending',
      notes,
      codigo_supervisor: selectedCustomer.supervisor_code,
      nome_supervisor: selectedCustomer.supervisor_name
    };
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(req)
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error('Erro ao enviar solicitação');
      const created = await res.json();
      setRequests(prev => [created, ...prev]);
      setSelectedProduct(null);
      setPrice('');
      setQuantity('');
      setNotes('');
      // Mantém o cliente selecionado para facilitar múltiplas solicitações
      setSuccess('Solicitação registrada com sucesso!');
    } catch (err) {
      setError('Erro ao enviar solicitação para o servidor.');
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmBelowMinPrice = () => {
    setPendingSubmit(true);
    setConfirmDialogOpen(false);
    processSubmit();
  };

  const handleCancelBelowMinPrice = () => {
    setConfirmDialogOpen(false);
    setPendingSubmit(false);
  };

  // Exporta solicitações para CSV
  function exportCsv() {
    if (requests.length === 0) {
      setError('Nenhuma solicitação para exportar.');
      return;
    }
    setError(null);
    const rows = requests.map((r: PriceRequest) => [
      r._id || '',
      r.requester_name,
      r.requester_id || '',
      r.customer_code,
      (r.customer_name || '').replace(/"/g, '""'),
      r.product_id,
      r.requested_price,
      r.currency,
      r.status,
      (r.notes || '').replace(/"/g, '""'),
      r.created_at,
      r.approved_by || '',
      r.approved_at || ''
    ]);
    const csv = rows.map((r: (string | number)[]) => r.map((c: string | number) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_requests.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Arquivo CSV exportado!');
  }

  // Renderização do componente
  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: { xs: 1, sm: 2 }, width: '100%' }}>
      <Slide in direction="down">
        <Paper elevation={6} sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 4,
          bgcolor: '#fff',
          mb: 3,
          boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)'
        }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <PersonIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">Solicitação de Preço</Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <form onSubmit={submit} autoComplete="off">
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <Autocomplete
                options={clientes}
                getOptionLabel={option => `${option.nome_fantasia} — ${option.codigo}`}
                value={selectedCustomer}
                onChange={(_, value) => {
                  setSelectedCustomer(value);
                  setSelectedProduct(null);
                  setPrice('');
                }}
                renderInput={params => (
                  <TextField {...params} label="Cliente" required placeholder="Buscar cliente..." size="medium" />
                )}
                isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                fullWidth
              />
              <Autocomplete
                options={produtos}
                getOptionLabel={option => `${option.nome_produto} — ${option.id}`}
                value={selectedProduct}
                onChange={(_, value) => setSelectedProduct(value)}
                renderInput={params => (
                  <TextField {...params} label="Produto" required placeholder="Buscar produto..." size="medium" />
                )}
                isOptionEqualToValue={(option, value ) => option.id === value.id}
                disabled={!selectedCustomer}
                fullWidth
              />
              {selectedProduct && selectedProduct.promocional && selectedProduct.maximo && (
                <Alert severity="info" sx={{ fontSize: 13 }}>
                  Faixa de preço permitida: R$ {selectedProduct.promocional} até R$ {selectedProduct.maximo}
                </Alert>
              )}
              <TextField
                label="Preço solicitado"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                placeholder="0.00"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                disabled={!selectedCustomer}
                fullWidth
              />
              <TextField
                label="Quantidade"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                placeholder="1"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                disabled={!selectedCustomer}
                fullWidth
              />
              <TextField
                label="Justificativa"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<SendIcon />}
                disabled={
                  !selectedCustomer ||
                  !selectedProduct ||
                  !price || isNaN(Number(price)) || Number(price) <= 0 ||
                  !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0 || loading
                }
                sx={{ fontWeight: 700, borderRadius: 2, py: 1.2, fontSize: 18 }}
                fullWidth
              >
                {loading ? 'Enviando...' : 'Enviar solicitação'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Slide>
      <Slide in direction="up">
        <Paper elevation={3} sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 4,
          bgcolor: '#f7fafc',
          mb: 2,
          boxShadow: '0 4px 16px 0 rgba(60,72,100,0.07)'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ShoppingCartIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">Minhas Solicitações</Typography>
            </Stack>
            <IconButton onClick={exportCsv} color="success" size="large">
              <DownloadIcon />
            </IconButton>
          </Stack>
          {loading ? (
            <Typography color="text.secondary">Carregando solicitações...</Typography>
          ) : (
            <Stack spacing={1}>
              {requests.length === 0 && <Typography color="text.secondary">Nenhuma solicitação registrada.</Typography>}
              {requests.map(r => (
                <Box key={r._id || r.id} sx={{
                  p: 1.5,
                  border: 
                    r.status === 'Alterado' ? '2px solid #2196f3' : 
                    r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? '2px solid #4caf50' : 
                    r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? '2px solid #f44336' :
                    r.status === 'Aguardando Gerência' ? '2px solid #ff9800' :
                    '1px solid #e3e6f0',
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: 
                    r.status === 'Alterado' ? '#bbdefb' : 
                    r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? '#c8e6c9' : 
                    r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? '#ffcdd2' :
                    r.status === 'Aguardando Gerência' ? '#fff3e0' :
                    '#fff',
                  boxShadow: '0 2px 8px 0 rgba(60,72,100,0.04)'
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                      {r.customer_name}
                    </Typography>
                    {r.status === 'Alterado' && (
                      <Typography variant="caption" sx={{ bgcolor: '#2196f3', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        ✓ ALTERADO
                      </Typography>
                    )}
                    {(r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência') && (
                      <Typography variant="caption" sx={{ bgcolor: '#4caf50', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        ✓ APROVADO
                      </Typography>
                    )}
                    {(r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência') && (
                      <Typography variant="caption" sx={{ bgcolor: '#f44336', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        ✗ REPROVADO
                      </Typography>
                    )}
                    {r.status === 'Aguardando Gerência' && (
                      <Typography variant="caption" sx={{ bgcolor: '#ff9800', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        ⏳ AGUARDANDO GERÊNCIA
                      </Typography>
                    )}
                    {r.status === 'Pending' && (
                      <Typography variant="caption" sx={{ bgcolor: '#9e9e9e', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        ⏱ PENDENTE
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Produto: <b>{r.product_name || r.product_id}</b> — Preço: <b>R$ {Number(r.requested_price).toFixed(2)}</b> — Qtd: <b>{r.quantity || '—'}</b>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.created_at).toLocaleString()} {r.notes && `— ${r.notes}`}
                  </Typography>
                  {r.status === 'Reprovado' && r.approved_by && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#d32f2f', fontWeight: 600 }}>
                      Motivo: {r.notes}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Slide>

      {/* Dialog de Confirmação para Preço Abaixo do Mínimo */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelBelowMinPrice}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirmar Preço Abaixo do Mínimo
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            O preço solicitado <strong>R$ {price}</strong> está abaixo do preço mínimo permitido 
            <strong> R$ {selectedProduct?.minimo}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Esta solicitação será encaminhada para aprovação da gerência.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 600, color: 'warning.main' }}>
            Deseja confirmar e enviar esta solicitação?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBelowMinPrice} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmBelowMinPrice} 
            variant="contained" 
            color="warning"
            autoFocus
          >
            Confirmar e Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
