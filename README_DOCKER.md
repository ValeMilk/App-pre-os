# App Preços - Sistema de Solicitação de Preços Vale Milk

Sistema completo para gerenciamento de solicitações de preços com autenticação, cálculo de descontos e aprovações hierárquicas.

## 🏗️ Arquitetura

### Stack Tecnológica

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Material-UI
- **Database**: PostgreSQL 16
- **Deploy**: Docker Compose (100% containerizado)
- **ETL**: Node.js com cron (sincronização SQL Server → PostgreSQL)

### Containers Docker

- `app-precos-postgres`: Banco de dados PostgreSQL isolado
- `app-precos-backend`: API REST em Node.js
- `app-precos-frontend`: SPA React servido via Nginx
- `app-precos-etl`: Sincronização automática a cada 10 minutos

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd app-precos

# 2. Suba os containers
docker compose up -d

# 3. Acesse
# Frontend: http://localhost
# Backend: http://localhost:3001
```

### Deploy no VPS

```bash
# SSH no servidor
ssh root@72.61.62.17

# Execute o script de deploy
cd /root/app-docker
./deploy-docker.sh
```

Para documentação completa: [DOCKER_DEPLOY_GUIDE.md](DOCKER_DEPLOY_GUIDE.md)

## 📚 Documentação

- [DOCKER_DEPLOY_GUIDE.md](DOCKER_DEPLOY_GUIDE.md) - Guia completo de deploy e operação
- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Comandos rápidos
- [DOCUMENTACAO_COMPLETA.md](DOCUMENTACAO_COMPLETA.md) - Documentação técnica do sistema
- [PROJETO_OVERVIEW.md](PROJETO_OVERVIEW.md) - Visão geral do projeto

## 🎯 Funcionalidades

### Sistema de Descontos (Two-Tier)

1. **Desconto por Produto** (Prioridade 1): Tabela E08 - descontos específicos por produto
2. **Desconto por Grupo** (Prioridade 2): Tabelas A23/A24 - descontos por grupo/contrato

Lógica: Se desconto do produto = 0%, busca desconto do grupo

### Perfis de Usuário

- **Vendedor**: Cria solicitações de preço
- **Supervisor**: Aprova solicitações do vendedor
- **Gerente**: Aprova solicitações do supervisor
- **Admin**: Gerencia usuários e configurações

### ETL Automático

Sincronização a cada 10 minutos:
- Produtos (E02)
- Clientes (A00 + A16)
- Descontos por Produto (E08)
- Descontos por Grupo (A23/A24)

## 🗄️ Banco de Dados

### Origem (SQL Server)
- Servidor: 10.1.0.3\SQLSTANDARD (via VPN)
- Usuário: analistarpt
- Database: dbactions

### Destino (PostgreSQL)
- Host: localhost (container)
- Port: 5433 (externa) / 5432 (interna)
- Database: dbactions
- User: apiuser

### Tabelas Principais

- `produtos`: 51 produtos ativos
- `clientes`: 1218 clientes com rede/subrede
- `descontos`: 5780 registros (5689 produto + 91 grupo)
- `users`: Usuários do sistema
- `price_requests`: Solicitações de preço

## 🔧 Configuração

### Variáveis de Ambiente

Todas definidas no `docker-compose.yml`:

**Backend:**
- `PORT`: 3001
- `DB_HOST`: postgres
- `JWT_SECRET`: chave JWT
- `CORS_ORIGIN`: domínio permitido

**Frontend:**
- `VITE_API_URL`: URL da API (build arg)

**ETL:**
- `CRON_SCHEDULE`: */10 * * * * (a cada 10 minutos)
- `SQL_HOST`: SQL Server origem
- `PG_HOST`: PostgreSQL destino

## 📊 Monitoramento

```bash
# Ver logs em tempo real
docker compose logs -f

# Status dos containers
docker compose ps

# Uso de recursos
docker stats

# Logs do ETL
docker compose logs etl

# Acessar PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions
```

## 🐛 Troubleshooting

### Container não inicia

```bash
docker compose logs <servico>
docker compose restart <servico>
```

### ETL não sincroniza

```bash
# Ver logs
docker compose logs etl

# Executar manualmente
docker exec -it app-precos-etl node /app/etl.js
```

### Reset completo

```bash
docker compose down -v
docker compose up -d --build
```

## 🔐 Segurança

- Senhas definidas via variáveis de ambiente
- JWT para autenticação
- PostgreSQL isolado em rede Docker
- Nginx com proxy reverso para API

## 📦 Estrutura do Projeto

```
app-precos/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── routes/           # Rotas da API
│   │   └── middleware/       # Autenticação
│   ├── Dockerfile            # Backend container
│   ├── Dockerfile.etl        # ETL container
│   ├── etl-corrigido.js      # Script de sincronização
│   └── init-db.sql           # Schema inicial
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Helpers
│   └── Dockerfile            # Frontend container
├── docker-compose.yml        # Orquestração completa
├── deploy-docker.sh          # Script de deploy
├── migrate-to-docker.sh      # Migração PM2 → Docker
└── DOCKER_DEPLOY_GUIDE.md    # Documentação deploy
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add: nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 License

Proprietary - Vale Milk © 2026

## 👥 Equipe

- Desenvolvido para Vale Milk
- Deploy: VPS Hostinger (72.61.62.17)
- Database: PostgreSQL 16
- CI/CD: Git + Docker Compose

## 🆘 Suporte

Para problemas ou dúvidas:
1. Veja [DOCKER_DEPLOY_GUIDE.md](DOCKER_DEPLOY_GUIDE.md)
2. Verifique os logs: `docker compose logs -f`
3. Entre em contato com a equipe de desenvolvimento
