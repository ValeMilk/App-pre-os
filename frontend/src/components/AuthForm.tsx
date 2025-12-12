import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Stack, Alert, Autocomplete } from '@mui/material';
import { API_ENDPOINTS } from '../config/api';
import { LoginFormSchema, UserListSchema, AuthResponseSchema } from '../schemas';

interface Props {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string; vendedor_code?: string; tipo?: string }) => void;
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
    // Buscar lista de usuários com validação Zod
    fetch(API_ENDPOINTS.auth.users)
      .then(async res => {
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        const data = await res.json();
        console.log('Dados recebidos da API /auth/users:', data);
        
        const validatedUsers = UserListSchema.parse(data);
        setUsers(validatedUsers);
      })
      .catch((err) => {
        console.error('Erro ao carregar/validar usuários:', err);
        setError('Erro ao carregar usuários');
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!selectedUser) {
      setError('Selecione um usuário');
      return;
    }

    // Validar formulário com Zod
    const validationResult = LoginFormSchema.safeParse({ 
      email: selectedUser.email, 
      password 
    });

    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const url = API_ENDPOINTS.auth.login;
      const body = validationResult.data;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro na autenticação');
      
      // Validar resposta da API com Zod
      const validatedResponse = AuthResponseSchema.parse(data);
      onAuthSuccess(validatedResponse.token, validatedResponse.user);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        setError('Resposta inválida do servidor');
        console.error('Erro de validação:', err);
      } else {
        setError(err.message || 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3, md: 4 }, 
      maxWidth: { xs: '95%', sm: 400 }, 
      mx: 'auto', 
      mt: { xs: 3, sm: 4, md: 6 },
      borderRadius: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 2, sm: 3 } }}>
        <img 
          src="/logo valemilk.jpg" 
          alt="Valemilk Logo" 
          style={{ maxWidth: '200px', width: '100%', height: 'auto' }}
        />
      </Box>
      <Typography variant="h5" mb={2} align="center" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Login do Colaboradorrr
      </Typography>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.name}
            value={selectedUser}
            onChange={(_, value) => setSelectedUser(value)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Selecione o Usuário" 
                required 
                placeholder="Buscar usuário..." 
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            noOptionsText="Nenhum usuário encontrado"
          />
          <TextField 
            label="Senha" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading || !selectedUser}
            sx={{ 
              py: { xs: 1.2, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600
            }}
          >
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </form>
    </Paper>
  );
}
