// Configuração de API URL baseada no ambiente
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    adminRegister: `${API_BASE_URL}/auth/admin-register`,
    supervisorRegister: `${API_BASE_URL}/auth/supervisor-register`,
    gerenteRegister: `${API_BASE_URL}/auth/gerente-register`,
    users: `${API_BASE_URL}/auth/users`,
  },
  requests: {
    all: `${API_BASE_URL}/requests/all`,
    supervisor: `${API_BASE_URL}/requests/supervisor`,
    gerente: `${API_BASE_URL}/requests/gerente`,
    base: `${API_BASE_URL}/requests`,
  },
  data: {
    clientes: `${API_BASE_URL}/clientes`,
    produtos: `${API_BASE_URL}/produtos`,
    descontos: `${API_BASE_URL}/descontos`,
  }
};
