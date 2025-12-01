import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Stack, Alert, Autocomplete } from '@mui/material';
import { API_ENDPOINTS } from '../config/api';

interface Props {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

interface UserOption {
  name: string;
  email: string;
}

export default function AuthForm({ onAuthSuccess }: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar lista de usuários
    fetch(API_ENDPOINTS.auth.users)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setError('Erro ao carregar usuários'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedUser) {
      setError('Selecione um usuário');
      return;
    }
    setLoading(true);
    try {
      const url = API_ENDPOINTS.auth.login;
      const body = { email: selectedUser.email, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na autenticação');
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <img 
          src="/logo valemilk.jpg" 
          alt="Valemilk Logo" 
          style={{ maxWidth: '200px', height: 'auto' }}
        />
      </Box>
      <Typography variant="h5" mb={2} align="center">
        Login do Colaborador
      </Typography>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Stack spacing={2}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.name}
            value={selectedUser}
            onChange={(_, value) => setSelectedUser(value)}
            renderInput={(params) => (
              <TextField {...params} label="Selecione o Usuário" required placeholder="Buscar usuário..." />
            )}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            noOptionsText="Nenhum usuário encontrado"
          />
          <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" color="primary" disabled={loading || !selectedUser}>
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </form>
    </Paper>
  );
}
