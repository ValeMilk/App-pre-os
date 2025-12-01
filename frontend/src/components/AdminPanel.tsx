import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Stack, Avatar, Divider, Tooltip, Tabs, Tab } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.auth.adminRegister;
const SUPERVISOR_URL = API_ENDPOINTS.auth.supervisorRegister;

export default function AdminPanel() {
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

  return (
    <Paper elevation={6} sx={{
      p: 4,
      borderRadius: 3,
      bgcolor: '#fff',
      width: '100%',
      maxWidth: 480,
      boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)',
      height: 'fit-content'
    }}>
      <Typography variant="h5" fontWeight={700} color="primary.main" mb={3} textAlign="center">
        Cadastro de Usuários
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
        <Tab label="Cadastrar Vendedor" sx={{ minWidth: 200, fontSize: '0.80rem' }} />
        <Tab label="Cadastrar Supervisor" sx={{ minWidth: 200, fontSize: '0.80rem' }} />
      </Tabs>
      <Divider sx={{ mb: 5 }} />
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
      </Paper>
  );
}
