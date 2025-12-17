import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Stack, Avatar, Divider, Tooltip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CloseIcon from '@mui/icons-material/Close';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.auth.adminRegister;
const SUPERVISOR_URL = API_ENDPOINTS.auth.supervisorRegister;
const GERENTE_URL = API_ENDPOINTS.auth.gerenteRegister;

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [tab, setTab] = useState(0);
  // Vendedor
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendedorCode, setVendedorCode] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Supervisor
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPassword, setSupPassword] = useState('');
  const [supCode, setSupCode] = useState('');
  const [supSuccess, setSupSuccess] = useState<string | null>(null);
  const [supError, setSupError] = useState<string | null>(null);
  const [supLoading, setSupLoading] = useState(false);
  // Gerente
  const [gerName, setGerName] = useState('');
  const [gerEmail, setGerEmail] = useState('');
  const [gerPassword, setGerPassword] = useState('');
  const [gerSuccess, setGerSuccess] = useState<string | null>(null);
  const [gerError, setGerError] = useState<string | null>(null);
  const [gerLoading, setGerLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name, email, password, vendedor_code: vendedorCode })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao cadastrar usuário');
      setSuccess('Usuário cadastrado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      setVendedorCode('');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function handleSupervisorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSupError(null);
    setSupSuccess(null);
    setSupLoading(true);
    try {
      const res = await fetch(SUPERVISOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: supName, email: supEmail, password: supPassword, codigo_supervisor: supCode })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao cadastrar supervisor');
      setSupSuccess('Supervisor cadastrado com sucesso!');
      setSupName('');
      setSupEmail('');
      setSupPassword('');
      setSupCode('');
    } catch (err: any) {
      setSupError(err.message || 'Erro ao cadastrar supervisor');
    } finally {
      setSupLoading(false);
    }
  }

  async function handleGerenteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGerError(null);
    setGerSuccess(null);
    setGerLoading(true);
    try {
      const res = await fetch(GERENTE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: gerName, email: gerEmail, password: gerPassword })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao cadastrar gerente');
      setGerSuccess('Gerente cadastrado com sucesso!');
      setGerName('');
      setGerEmail('');
      setGerPassword('');
    } catch (err: any) {
      setGerError(err.message || 'Erro ao cadastrar gerente');
    } finally {
      setGerLoading(false);
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        Cadastro de Usuários
        <IconButton
          onClick={onClose}
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }} allowScrollButtonsMobile>
          <Tab label="Vendedor" />
          <Tab label="Supervisor" />
          <Tab label="Gerente" />
        </Tabs>
        {tab === 0 && (
          <form onSubmit={handleSubmit} autoComplete="off">
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <TextField label="Nome do Vendedor" value={name} onChange={e => setName(e.target.value)} required fullWidth autoFocus />
              <TextField label="E-mail" value={email} onChange={e => setEmail(e.target.value)} required type="email" fullWidth />
              <TextField label="Senha" value={password} onChange={e => setPassword(e.target.value)} required type="password" fullWidth />
              <Tooltip title="Opcional: código interno para identificar o vendedor.">
                <TextField label="Código do Vendedor " value={vendedorCode} onChange={e => setVendedorCode(e.target.value)} fullWidth />
              </Tooltip>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PersonAddAlt1Icon />}
                disabled={loading}
                sx={{ mt: 1, fontWeight: 600 }}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Vendedor'}
              </Button>
            </Stack>
          </form>
        )}
        {tab === 1 && (
          <form onSubmit={handleSupervisorSubmit} autoComplete="off">
            <Stack spacing={2}>
              {supError && <Alert severity="error">{supError}</Alert>}
              {supSuccess && <Alert severity="success">{supSuccess}</Alert>}
              <TextField label="Nome do Supervisor" value={supName} onChange={e => setSupName(e.target.value)} required fullWidth autoFocus />
              <TextField label="E-mail" value={supEmail} onChange={e => setSupEmail(e.target.value)} required type="email" fullWidth />
              <TextField label="Senha" value={supPassword} onChange={e => setSupPassword(e.target.value)} required type="password" fullWidth />
              <TextField label="Código do Supervisor" value={supCode} onChange={e => setSupCode(e.target.value)} required fullWidth />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AssignmentIndIcon />}
                disabled={supLoading}
                sx={{ mt: 1, fontWeight: 600 }}
              >
                {supLoading ? 'Cadastrando...' : 'Cadastrar Supervisor'}
              </Button>
            </Stack>
          </form>
        )}
        {tab === 2 && (
          <form onSubmit={handleGerenteSubmit} autoComplete="off">
            <Stack spacing={2}>
              {gerError && <Alert severity="error">{gerError}</Alert>}
              {gerSuccess && <Alert severity="success">{gerSuccess}</Alert>}
              <TextField label="Nome do Gerente" value={gerName} onChange={e => setGerName(e.target.value)} required fullWidth autoFocus />
              <TextField label="E-mail" value={gerEmail} onChange={e => setGerEmail(e.target.value)} required type="email" fullWidth />
              <TextField label="Senha" value={gerPassword} onChange={e => setGerPassword(e.target.value)} required type="password" fullWidth />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PersonAddAlt1Icon />}
                disabled={gerLoading}
                sx={{ mt: 1, fontWeight: 600 }}
              >
                {gerLoading ? 'Cadastrando...' : 'Cadastrar Gerente'}
              </Button>
            </Stack>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
