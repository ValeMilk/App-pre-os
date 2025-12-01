import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Stack, Alert, Link } from '@mui/material';
import { API_ENDPOINTS } from '../config/api';

interface Props {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

export default function AuthForm({ onAuthSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = API_ENDPOINTS.auth.login;
      const body = { email, password };
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
      <Typography variant="h5" mb={2} align="center">
        Login do Vendedor
      </Typography>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Stack spacing={2}>
          <TextField label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </form>
    </Paper>
  );
}
