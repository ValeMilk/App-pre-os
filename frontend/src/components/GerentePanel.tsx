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
  subrede_batch_id?: string;
  subrede_name?: string;
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
      
      // Separar pendentes e processadas
      const pending = data.filter((r: Request) => r.status === 'Aguardando Gerência');
      const processed = data.filter((r: Request) => 
        r.status === 'Aprovado pela Gerência' || r.status === 'Reprovado pela Gerência' || r.status === 'Alterado'
      );
      
      // Agrupar pendentes por subrede
      const groupedPending: { [key: string]: Request[] } = {};
      const individualPending: Request[] = [];
      
      pending.forEach((req: Request) => {
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
          requester_name: firstReq.requester_name,
          product_id: firstReq.product_id,
          product_name: firstReq.product_name || '',
          requested_price: firstReq.requested_price,
          quantity: firstReq.quantity || '',
          product_minimo: firstReq.product_minimo || '',
          product_promocional: firstReq.product_promocional || '',
          currency: firstReq.currency,
          status: firstReq.status,
          notes: firstReq.notes || '',
          created_at: firstReq.created_at,
          clientCount: reqs.length
        };
      });
      
      // Agrupar processadas por subrede
      const groupedProc: { [key: string]: Request[] } = {};
      const individualProc: Request[] = [];
      
      processed.forEach((req: Request) => {
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
          requester_name: firstReq.requester_name,
          product_id: firstReq.product_id,
          product_name: firstReq.product_name || '',
          requested_price: firstReq.requested_price,
          quantity: firstReq.quantity || '',
          product_minimo: firstReq.product_minimo || '',
          product_promocional: firstReq.product_promocional || '',
          currency: firstReq.currency,
          status: firstReq.status,
          notes: firstReq.notes || '',
          created_at: firstReq.created_at,
          clientCount: reqs.length
        };
      });
      
      setRequests(pending);
      setAllRequests(processed);
      setGroupedRequests(groupedPendingArray);
      setIndividualRequests(individualPending);
      setGroupedProcessed(groupedProcArray);
      setIndividualProcessed(individualProc);
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
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
        Painel da Gerência — Aprovar Preços Especiais
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Solicitações de preços abaixo do mínimo que requerem aprovação da gerência.
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

      {requests.length === 0 ? (
        <Alert severity="info">
          Nenhuma solicitação aguardando aprovação da gerência no momento.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Vendedor</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Produto</strong></TableCell>
                <TableCell align="right"><strong>Preço Solicitado</strong></TableCell>
                <TableCell align="right"><strong>Preço Mínimo</strong></TableCell>
                <TableCell align="right"><strong>Preço Promocional</strong></TableCell>
                <TableCell align="center"><strong>Qtd.</strong></TableCell>
                <TableCell><strong>Justificativa</strong></TableCell>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell align="center"><strong>Ações</strong></TableCell>
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
                  <TableCell>
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="center">
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
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
            Histórico — Solicitações Processadas pela Gerência
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Vendedor</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Produto</strong></TableCell>
                  <TableCell align="right"><strong>Preço Solicitado</strong></TableCell>
                  <TableCell align="right"><strong>Preço Mínimo</strong></TableCell>
                  <TableCell align="center"><strong>Qtd.</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Observações</strong></TableCell>
                  <TableCell><strong>Data Aprovação/Reprovação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Subredes processadas */}
                {groupedProcessed.map((group) => {
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
                        <Typography variant="caption" color="primary.main">
                          {group.clientCount} clientes
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {group.product_name || group.product_id}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {group.product_id}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {group.currency} {group.requested_price}
                        </strong>
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
                })}
                
                {/* Solicitações individuais processadas */}
                {individualProcessed.map((req) => {
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
                        <strong>
                          {req.currency} {req.requested_price}
                        </strong>
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
                      <TableCell>
                        {req.approved_at ? new Date(req.approved_at).toLocaleDateString('pt-BR') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog de Reprovação */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Reprovar Solicitação pela Gerência</DialogTitle>
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
            required
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
