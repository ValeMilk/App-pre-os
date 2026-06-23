# PROMPT DE RECONSTRUÇÃO — SISTEMA DE SOLICITAÇÃO DE PREÇOS ESPECIAIS (VALEMILK)

## OBJETIVO
Construa do zero um sistema web completo de solicitação e aprovação de preços especiais para uma distribuidora de laticínios. A aplicação deve ser hospedada em uma VPS via Docker Compose. O banco de dados principal é **MongoDB Atlas (cloud)**, sem banco de dados local no Docker.

---

## STACK TÉCNICA OBRIGATÓRIA

### Backend
- Node.js + Express + TypeScript
- Mongoose (ODM para MongoDB Atlas)
- bcryptjs (hash de senha)
- jsonwebtoken (JWT, expiração: 7 dias)
- cors, dotenv
- Porta: 3001

### Frontend
- React 18 + TypeScript
- Vite (bundler)
- Material-UI v7 (@mui/material + @mui/icons-material)
- react-router-dom v7 (SPA, HashRouter ou BrowserRouter)
- zod v4 (validação de schemas)
- papaparse (leitura de CSV)
- Porta: 80 (via Nginx)

### Infraestrutura
- Docker + Docker Compose (2 serviços: backend + frontend/nginx)
- MongoDB Atlas (connection string via variável de ambiente)
- Nginx: serve o build do React + faz proxy de /api/* → backend:3001
- CORS: configurar para aceitar a URL do frontend

---

## ESTRUTURA DE PASTAS

```
projeto/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── middleware/auth.ts
│   │   ├── models/User.ts
│   │   ├── models/PriceRequest.ts
│   │   ├── routes/auth.ts
│   │   ├── routes/requests.ts
│   │   └── routes/analytics.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── config/api.ts
│   │   ├── types/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── components/
│   ├── public/
│   │   ├── produtos.csv
│   │   ├── clientes.csv
│   │   └── descontos.csv
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

---

## VARIÁVEIS DE AMBIENTE

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=sua_chave_jwt_secreta_aqui
CORS_ORIGIN=http://<IP_DA_VPS>
```

### Frontend (argumento de build no Docker)
```
VITE_API_URL=http://<IP_DA_VPS>
```
O frontend usa `VITE_API_URL` como base para todas as chamadas de API.
Se usar Nginx com proxy, o frontend pode usar `/api` como base URL relativa.

---

## BANCO DE DADOS: MONGODB ATLAS

### Collection: users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (único)",
  "password": "string (bcrypt hash)",
  "tipo": "admin | vendedor | supervisor | gerente",
  "vendedor_code": "string (obrigatório para tipo=vendedor)",
  "codigo_supervisor": "string (obrigatório para tipo=supervisor)",
  "created_at": "Date"
}
```

### Collection: pricerequests
```json
{
  "_id": "ObjectId",
  "requester_name": "string",
  "requester_id": "string (_id do vendedor)",
  "customer_code": "string",
  "customer_name": "string",
  "product_id": "string",
  "product_name": "string",
  "requested_price": "string",
  "quantity": "string",
  "product_maximo": "string",
  "product_minimo": "string",
  "product_promocional": "string",
  "currency": "string (default: R$)",
  "status": "Pendente | Aguardando Gerência | Aprovado | Aprovado pela Gerência | Reprovado | Reprovado pela Gerência | Alterado | Cancelado",
  "notes": "string",
  "created_at": "Date",
  "approved_by": "string",
  "approved_at": "Date",
  "altered_by": "string",
  "altered_at": "Date",
  "codigo_supervisor": "string",
  "nome_supervisor": "string",
  "subrede_batch_id": "string (UUID para agrupar por subrede)",
  "subrede_name": "string",
  "discount_percent": "string",
  "discounted_price": "string",
  "supervisor_notes": "string",
  "gerente_approved_by": "string",
  "gerente_approved_at": "Date",
  "gerente_rejected_by": "string",
  "gerente_rejected_at": "Date",
  "cancellation_requested": "boolean",
  "cancellation_reason": "string",
  "cancellation_requested_at": "Date"
}
```

---

## DADOS ESTÁTICOS (CSV)

O frontend carrega 3 arquivos CSV da pasta `public/`:

### produtos.csv
**Colunas:** `e02_id, e02_livre, e02_desc, tabela_70, minimo, promo`
- `e02_id`: código do produto
- `e02_livre`: código reduzido (ex: "001")
- `e02_desc`: descrição
- `tabela_70`: preço tabela (máximo)
- `minimo`: preço mínimo permitido
- `promo`: preço promocional de referência

### clientes.csv
**Colunas:** `a00_id, a00_fantasia, rede_id, rede, canal_de_venda, segmento, a00_id_vend, vendedor, a00_id_vend_2, supervisor`
- `a00_id`: código do cliente
- `a00_id_vend`: código do vendedor responsável (usado para filtrar clientes por vendedor logado)
- `rede_id`: código da rede (redes 2,3,5,6,7,21,26 devem ser filtradas/excluídas, exceto NULL)

### descontos.csv
**Colunas:** `rede_id, rede_desc, valor_desconto, produto_id, produto_livre, produto_desc, e01_id, grupo, tipo_desconto, a23_id, a23_desc`
- `tipo_desconto`: 'produto' ou 'grupo'
- Desconto pode ser por produto específico OU por grupo de produtos

---

## ROTAS DO BACKEND

### /api/auth
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/register` | ❌ | Registro público (dev apenas) |
| POST | `/admin-register` | ✅ admin | Registra vendedor |
| POST | `/supervisor-register` | ✅ admin | Registra supervisor (requer codigo_supervisor) |
| POST | `/gerente-register` | ✅ admin | Registra gerente |
| GET | `/users` | ❌ | Lista usuários {name, email} para dropdown |
| POST | `/login` | ❌ | Login, retorna {token, user} |
| POST | `/fix-admin` | ❌ | Dev: corrige campo tipo do admin |

### /api/requests
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/all` | ✅ admin | Lista todas as solicitações (filtro data: 14 dias) |
| GET | `/supervisor` | ✅ supervisor | Solicitações no escopo do supervisor (14 dias) |
| GET | `/gerente` | ✅ gerente | Solicitações para gestão (30 dias) |
| POST | `/` | ✅ any | Cria nova solicitação de preço |
| PATCH | `/:id/approve` | ✅ supervisor | Aprova → status: "Aprovado" |
| PATCH | `/:id/reject` | ✅ supervisor | Rejeita → status: "Reprovado" (body: {notes}) |
| PATCH | `/:id/encaminhar-gerencia` | ✅ supervisor | Encaminha → status: "Aguardando Gerência" (body: {notes}) |
| PATCH | `/batch/:batchId/approve` | ✅ supervisor | Aprova todos da subrede |
| PATCH | `/batch/:batchId/reject` | ✅ supervisor | Rejeita todos da subrede |
| PATCH | `/batch/:batchId/encaminhar-gerencia` | ✅ supervisor | Encaminha todos da subrede |
| PATCH | `/:id/gerente-approve` | ✅ gerente | Aprova → status: "Aprovado pela Gerência" |
| PATCH | `/:id/gerente-reject` | ✅ gerente | Rejeita → status: "Reprovado pela Gerência" (body: {notes}) |
| PATCH | `/:id/mark-altered` | ✅ admin/gerente | Marca como → status: "Alterado" |
| PATCH | `/:id/cancel` | ✅ vendedor | Solicita cancelamento (body: {reason}) |
| PATCH | `/:id/approve-cancel` | ✅ admin | Aprova cancelamento → status: "Cancelado" |
| GET | `/cancellation-requests` | ✅ admin | Lista solicitações de cancelamento |

### /api/analytics
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/requests` | ✅ admin/gerente/supervisor | Lista filtrada (vendedor, status, data) |
| GET | `/summary` | ✅ admin/gerente/supervisor | Contagens: total, aprovados, rejeitados, etc. |
| GET | `/by-product` | ✅ admin/gerente/supervisor | Agrupamento por produto |
| GET | `/by-vendedor` | ✅ admin/gerente/supervisor | Desempenho por vendedor |
| GET | `/by-period` | ✅ admin/gerente/supervisor | Série temporal (por dia/semana/mês) |

### Health check
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/` | ❌ | `{status: 'ok', message: 'API App Preços rodando!'}` |
| GET | `/health` | ❌ | `{status: 'healthy', timestamp}` |

---

## MIDDLEWARE DE AUTENTICAÇÃO

```typescript
// backend/src/middleware/auth.ts
// Verifica Bearer token no header Authorization
// Decodifica JWT e adiciona req.user = {_id, name, email, tipo, vendedor_code, codigo_supervisor}
// Exportar: requireAuth (uso geral), requireAdmin, requireSupervisor, requireGerente
```

---

## FUNCIONALIDADES DO FRONTEND — COMPONENTES

### App.tsx (roteamento principal)
- Guarda token+user no localStorage
- Se não autenticado → renderiza `<AuthForm />`
- Se autenticado, roteamento por tipo:
  - `vendedor` → `<VendorDashboard />`
  - `supervisor` → `<SupervisorPanel />`
  - `gerente` → `<GerentePanel />`
  - `admin` → layout com tabs: AdminPanel + AdminRequestsPanel + AdminLixeira
- Botão de logout (limpa localStorage)

### AuthForm
- Busca lista de usuários em `GET /api/auth/users`
- Dropdown/Select para selecionar usuário pelo nome
- Campo de senha
- Ao fazer login bem-sucedido: salva {token, user} no localStorage, chama callback

### VendorDashboard
- Tela inicial do vendedor com 2 cards:
  1. "Solicitação de Preços" → abre `<RequestForm />`
  2. "Calculadora de Margem" → abre `<CalculadoraStandalone />`

### RequestForm (componente central do vendedor)

**Campos do formulário:**
1. **Modo de seleção:** toggle "Cliente" ou "Subrede" (sub-rede)
2. **Seleção de cliente/subrede:** Autocomplete filtrado por vendedor_code do usuário logado
3. **Produto:** Select dos produtos do CSV
4. **Preço solicitado:** input numérico
5. **Quantidade:** input numérico
6. **Justificativa (notes):** textarea, mínimo 10 caracteres

**Lógica de preço e desconto:**
- Ao selecionar produto: exibe tabela_70 (máximo), minimo, promo
- Ao selecionar cliente: calcula desconto aplicável baseado em rede_id/a23_id do cliente vs. tabela descontos
- `precoFinal = precoSolicitado × (1 - desconto/100)`
- Se `precoFinal < minimo` → alerta vermelho "Preço abaixo do mínimo"
- Se `precoFinal < promo` → alerta amarelo, exige confirmação antes de enviar

**Lógica de desconto:**
- Busca na tabela de descontos por: (produto_id + rede_id) OU (produto_id + a23_id) OU grupo + rede_id
- Prioridade: desconto por produto > desconto por grupo

**Histórico do vendedor:**
- Lista as próprias solicitações (filtrando por requester_id === user._id)
- Últimos 14 dias
- Filtro por status
- Botão "Solicitar Cancelamento" com modal para justificativa

**Modo Subrede:**
- Select de subrede em vez de cliente individual
- Ao submeter: cria um `subrede_batch_id` (UUID v4 ou Date.now())
- Busca todos os clientes da subrede com matching vendedor_code
- Cria uma solicitação por cliente, todos com o mesmo subrede_batch_id e subrede_name

### CalculadoraStandalone

Calculadora com 5 campos interdependentes:
- **Custo** (preço de custo)
- **Margem %** = (Lucro / Renda) × 100
- **Markup %** = (Lucro / Custo) × 100
- **Renda** = Custo × (1 + Markup/100) [preço de venda]
- **Lucro** = Renda - Custo

**Comportamento:** usuário preenche 2 campos → sistema calcula os outros 3 automaticamente.
Botão "Limpar" reseta tudo.

### SupervisorPanel
- Polling 5s em `GET /api/requests/supervisor`
- Agrupa solicitações por `subrede_batch_id` (mostra como grupo colapsável quando batch_id existe)
- Para cada solicitação/grupo:
  - Chip de status colorido
  - Preços: solicitado, mínimo, desconto aplicado
  - 3 ações: [Aprovar] [Rejeitar] [Encaminhar Gerência]
  - Rejeitar abre dialog com campo de notas (obrigatório)
  - Encaminhar abre dialog com campo de justificativa
- Ações em lote (batch): mesmas 3 ações mas para todo o subrede_batch_id

### GerentePanel
- Polling 5s em `GET /api/requests/gerente`
- Tabs: "Pendentes" | "Histórico (30 dias)"
- Pendentes: status = "Aguardando Gerência"
  - Agrupamento por subrede_batch_id
  - Ações: [Aprovar] [Rejeitar] [Marcar como Alterado]
- Histórico: busca em `GET /api/analytics/requests` com filtros de vendedor, cliente, produto, data, status
- Bulk action: "Marcar todos aprovados como Alterado"
- Exportar CSV dos registros filtrados

### HistoricoGerentePanel
- Sub-componente do GerentePanel para visão histórica expandida
- Filtros: vendedor, cliente, código cliente, produto, preço, status (multi-select), data inicial, data final
- Ordena por data decrescente

### AdminPanel (aba de cadastro de usuários)
- Tabs: Vendedor | Supervisor | Gerente
- Vendedor: {name, email, password, vendedor_code (opcional)} → POST /api/auth/admin-register
- Supervisor: {name, email, password, codigo_supervisor (obrigatório)} → POST /api/auth/supervisor-register
- Gerente: {name, email, password} → POST /api/auth/gerente-register
- Alertas de sucesso/erro

### AdminRequestsPanel
- `GET /api/requests/all` com filtro de data (padrão: últimos 14 dias)
- Filtros: busca global, multi-select de status, filtro de "preço vs mínimo"
- Ordenação por qualquer coluna (asc/desc)
- Ação individual: [Marcar como Alterado]
- Ação em lote: [Marcar todos Aprovados como Alterado] com confirmação
- Exportar CSV

### AdminLixeira
- Polling 5s em `GET /api/requests/cancellation-requests`
- Tabela: vendedor, cliente, produto, preço, motivo cancelamento, data solicitação
- Ação: [Aprovar Cancelamento] → PATCH /:id/approve-cancel

---

## FLUXO DE APROVAÇÃO COMPLETO

```
Vendedor → cria solicitação → status: "Pendente"
                                       ↓
                              Supervisor revisa
                         ┌─────────────┬──────────────────┐
                    [Aprovar]     [Rejeitar]    [Encaminhar Gerência]
                         ↓             ↓                   ↓
                    "Aprovado"   "Reprovado"     "Aguardando Gerência"
                                                           ↓
                                                   Gerente revisa
                                            ┌──────────────┬──────────┐
                                       [Aprovar]       [Rejeitar]  [Alterado]
                                            ↓               ↓          ↓
                                 "Aprovado pela       "Reprovado  "Alterado"
                                  Gerência"            pela Gerência"
                                            
Qualquer status → Vendedor pode pedir cancelamento → Admin aprova → "Cancelado"
Admin/Gerente podem marcar qualquer aprovado como → "Alterado"
```

---

## REGRAS DE NEGÓCIO IMPORTANTES

1. **Filtro de clientes:** Excluir clientes com `rede_id IN (2,3,5,6,7,21,26)` EXCETO quando `rede_id` é NULL
2. **Escopo do supervisor:** Ver apenas solicitações onde `codigo_supervisor === user.codigo_supervisor`
3. **Escopo do vendedor:** Ver apenas clientes onde `a00_id_vend === user.vendedor_code`
4. **Desconto em camadas (TWO-TIER):** Produto específico tem prioridade sobre grupo de produtos
5. **Confirmação obrigatória:** Se preço final < preço promocional, exibir dialog de confirmação antes de enviar
6. **Notas obrigatórias:** Ao rejeitar ou encaminhar, o campo de justificativa é obrigatório
7. **Admin hardcoded:** O primeiro admin deve ser criado via script (`create-admin.js`) ou seed inicial com email `admin@admin.com`
8. **JWT:** Incluir no header `Authorization: Bearer <token>` em todas as rotas protegidas

---

## DOCKER COMPOSE (VPS, SEM POSTGRESQL LOCAL)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGO_URI: ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## nginx.conf (frontend container)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Proxy API para o backend
  location /api/ {
    proxy_pass http://backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Backend Dockerfile (multi-stage)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

## Frontend Dockerfile (multi-stage)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## CRIAÇÃO DO ADMIN INICIAL

Criar um script `backend/create-admin.ts` que conecta ao MongoDB Atlas e insere o usuário admin:

```typescript
// Executar uma vez: npx ts-node create-admin.ts
// Ou dentro do container: node dist/create-admin.js
{
  name: 'Administrador',
  email: 'admin@admin.com',
  password: bcrypt.hashSync('senha_admin_aqui', 10),
  tipo: 'admin'
}
```

---

## SEGURANÇA E BOAS PRÁTICAS

- ✅ Nunca expor MONGO_URI ou JWT_SECRET no frontend
- ✅ Usar variáveis de ambiente via arquivo `.env` na VPS (nunca commitar no git)
- ✅ CORS: configurar com a URL real da VPS em produção (não usar "*")
- ✅ Senhas: sempre hashear com bcrypt (salt rounds: 10)
- ✅ JWT: verificar `tipo` do usuário nos middlewares de rota
- ✅ Rotas sensíveis (register admin) devem exigir token de admin válido
- ✅ Validação: todas as entradas devem ser validadas com Zod no backend
- ✅ Rate limiting: implementar para rotas de login
- ✅ HTTPS: usar certificado Let's Encrypt com Nginx reverse proxy

---

## COMANDOS DE DEPLOY NA VPS

```bash
# Na VPS via SSH
git clone <repo> app
cd app
cp .env.example .env
# Editar .env com as variáveis corretas (MONGO_URI, JWT_SECRET, etc.)
nano .env

# Build e start
docker compose up -d --build

# Ver logs
docker compose logs -f

# Criar admin inicial (após containers subirem)
docker compose exec backend node dist/create-admin.js

# Atualizar após mudanças
git pull
docker compose up -d --build

# Parar containers
docker compose down

# Limpar volumes (CUIDADO!)
docker compose down -v
```

---

## RESUMO DA ARQUITETURA

```
Usuário (Browser)
      ↓ HTTP :80
   [VPS - Docker]
   ┌─────────────────────────────────────┐
   │  Nginx Container (frontend)          │
   │  - Serve build React (Vite)          │
   │  - /api/* → proxy backend:3001       │
   └─────────────────────────────────────┘
              ↓ internal network
   ┌─────────────────────────────────────┐
   │  Node.js Container (backend)         │
   │  - Express + TypeScript              │
   │  - JWT auth + bcrypt                 │
   │  - Mongoose ODM                      │
   └─────────────────────────────────────┘
              ↓ MongoDB Atlas Driver
   ┌─────────────────────────────────────┐
   │  MongoDB Atlas (Cloud - externo)     │
   │  Collections: users, pricerequests   │
   └─────────────────────────────────────┘
   
   Dados estáticos (produtos, clientes,
   descontos) → CSV em /public do frontend
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Setup Express + TypeScript
- [ ] Conectar MongoDB Atlas via Mongoose
- [ ] Criar modelos: User, PriceRequest
- [ ] Implementar middleware de autenticação (JWT)
- [ ] Rotas /api/auth (login, register, users list)
- [ ] Rotas /api/requests (CRUD + aprovações)
- [ ] Rotas /api/analytics (relatórios)
- [ ] Validação Zod em todas as rotas
- [ ] Tratamento de erros
- [ ] Dockerfile multi-stage

### Frontend
- [ ] Setup React + Vite + TypeScript
- [ ] Configurar React Router
- [ ] Criar AuthForm
- [ ] Criar VendorDashboard
- [ ] Criar RequestForm (lógica de desconto, validação, histórico)
- [ ] Criar CalculadoraStandalone
- [ ] Criar SupervisorPanel (polling, agrupamento por batch)
- [ ] Criar GerentePanel + HistoricoGerentePanel
- [ ] Criar AdminPanel (user registration)
- [ ] Criar AdminRequestsPanel (filtros, export CSV)
- [ ] Criar AdminLixeira (cancelamentos)
- [ ] Themes Material-UI
- [ ] Carregamento de CSV (produtos, clientes, descontos)
- [ ] Dockerfile multi-stage
- [ ] Nginx config

### DevOps
- [ ] docker-compose.yml (backend + frontend)
- [ ] Variáveis de ambiente (.env.example)
- [ ] Script create-admin.js
- [ ] Script de deploy na VPS
- [ ] Documentação de commands

---

**FIM DO PROMPT**

---

## Como usar este arquivo

1. Copie todo o conteúdo deste arquivo
2. Compartilhe com outro desenvolvedor, time ou até mesmo com uma IA (GPT-4, Claude, etc.)
3. A IA poderá usar este prompt como base para reconstruir o projeto do zero
4. Personalize conforme necessário (URLs, senhas, nomes, etc.)

**Benefícios:**
- ✅ Documentação completa do sistema
- ✅ Instruções detalhadas para reconstrução
- ✅ Referência arquitetural clara
- ✅ Fácil onboarding de novos desenvolvedores
- ✅ Base sólida para migração ou replicação
