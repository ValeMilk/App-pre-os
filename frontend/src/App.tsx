import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box, Typography, Button, AppBar, Toolbar, Fab, Tooltip } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AuthForm from './components/AuthForm';
import RequestForm from './components/RequestForm';
import AdminPanel from './components/AdminPanel';
import AdminRequestsPanel from './components/AdminRequestsPanel';
import AdminLixeira from './components/AdminLixeira';
import SupervisorPanel from './components/SupervisorPanel';
import GerentePanel from './components/GerentePanel';
import VendorDashboard from './components/VendorDashboard';
import CalculadoraStandalone from './components/CalculadoraStandalone';
import { parseClientesCsv } from './utils/parseCsv';
import { parseProdutosCsv } from './utils/parseProdutosCsv';
import { parseDescontosCsv } from './utils/parseDescontosCsv';
import { fetchClientesFromAPI, fetchProdutosFromAPI } from './utils/apiHelpers';
import theme from './mui-theme';
import { Cliente } from './types/Cliente';
import { Produto } from './types/Produto';
import { Desconto } from './types/Desconto';

function AdminRoute() {
  const [cadastroOpen, setCadastroOpen] = useState(false);

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      mx: 0,
      px: { xs: 2, md: 3 },
      py: 3
    }}>
      <AdminRequestsPanel />
      <Box mt={3}>
        <AdminLixeira />
      </Box>
      
      <Tooltip title="Cadastrar Usuários" placement="left">
        <Fab
          color="primary"
          onClick={() => setCadastroOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <PersonAddIcon />
        </Fab>
      </Tooltip>

      <AdminPanel open={cadastroOpen} onClose={() => setCadastroOpen(false)} />
    </Box>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [descontos, setDescontos] = useState<Desconto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ id: string; name: string; email: string; vendedor_code?: string; tipo?: string } | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    // Buscar clientes da API
    fetchClientesFromAPI()
      .then(parsed => {
        setClientes(parsed)
        localStorage.setItem('clientes', JSON.stringify(parsed))
        console.log('Clientes carregados da API:', parsed)
      })
      .catch(() => {
        setError('Erro ao carregar clientes da API.')
      })
    
    // Buscar produtos da API
    fetchProdutosFromAPI()
      .then(parsed => {
        setProdutos(parsed)
        localStorage.setItem('produtos', JSON.stringify(parsed))
        console.log('Produtos carregados da API:', parsed)
      })
      .catch(() => {
        setError('Erro ao carregar produtos da API.')
      })
    
    // Descontos agora são carregados dinamicamente por cliente no RequestForm
  }, [user])

  useEffect(() => {
    // Redireciona apenas após login bem-sucedido (quando está na página de login)
    const currentPath = window.location.pathname;
    
    if (token && user && currentPath === '/login') {
      // Redireciona apenas se estiver na página de login após autenticação
      if (user.email === 'admin@admin.com') {
        navigate('/admin', { replace: true });
      } else if (user.tipo === 'supervisor') {
        navigate('/supervisor', { replace: true });
      } else if (user.tipo === 'gerente') {
        navigate('/gerente', { replace: true });
      } else {
        navigate('/vendedor', { replace: true });
      }
    }
    // Não força redirecionamento em outras situações para permitir múltiplas abas
  }, [token, user, navigate]);

  function handleAuthSuccess(token: string, user: { id: string; name: string; email: string; vendedor_code?: string; tipo?: string }) {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: user && user.email === 'admin@admin.com' ? 'background.default' : 'inherit' }}>
      <AppBar position="static" color="default" elevation={2} sx={{ mb: { xs: 1, sm: 2, md: 4 } }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0.5, sm: 1.5, md: 2 }, minHeight: { xs: 48, sm: 56, md: 64 } }}>
          <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ fontSize: { xs: '1.25rem', sm: '1rem', md: '1.25rem' } }}>
           📲 App Valemilk
          </Typography>
          {token && user && (
            <Button variant="outlined" color="secondary" onClick={handleLogout} size="small" sx={{ px: { xs: 1, sm: 1.5, md: 3 }, py: { xs: 0.5, sm: 0.75 }, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Sair</Button>
          )}
        </Toolbar>
      </AppBar>
      <Container 
        maxWidth={user && user.email === 'admin@admin.com' ? false : (user && (user.tipo === 'supervisor' || user.tipo === 'gerente') ? false : 'md')} 
        disableGutters={Boolean((user && user.email === 'admin@admin.com') || (user && (user.tipo === 'supervisor' || user.tipo === 'gerente')))} 
        sx={user && user.email === 'admin@admin.com' ? { 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'flex-start', 
          minHeight: '85vh', 
          pl: { xs: 0.25, sm: 0.75, md: 2 }, 
          pr: { xs: 0.25, sm: 0.5, md: 0 } 
        } : { 
          px: { xs: 0.25, sm: 0.75, md: 2 } 
        }}
      >
        {error && <Box sx={{ bgcolor: '#fff3cd', p: { xs: 0.75, sm: 1.25, md: 2 }, borderRadius: 1, mb: { xs: 1, sm: 1.5, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>{error}</Box>}
        
        <Routes>
          <Route path="/login" element={
            !token || !user ? (
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            ) : (
              <Navigate to={
                user.email === 'admin@admin.com' ? '/admin' : 
                user.tipo === 'supervisor' ? '/supervisor' : 
                user.tipo === 'gerente' ? '/gerente' :
                '/vendedor'
              } replace />
            )
          } />

          <Route path="/admin" element={
            token && user && user.email === 'admin@admin.com' ? (
              <AdminRoute />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/supervisor" element={
            token && user ? (
              <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '100%', md: 1400 }, mx: 'auto', px: { xs: 1, sm: 2 } }}>
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Bem-vindo, {user.name} </Typography>
                </Box>
                <SupervisorPanel />
              </Box>
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/gerente" element={
            token && user ? (
              <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '100%', md: 1400 }, mx: 'auto', px: { xs: 1, sm: 2 } }}>
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Bem-vindo, {user.name} </Typography>
                </Box>
                <GerentePanel />
              </Box>
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/vendedor" element={
            token && user ? (
              <VendorDashboard userName={user.name} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/vendedor/solicitacao-precos" element={
            token && user ? (
              <>
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Bem-vindo, {user.name}!</Typography>
                </Box>
                <RequestForm
                  clientes={(() => {
                    // DEBUG: Listar todos os vendedor_codes ÚNICOS que existem
                    const vendedorCodesUnicos = new Set(clientes.map(c => c.vendedor_code).filter(Boolean));
                    console.log('📊 TODOS os vendedor_codes únicos na carteira:', Array.from(vendedorCodesUnicos).sort());
                    
                    // DEBUG: Verificar o vendedor_code do usuário logado
                    console.log('👤 Usuário logado:', {
                      name: user.name,
                      email: user.email,
                      vendedor_code: `"${user.vendedor_code}"`,
                      tipo: user.tipo
                    });
                    
                    // DEBUG: Contar quantos clientes para CADA vendedor_code
                    const clientesPorVendedor = {} as Record<string, number>;
                    clientes.forEach(c => {
                      if (c.vendedor_code) {
                        clientesPorVendedor[c.vendedor_code] = (clientesPorVendedor[c.vendedor_code] || 0) + 1;
                      }
                    });
                    console.log('📈 Distribuição de clientes por vendedor_code:', clientesPorVendedor);
                    
                    const filtered = clientes.filter(c => {
                      if (!user.vendedor_code) return true;
                      if (!c.vendedor_code) return false;
                      return c.vendedor_code === user.vendedor_code;
                    });
                    
                    console.log('🔍 RESUMO:', {
                      totalClientes: clientes.length,
                      userVendedorCode: `"${user.vendedor_code}"`,
                      clientesFiltrados: filtered.length,
                      existeNoCarteira: vendedorCodesUnicos.has(user.vendedor_code || '')
                    });
                    
                    if (filtered.length === 0) {
                      console.warn('⚠️ ALERTA: Nenhum cliente encontrado para vendedor_code "' + user.vendedor_code + '". Verifique se o usuário foi criado com o código correto.');
                    }
                    
                    return filtered;
                  })()}
                  produtos={produtos}
                  descontos={descontos}
                  onClientesLoaded={setClientes}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/vendedor/calculadora" element={
            token && user ? (
              <CalculadoraStandalone />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;


