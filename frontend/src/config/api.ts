// Configuração de API URL baseada no ambiente
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    adminRegister: `${API_BASE_URL}/api/auth/admin-register`,
    supervisorRegister: `${API_BASE_URL}/api/auth/supervisor-register`,
    gerenteRegister: `${API_BASE_URL}/api/auth/gerente-register`,
    users: `${API_BASE_URL}/api/auth/users`,
  },
  requests: {
    all: `${API_BASE_URL}/api/requests/all`,
    supervisor: `${API_BASE_URL}/api/requests/supervisor`,
    gerente: `${API_BASE_URL}/api/requests/gerente`,
    base: `${API_BASE_URL}/api/requests`,
  }
};
