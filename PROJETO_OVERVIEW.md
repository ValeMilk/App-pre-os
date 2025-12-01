# App Preços — Documentação Completa do Projeto

## 📋 Visão Geral

**App Preços** é um sistema web completo para gerenciamento hierárquico de solicitações de preços especiais em ambientes de vendas B2B. O sistema implementa um fluxo de aprovação em três níveis (vendedor → supervisor → admin) com autenticação JWT, painel administrativo em tempo real e exportação de dados.

### Tecnologias Principais

**Backend:**
- Node.js + Express (TypeScript)
- MongoDB + Mongoose
- JWT (autenticação)
- bcryptjs (hash de senhas)
- CORS

**Frontend:**
- React 18 + TypeScript
- Material-UI (MUI v7)
- Vite (bundler)
- PapaParse (CSV parsing)

---

## 🏗️ Arquitetura do Sistema

### Backend (`backend/`)

```
backend/
├── src/
│   ├── index.ts              # Servidor principal, rotas de requests
│   ├── models/
│   │   └── User.ts           # Schema Mongoose (usuários)
│   ├── middleware/
│   │   └── auth.ts           # Middleware JWT (requireAuth)
│   └── routes/
│       └── auth.ts           # Rotas de autenticação
├── package.json
├── tsconfig.json
└── .env                      # Variáveis de ambiente
```

#### Modelos de Dados

**User (Usuário)**
```typescript
{
  name: string,
  email: string (unique),
  password: string (hash bcrypt),
  vendedor_code?: string,
  codigo_supervisor?: string,
  tipo: 'admin' | 'vendedor' | 'supervisor',
  created_at: Date
}
```

**PriceRequest (Solicitação)**
```typescript
{
  requester_name: string,
  requester_id: string,           // userId do vendedor
  customer_code: string,
  customer_name?: string,
  product_id: string,
  product_name?: string,
  requested_price: string,
  currency: string,
  status: string,                 // 'Pending', 'Aprovado', 'Reprovado'
  notes?: string,
  created_at: Date,
  approved_by?: string,
  approved_at?: Date,
  codigo_supervisor?: string,
  nome_supervisor?: string
}
```

#### Endpoints da API

**Autenticação (`/api/auth`)**
- `POST /register` — Registro público (não recomendado produção)
- `POST /login` — Login (retorna JWT token)
- `POST /admin-register` 🔒 — Admin cadastra vendedor
- `POST /supervisor-register` 🔒 — Admin cadastra supervisor

**Solicitações (`/api/requests`)**
- `GET /requests` 🔒 — Lista solicitações do vendedor logado
- `POST /requests` 🔒 — Cria nova solicitação
- `GET /requests/all` 🔒 — Admin: lista todas as solicitações
- `GET /requests/supervisor` 🔒 — Supervisor: lista solicitações de seus vendedores
- `PATCH /requests/:id/approve` 🔒 — Supervisor aprova solicitação
- `PATCH /requests/:id/reject` 🔒 — Supervisor reprova solicitação

🔒 = Requer autenticação JWT (header `Authorization: Bearer <token>`)

---

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── App.tsx                      # Componente raiz, roteamento lógico
│   ├── main.tsx                     # Entry point React
│   ├── mui-theme.ts                 # Tema Material-UI
│   ├── components/
│   │   ├── AuthForm.tsx             # Formulário de login
│   │   ├── RequestForm.tsx          # Formulário vendedor (criar solicitações)
│   │   ├── AdminPanel.tsx           # Painel admin (cadastrar usuários)
│   │   └── AdminRequestsPanel.tsx   # Painel admin (visualizar solicitações)
│   ├── types/
│   │   ├── Cliente.ts
│   │   └── Produto.ts
│   └── utils/
│       ├── parseCsv.ts              # Parser clientes.csv
│       └── parseProdutosCsv.ts      # Parser produtos.csv
├── public/
│   ├── clientes.csv                 # Base de clientes
│   └── produtos.csv                 # Base de produtos
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

#### Componentes Principais

**`App.tsx`**
- Gerencia estado de autenticação (token/user)
- Carrega arquivos CSV na montagem
- Renderiza condicionalmente:
  - Não autenticado → `AuthForm`
  - Admin → `AdminPanel` + `AdminRequestsPanel`
  - Vendedor → `RequestForm`

**`AuthForm.tsx`**
- Login com email/senha
- POST `/api/auth/login`
- Armazena token/user no localStorage
- Callback `onAuthSuccess` para atualizar App

**`RequestForm.tsx`**
- Autocomplete para clientes e produtos
- Validação de preço (número > 0)
- POST `/api/requests` para criar solicitação
- GET `/api/requests` para listar histórico do vendedor
- Exporta histórico para CSV

**`AdminPanel.tsx`**
- Tabs: cadastrar vendedor ou supervisor
- POST `/api/auth/admin-register` (vendedor)
- POST `/api/auth/supervisor-register` (supervisor)
- Requer autenticação como admin

**`AdminRequestsPanel.tsx`**
- GET `/api/requests/all` com polling (5s)
- Tabela estilizada com status colorido
- Exporta todas as solicitações para CSV

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

1. **Login:** usuário envia email/senha → backend valida e retorna JWT
2. **Token Storage:** frontend armazena token no `localStorage`
3. **Requests Autenticados:** frontend inclui header `Authorization: Bearer <token>`
4. **Middleware `requireAuth`:** valida JWT, decodifica e anexa `req.user`
5. **Autorização:** rotas verificam `req.user.tipo` ou `req.user.email`

### Hierarquia de Permissões

| Usuário     | Permissões                                               |
|-------------|----------------------------------------------------------|
| **Admin**   | Cadastrar vendedores/supervisores, visualizar tudo       |
| **Supervisor** | Visualizar solicitações de seus vendedores, aprovar/reprovar |
| **Vendedor**   | Criar solicitações, visualizar histórico próprio         |

### Segurança Implementada

- ✅ Senhas hashadas com bcryptjs (salt rounds: 10)
- ✅ JWT com expiração de 7 dias
- ✅ CORS habilitado para localhost:3000
- ✅ Validação de tipos no TypeScript
- ✅ Runtime checks para `JWT_SECRET` (não crash em import)
- ✅ Proteção de rotas sensíveis (admin/supervisor)
- ⚠️ Registro público desabilitado em produção (usar `/admin-register`)

---

## 📊 Fluxo de Dados

### Criação de Solicitação (Vendedor)

```
1. Vendedor seleciona cliente + produto + preço
2. Frontend: POST /api/requests + token JWT
3. Backend: requireAuth → valida token → extrai userId
4. Backend: cria PriceRequest com requester_id = userId
5. Backend: retorna solicitação criada
6. Frontend: adiciona ao histórico local
```

### Aprovação de Solicitação (Supervisor)

```
1. Supervisor visualiza solicitações (GET /requests/supervisor)
2. Backend filtra por codigo_supervisor do token JWT
3. Supervisor clica "Aprovar" → PATCH /requests/:id/approve
4. Backend atualiza status, approved_by, approved_at
5. Frontend (admin) recebe update via polling (5s)
```

### Visualização Admin (Tempo Real)

```
1. AdminRequestsPanel faz GET /requests/all a cada 5s (polling)
2. Backend retorna todas as solicitações do MongoDB
3. Frontend atualiza tabela com dados mais recentes
4. Indicadores visuais: verde (aprovado), vermelho (reprovado), laranja (pendente)
```

---

## 📦 Estrutura de Arquivos CSV

### `clientes.csv` (delimitador: `;`)
```
codigo;nome_fantasia;vendedor_code;vendedor_name;supervisor_code;supervisor_name
12383;MERCADINHO O GEOVAM;12506;ANTONIO ALEXANDRE;12534;JOSE FURTADO
```

**Campos:**
- `codigo`: código único do cliente
- `nome_fantasia`: nome da loja
- `vendedor_code`: código do vendedor responsável
- `vendedor_name`: nome do vendedor
- `supervisor_code`: código do supervisor (campo 5)
- `supervisor_name`: nome do supervisor (campo 6)

### `produtos.csv` (delimitador: `;`)
```
id;codigo_produto;nome_produto
1;ABC123;PRODUTO EXEMPLO
```

**Campos:**
- `id`: ID interno
- `codigo_produto`: código SKU
- `nome_produto`: descrição do produto

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- MongoDB (Atlas ou local)
- npm/yarn

### Configuração Backend

1. **Instalar dependências:**
```bash
cd backend
npm install
```

2. **Configurar `.env`:**
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=4000
JWT_SECRET=sua_chave_secreta_aqui
```

3. **Executar:**
```bash
npm run dev       # Desenvolvimento (hot reload)
npm run build     # Build produção
npm start         # Produção (requer build)
```

### Configuração Frontend

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Executar:**
```bash
npm run dev       # Desenvolvimento (Vite dev server)
npm run build     # Build produção
npm run preview   # Preview build
```

3. **Acessar:** `http://localhost:5173` (Vite) ou `http://localhost:3000` (build)

---

## 🧪 Testando o Fluxo Completo

### 1. Criar Admin (MongoDB direto ou script)
```javascript
// No MongoDB Compass ou shell
db.users.insertOne({
  name: "Admin",
  email: "admin@admin.com",
  password: "$2a$10$HASH_BCRYPT_AQUI", // use bcryptjs para gerar
  tipo: "admin",
  created_at: new Date()
})
```

### 2. Login como Admin
```
Email: admin@admin.com
Senha: sua_senha
```

### 3. Cadastrar Supervisor
```
Nome: Supervisor Test
Email: sup@example.com
Senha: sup123
Código: 12506
```

### 4. Cadastrar Vendedor
```
Nome: Vendedor Test
Email: ven@example.com
Senha: ven123
Código vendedor: (opcional)
```

### 5. Login como Vendedor
- Criar solicitação de preço
- Visualizar histórico

### 6. Login como Supervisor
- Visualizar solicitações dos vendedores
- Aprovar/reprovar

### 7. Verificar no Admin
- Painel mostra todas as solicitações
- Status atualiza em tempo real (polling 5s)

---

## 🐛 Diagnóstico e Logs

### Backend Logs
```
[STARTUP] PORT= 4000
[STARTUP] MONGO_URI present= true
[STARTUP] JWT_SECRET present= true
MongoDB conectado!
API rodando em http://localhost:4000

[REQUESTS] POST by user: { userId, name, email, ... }
[REQUESTS] GET by user: { userId, name, email, ... }
[AUTH] JWT_SECRET em uso: true
[AUTH] Token recebido: eyJhbGc...
```

### Erros Comuns

**Erro: "JWT_SECRET não definido no ambiente!"**
- Solução: adicionar `JWT_SECRET` no `.env` do backend

**Erro: "Token inválido"**
- Solução: verificar se token não expirou (7 dias), relogar

**Erro: "Acesso negado. Apenas admin pode..."**
- Solução: verificar `user.email === 'admin@admin.com'` ou `user.tipo`

**Erro: "Nenhuma solicitação registrada" (vendedor)**
- Solução: verificar se `requester_id` no MongoDB corresponde ao `userId` do token

**Erro: CSV não carregado**
- Solução: colocar `clientes.csv` e `produtos.csv` em `frontend/public/`

---

## 🔧 Melhorias Futuras

### Segurança
- [ ] Rate limiting (express-rate-limit)
- [ ] HTTPS obrigatório em produção
- [ ] Refresh tokens (JWT de curta duração)
- [ ] Registro de auditoria (quem fez o quê)
- [ ] Sanitização de inputs (express-validator)

### Funcionalidades
- [ ] Notificações por email (aprovação/reprovação)
- [ ] WebSockets para updates em tempo real (Socket.io)
- [ ] Dashboard com gráficos (status por vendedor, tempo médio)
- [ ] Filtros avançados (data, cliente, produto, status)
- [ ] Comentários em solicitações (thread de discussão)
- [ ] Histórico de mudanças (quem aprovou/reprovou)
- [ ] Upload de arquivos anexos (orçamentos, contratos)
- [ ] Aprovação em múltiplos níveis (supervisor → gerente → diretor)

### UI/UX
- [ ] Dark mode
- [ ] Responsividade mobile (otimizar tabelas)
- [ ] Paginação (tabelas grandes)
- [ ] Busca e filtros inline
- [ ] Indicadores visuais (badges de notificação)
- [ ] Tutorial interativo (onboarding)

### Performance
- [ ] Cache Redis (sessões, queries frequentes)
- [ ] Índices MongoDB (requester_id, customer_code)
- [ ] Lazy loading de solicitações
- [ ] Compressão gzip (express-compression)
- [ ] CDN para assets estáticos

### DevOps
- [ ] Docker/Docker Compose
- [ ] CI/CD (GitHub Actions)
- [ ] Testes automatizados (Jest, Supertest, React Testing Library)
- [ ] Linting/formatting (ESLint, Prettier)
- [ ] Monitoramento (Sentry, LogRocket)

---

## 📝 Convenções de Código

### TypeScript
- Strict mode habilitado
- Interfaces para tipos complexos
- Avoid `any` (usar `unknown` ou tipos específicos)

### Backend
- Rotas RESTful (`GET /resources`, `POST /resources`)
- Middleware para autenticação/autorização
- Try/catch para async operations
- Logs estruturados (`console.log('[CONTEXT] message')`)

### Frontend
- Componentes funcionais (hooks)
- Estado local com `useState`, `useEffect`
- Props tipadas com TypeScript
- Material-UI para componentes visuais
- CSS-in-JS (MUI `sx` prop)

### Git
- Commits semânticos: `feat:`, `fix:`, `docs:`, `refactor:`
- Branches: `main` (produção), `develop` (desenvolvimento)

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona X'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e confidencial. Todos os direitos reservados.

---

## 📞 Suporte

**Desenvolvedor:** Copilot AI Assistant  
**Contato:** via GitHub Issues  
**Documentação:** Este arquivo (`PROJETO_OVERVIEW.md`)

---

## 📚 Referências Técnicas

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Última atualização:** Dezembro 2025  
**Versão:** 1.0.0
