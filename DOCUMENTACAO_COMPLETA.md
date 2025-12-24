# 📋 Documentação Completa - Sistema de Solicitação de Preços Vale Milk

## 🎯 Visão Geral do Projeto

**Nome:** App Preços (Vale Milk Price Request System)  
**Tipo:** Sistema Web Full-Stack de Gestão de Solicitações de Preços  
**Cliente:** Vale Milk  
**Propósito:** Gerenciar solicitações de preços especiais de vendedores, com aprovação hierárquica (Supervisor → Gerente) e controle de descontos por rede/subrede de clientes.

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

#### **Frontend**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI) v5
- **Roteamento:** React Router DOM
- **Validação:** Zod (schemas de validação)
- **CSV Parser:** PapaParse
- **Deploy:** Vercel
- **URL Base API:** Configurável via `VITE_API_URL`

#### **Backend**
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Banco de Dados:** MongoDB (via Mongoose)
- **Autenticação:** JWT (JSON Web Tokens) + bcrypt
- **CORS:** Habilitado para frontend
- **Deploy:** Railway
- **Porta:** 4000 (produção configurável)

---

## 📁 Estrutura de Pastas

```
App Preços/
├── frontend/
│   ├── public/
│   │   ├── clientes.csv          # CSV de clientes (upload pelo vendedor)
│   │   └── produtos.csv          # CSV de produtos
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.tsx           # Dashboard do Admin
│   │   │   ├── AdminRequestsPanel.tsx  # Central de todas solicitações
│   │   │   ├── AuthForm.tsx            # Login/Registro
│   │   │   ├── RequestForm.tsx         # Formulário de solicitação (Vendedor)
│   │   │   └── SupervisorPanel.tsx     # Painel do Supervisor
│   │   ├── config/
│   │   │   └── api.ts                  # Endpoints da API
│   │   ├── types/
│   │   │   ├── Cliente.ts              # Interface Cliente
│   │   │   └── Produto.ts              # Interface Produto
│   │   ├── utils/
│   │   │   ├── parseCsv.ts             # Parser de clientes.csv
│   │   │   └── parseProdutosCsv.ts     # Parser de produtos.csv
│   │   ├── schemas/                    # Validação Zod
│   │   ├── App.tsx                     # Componente principal
│   │   ├── main.tsx                    # Entry point
│   │   └── mui-theme.tsx               # Tema Material-UI
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json                     # Config deploy Vercel
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── PriceRequest.ts         # Model MongoDB - Solicitações
│   │   │   └── User.ts                 # Model MongoDB - Usuários
│   │   ├── middleware/
│   │   │   └── auth.ts                 # Middleware JWT
│   │   ├── routes/
│   │   │   └── analytics.ts            # Rotas de analytics/dashboard
│   │   └── index.ts                    # Server Express + Rotas principais
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.json                    # Config deploy Railway
│
├── PROJETO_OVERVIEW.md
├── DEPLOY_GUIDE.md
└── DOCUMENTACAO_COMPLETA.md (este arquivo)
```

---

## 👥 Tipos de Usuários e Permissões

### 1. **Vendedor** (`tipo: 'vendedor'`)
**Permissões:**
- ✅ Criar solicitações de preço (individual ou por subrede)
- ✅ Ver suas próprias solicitações
- ✅ Solicitar cancelamento de solicitações
- ✅ Fazer upload de CSV de clientes
- ✅ Usar calculadora de margem/markup
- ❌ Aprovar/reprovar solicitações
- ❌ Ver solicitações de outros vendedores

### 2. **Supervisor** (`tipo: 'supervisor'`)
**Permissões:**
- ✅ Ver solicitações da sua equipe (filtradas por `codigo_supervisor`)
- ✅ Aprovar solicitações dentro do preço mínimo
- ✅ Reprovar solicitações com justificativa
- ✅ Encaminhar para gerência (preços abaixo do mínimo)
- ✅ Aprovar/reprovar em lote (subredes)
- ❌ Ver solicitações de outras equipes
- ❌ Marcar como "Alterado"

### 3. **Gerente** (`tipo: 'gerente'`)
**Permissões:**
- ✅ Ver solicitações aguardando gerência
- ✅ Aprovar solicitações abaixo do mínimo
- ✅ Reprovar solicitações com motivo
- ✅ Aprovar/reprovar em lote
- ✅ Acesso ao dashboard de analytics
- ❌ Marcar como "Alterado"
- ❌ Cancelar solicitações

### 4. **Admin** (`tipo: 'admin'`, email: `admin@admin.com`)
**Permissões:**
- ✅ Ver TODAS as solicitações (central completa)
- ✅ Marcar solicitações como "Alterado"
- ✅ Aprovar solicitações de cancelamento
- ✅ Criar novos usuários (vendedor, supervisor, gerente)
- ✅ Acesso total ao sistema

---

## 🗄️ Modelos de Dados

### **PriceRequest** (Solicitação de Preço)
```typescript
{
  _id: ObjectId,                          // ID MongoDB
  
  // Vendedor
  requester_name: string,                  // Nome do vendedor
  requester_id: string,                    // ID do vendedor
  
  // Cliente
  customer_code: string,                   // Código do cliente
  customer_name: string,                   // Nome fantasia
  
  // Produto
  product_id: string,                      // Código do produto
  product_name: string,                    // Nome do produto
  product_maximo: string,                  // Preço máximo permitido
  product_minimo: string,                  // Preço mínimo (aprovação supervisor)
  product_promocional: string,             // Preço promocional (bloqueio)
  
  // Preço Solicitado
  requested_price: string,                 // Preço solicitado pelo vendedor
  quantity: string,                        // Quantidade
  currency: string,                        // Moeda (R$)
  
  // Desconto (se aplicável)
  discount_percent: string,                // Percentual de desconto (ex: "5.00")
  discounted_price: string,                // Preço final após desconto
  
  // Status e Aprovação
  status: string,                          // "Pending", "Aprovado", "Reprovado", 
                                           // "Aguardando Gerência", "Alterado", "Cancelado"
  approved_by: string,                     // Nome de quem aprovou/reprovou
  approved_at: Date,                       // Data de aprovação/reprovação
  
  // Justificativas
  notes: string,                           // Justificativa DO VENDEDOR (preservada)
  supervisor_notes: string,                // Justificativa DO SUPERVISOR/GERENTE
  
  // Supervisor
  codigo_supervisor: string,               // Código do supervisor responsável
  nome_supervisor: string,                 // Nome do supervisor
  
  // Subrede (solicitações em lote)
  subrede_name: string,                    // Nome da subrede (se aplicável)
  subrede_batch_id: string,                // ID do lote de subrede
  
  // Cancelamento
  cancellation_requested: boolean,         // Vendedor solicitou cancelamento?
  cancellation_reason: string,             // Motivo do cancelamento
  cancellation_requested_at: Date,         // Data da solicitação
  cancelled_by: string,                    // Quem cancelou (admin)
  
  // Timestamps
  created_at: Date,                        // Data de criação (default: Date.now)
  updated_at: Date,                        // Última atualização
  altered_by: string,                      // Quem marcou como "Alterado"
  altered_at: Date                         // Data da alteração
}
```

### **User** (Usuário)
```typescript
{
  _id: ObjectId,
  name: string,                            // Nome completo
  email: string,                           // Email (único, usado no login)
  password: string,                        // Hash bcrypt
  tipo: string,                            // "vendedor" | "supervisor" | "gerente" | "admin"
  codigo_supervisor: string,               // Código do supervisor (para vendedores)
  nome_supervisor: string,                 // Nome do supervisor (para vendedores)
  created_at: Date
}
```

### **Cliente** (CSV - não persistido no BD)
```typescript
{
  codigo: string,                          // Código único do cliente
  nome_fantasia: string,                   // Nome do cliente
  rede: string,                            // Rede (ex: "POPULAR", "MERCADINHO")
  subrede: string,                         // Subrede (ex: "POPULAR ATACADISTA")
  vendedor_code: string,                   // Código do vendedor responsável
  vendedor_name: string,                   // Nome do vendedor
  supervisor_code: string,                 // Código do supervisor
  supervisor_name: string                  // Nome do supervisor
}
```

### **Produto** (CSV - não persistido no BD)
```typescript
{
  id: string,                              // ID único
  codigo_produto: string,                  // Código do produto
  nome_produto: string,                    // Nome do produto
  maximo: string,                          // Preço máximo (ex: "10.50")
  minimo: string,                          // Preço mínimo (ex: "8.00")
  promocional: string                      // Preço promocional (ex: "7.50")
}
```

### **Desconto** (CSV - não persistido no BD)
```typescript
{
  codigo_produto: string,                  // Código do produto
  rede: string,                            // Rede (ou "-" se não especificado)
  subrede: string,                         // Subrede (ou "-" se não especificado)
  desconto: string                         // Percentual (ex: "5,00%")
}
```

---

## 🔐 Autenticação e Segurança

### **JWT Token**
- **Geração:** Backend cria token após login bem-sucedido
- **Conteúdo do Token:**
  ```typescript
  {
    userId: string,
    email: string,
    name: string,
    tipo: 'vendedor' | 'supervisor' | 'gerente' | 'admin',
    codigo_supervisor?: string,
    nome_supervisor?: string
  }
  ```
- **Expiração:** 7 dias
- **Armazenamento:** `localStorage` no frontend
- **Header:** `Authorization: Bearer <token>`

### **Middleware de Autenticação**
```typescript
// backend/src/middleware/auth.ts
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};
```

### **Proteção de Rotas**
- **Frontend:** `PrivateRoute` verifica token no `localStorage`
- **Backend:** Middleware `requireAuth` valida JWT em todas as rotas protegidas
- **Logout:** Remove token do `localStorage` e redireciona para login

---

## 🔄 Fluxos de Trabalho Principais

### **1. Fluxo de Solicitação de Preço (Vendedor)**

```
1. Vendedor faz login
   ↓
2. Acessa RequestForm
   ↓
3. Seleciona modo: CLIENTE ou SUBREDE
   ↓
4. Seleciona cliente/subrede
   ↓
5. Seleciona produto
   ↓
   [SISTEMA VALIDA AUTOMATICAMENTE:]
   - Verifica se há desconto aplicável (rede/subrede + produto)
   - Calcula preço final (com desconto se houver)
   - Mostra alertas de preço (mínimo, máximo, promocional)
   ↓
6. Digita preço solicitado
   ↓
7. Digita quantidade
   ↓
8. Preenche justificativa (obrigatória, min 10 caracteres)
   ↓
   [VALIDAÇÕES PRÉ-SUBMIT:]
   - Preço final > máximo? → BLOQUEIA
   - Preço final < promocional? → BLOQUEIA (dialog informativo)
   - Preço final < mínimo (mas > promocional)? → Dialog de confirmação
   - Já existe solicitação pendente mesmo cliente+produto? → BLOQUEIA
   ↓
9. Clica "ENVIAR SOLICITAÇÃO"
   ↓
10. Backend cria solicitação com status "Pending"
    ↓
11. Solicitação aparece na lista do vendedor
```

### **2. Fluxo de Aprovação (Supervisor)**

```
1. Supervisor faz login
   ↓
2. Acessa SupervisorPanel
   ↓
3. Vê solicitações pendentes da sua equipe
   ↓
4. Para cada solicitação:
   ↓
   [OPÇÃO A: APROVAR]
   - Clica "Aprovar"
   - Pode adicionar observação (opcional)
   - Status muda para "Aprovado"
   - Campo supervisor_notes é preenchido
   - Campo notes (do vendedor) é PRESERVADO
   ↓
   [OPÇÃO B: REPROVAR]
   - Clica "Reprovar"
   - OBRIGATÓRIO: Preenche motivo da reprovação
   - Status muda para "Reprovado"
   - Campo supervisor_notes recebe o motivo
   - Campo notes (do vendedor) é PRESERVADO
   ↓
   [OPÇÃO C: ENCAMINHAR PARA GERÊNCIA]
   - Clica "Encaminhar para Gerência"
   - Adiciona observação (opcional)
   - Status muda para "Aguardando Gerência"
   - Campo supervisor_notes é preenchido
   ↓
5. Vendedor é notificado (via status na lista)
```

### **3. Fluxo de Gerência**

```
1. Gerente faz login
   ↓
2. Acessa painel de gerência
   ↓
3. Vê solicitações "Aguardando Gerência"
   ↓
4. Para cada solicitação:
   ↓
   [OPÇÃO A: APROVAR]
   - Clica "Aprovar pela Gerência"
   - Status muda para "Aprovado pela Gerência"
   ↓
   [OPÇÃO B: REPROVAR]
   - Clica "Reprovar pela Gerência"
   - OBRIGATÓRIO: Preenche motivo
   - Status muda para "Reprovado pela Gerência"
   - Campo supervisor_notes recebe o motivo
   ↓
5. Solicitação sai da fila de gerência
```

### **4. Fluxo de Cancelamento**

```
1. Vendedor solicita cancelamento
   ↓
2. Preenche motivo do cancelamento
   ↓
3. Campo cancellation_requested = true
   ↓
4. Admin vê solicitação de cancelamento
   ↓
5. Admin aprova cancelamento
   ↓
6. Status muda para "Cancelado"
```

### **5. Fluxo de Alteração (Admin)**

```
1. Solicitação está "Aprovado" ou "Reprovado"
   ↓
2. Admin marca como "Alterado"
   ↓
3. Status muda para "Alterado"
   ↓
4. Indica que preço foi efetivamente alterado no sistema
```

---

## 📊 Regras de Negócio Críticas

### **1. Cálculo de Desconto**

O sistema calcula desconto baseado em **REDE + SUBREDE + PRODUTO**:

```typescript
// Lógica de aplicação de desconto:

1. Produto deve corresponder exatamente
2. Desconto pode especificar:
   - REDE + SUBREDE → Cliente DEVE ter ambos
   - APENAS REDE → Cliente deve ter essa REDE (subrede opcional)
   - APENAS SUBREDE → Cliente deve ter essa SUBREDE
   - Nenhum dos dois → Desconto NÃO se aplica

// Exemplos:
Desconto: { produto: "12345", rede: "POPULAR", subrede: "POPULAR ATACADISTA", desconto: "5%" }
Cliente: { rede: "POPULAR", subrede: "POPULAR ATACADISTA" } → ✅ APLICA

Desconto: { produto: "12345", rede: "POPULAR", subrede: "-", desconto: "5%" }
Cliente: { rede: "POPULAR", subrede: "QUALQUER" } → ✅ APLICA

Desconto: { produto: "12345", rede: "-", subrede: "ATACADISTA", desconto: "5%" }
Cliente: { rede: "QUALQUER", subrede: "ATACADISTA" } → ✅ APLICA
```

### **2. Validação de Preços**

```typescript
// Ordem de validação:
1. Preço FINAL (com desconto) > Máximo → BLOQUEIA (erro)
2. Preço FINAL < Promocional → BLOQUEIA (dialog informativo)
3. Preço FINAL < Mínimo → Permite com confirmação (encaminha supervisor)

// Importante: SEMPRE comparar o preço FINAL (após desconto)
```

### **3. Duplicação de Solicitações**

```typescript
// Bloqueia se:
- Mesmo cliente_code
- Mesmo product_id
- Status em ['Pending', 'Pendente', 'Aguardando Gerência']

// Permite se:
- Cliente diferente OU
- Produto diferente OU
- Solicitação anterior já foi aprovada/reprovada
```

### **4. Hierarquia de Aprovação**

```
Vendedor cria → "Pending"
        ↓
Supervisor analisa:
├─ Preço OK → "Aprovado"
├─ Preço ruim → "Reprovado"
└─ Abaixo mínimo → "Aguardando Gerência"
        ↓
Gerente decide:
├─ "Aprovado pela Gerência"
└─ "Reprovado pela Gerência"
        ↓
Admin marca → "Alterado" (preço foi efetivamente mudado)
```

---

## 🌐 Endpoints da API

### **Autenticação**

#### `POST /api/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ token, user: { name, email, tipo } }`
- **Função:** Login de usuário

#### `POST /api/auth/register`
- **Body:** `{ name, email, password, codigo_supervisor, nome_supervisor }`
- **Response:** `{ message: 'Vendedor registrado' }`
- **Função:** Registro de vendedor

#### `POST /api/auth/supervisor-register`
- **Auth:** Admin
- **Body:** `{ name, email, password }`
- **Response:** `{ message: 'Supervisor registrado' }`

#### `POST /api/auth/gerente-register`
- **Auth:** Admin
- **Body:** `{ name, email, password }`
- **Response:** `{ message: 'Gerente registrado' }`

#### `GET /api/auth/users`
- **Auth:** Admin
- **Response:** `User[]`
- **Função:** Listar todos os usuários

---

### **Solicitações (Vendedor)**

#### `POST /api/requests`
- **Auth:** Vendedor
- **Body:** `PriceRequest` (ver modelo acima)
- **Response:** `PriceRequest` criado
- **Função:** Criar nova solicitação

#### `GET /api/requests`
- **Auth:** Vendedor
- **Response:** `PriceRequest[]` (apenas do vendedor logado)
- **Função:** Listar solicitações do vendedor

#### `POST /api/requests/:id/request-cancel`
- **Auth:** Vendedor
- **Body:** `{ cancellation_reason }`
- **Response:** `PriceRequest` atualizado
- **Função:** Solicitar cancelamento

---

### **Supervisor**

#### `GET /api/requests/supervisor`
- **Auth:** Supervisor
- **Response:** `PriceRequest[]` (filtradas por `codigo_supervisor`)
- **Função:** Listar solicitações da equipe

#### `PATCH /api/requests/:id/approve`
- **Auth:** Supervisor
- **Body:** `{ notes? }`
- **Response:** `PriceRequest` atualizado
- **Função:** Aprovar solicitação

#### `PATCH /api/requests/:id/reject`
- **Auth:** Supervisor
- **Body:** `{ notes }` (obrigatório)
- **Response:** `PriceRequest` atualizado
- **Função:** Reprovar solicitação

#### `PATCH /api/requests/:id/encaminhar-gerencia`
- **Auth:** Supervisor
- **Body:** `{ supervisor_notes? }`
- **Response:** `PriceRequest` atualizado
- **Função:** Encaminhar para gerência

#### `PATCH /api/requests/batch/:batchId/approve`
- **Auth:** Supervisor
- **Body:** `{ notes? }`
- **Response:** `{ message, count }`
- **Função:** Aprovar em lote (subrede)

#### `PATCH /api/requests/batch/:batchId/reject`
- **Auth:** Supervisor
- **Body:** `{ notes }` (obrigatório)
- **Response:** `{ message, count }`
- **Função:** Reprovar em lote

#### `PATCH /api/requests/batch/:batchId/encaminhar-gerencia`
- **Auth:** Supervisor
- **Body:** `{ supervisor_notes? }`
- **Response:** `{ message, count }`
- **Função:** Encaminhar lote para gerência

---

### **Gerente**

#### `GET /api/requests/gerente`
- **Auth:** Gerente
- **Response:** `PriceRequest[]` (status: "Aguardando Gerência", "Aprovado pela Gerência", "Reprovado pela Gerência", "Alterado")
- **Função:** Listar solicitações para gerência

#### `PATCH /api/requests/:id/gerente-approve`
- **Auth:** Gerente
- **Response:** `PriceRequest` atualizado
- **Função:** Aprovar pela gerência

#### `PATCH /api/requests/:id/gerente-reject`
- **Auth:** Gerente
- **Body:** `{ notes }` (obrigatório)
- **Response:** `PriceRequest` atualizado
- **Função:** Reprovar pela gerência

#### `PATCH /api/requests/batch/:batchId/gerente-approve`
- **Auth:** Gerente
- **Response:** `{ message, count }`
- **Função:** Aprovar lote pela gerência

#### `PATCH /api/requests/batch/:batchId/gerente-reject`
- **Auth:** Gerente
- **Body:** `{ notes }` (obrigatório)
- **Response:** `{ message, count }`
- **Função:** Reprovar lote pela gerência

---

### **Admin**

#### `GET /api/requests/all`
- **Auth:** Admin (email: admin@admin.com)
- **Response:** `PriceRequest[]` (TODAS as solicitações)
- **Função:** Central de solicitações completa

#### `PATCH /api/requests/:id/mark-altered`
- **Auth:** Admin
- **Response:** `PriceRequest` atualizado
- **Função:** Marcar solicitação como "Alterado"

---

### **Analytics (Supervisor, Gerente, Admin)**

#### `GET /api/analytics/dashboard`
- **Auth:** Supervisor, Gerente ou Admin
- **Query Params:** `start_date`, `end_date`
- **Response:**
  ```typescript
  {
    summary: {
      total, aprovados, rejeitados, pendentes, cancelados,
      taxaAprovacao, taxaRejeicao
    },
    byProduct: Array<{ product_id, total_solicitacoes, ... }>,
    byVendedor: Array<{ requester_id, total_solicitacoes, ... }>,
    byCustomer: Array<{ customer_code, total_solicitacoes, ... }>,
    byPeriod: Array<{ _id: "2025-12", total_solicitacoes, ... }>,
    tempoAprovacao: { tempo_medio_horas, ... },
    bySupervisor: Array<...> (apenas admin/gerente),
    detailedRequests: PriceRequest[] (com campos calculados)
  }
  ```
- **Função:** Dashboard consolidado para análise e Power BI

---

## 🎨 Componentes Frontend Principais

### **RequestForm.tsx** (Vendedor)
- **Funcionalidades:**
  - Seleção de cliente individual ou subrede inteira
  - Autocomplete de clientes e produtos
  - Calculadora de margem/markup integrada
  - Validação em tempo real de preços
  - Exibição de desconto aplicável
  - Alertas visuais (preço acima/abaixo limites)
  - Lista de solicitações do vendedor
  - Solicitação de cancelamento

### **SupervisorPanel.tsx**
- **Funcionalidades:**
  - Lista de solicitações pendentes da equipe
  - Filtros por status, cliente, produto
  - Aprovação individual com observação
  - Reprovação com justificativa obrigatória
  - Encaminhamento para gerência
  - Aprovação/reprovação em lote (subredes)
  - Visualização de descontos aplicados

### **AdminRequestsPanel.tsx**
- **Funcionalidades:**
  - Central com TODAS as solicitações do sistema
  - Filtros avançados (status, status preço, pesquisa global)
  - Exportação CSV completa
  - Marcar aprovadas como "Alterado"
  - Visualização de 2 colunas de justificativas:
    - Justificativa Vendedor (preservada)
    - Justificativa Supervisor (motivo aprovação/reprovação)
  - Status de preço calculado (Abaixo/Igual/Acima do Mínimo)

### **AuthForm.tsx**
- **Funcionalidades:**
  - Login com email/senha
  - Registro de vendedor
  - Validação de campos
  - Redirecionamento baseado em tipo de usuário

---

## 🚀 Deploy

### **Frontend (Vercel)**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://app-precos-production.up.railway.app"
  }
}
```

**Passos:**
1. Conectar repositório GitHub ao Vercel
2. Configurar `VITE_API_URL` nas variáveis de ambiente
3. Deploy automático a cada push na branch `main`

### **Backend (Railway)**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Variáveis de Ambiente Railway:**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=seu_secret_super_seguro_aqui
PORT=4000
NODE_ENV=production
```

**Passos:**
1. Criar projeto no Railway
2. Conectar repositório GitHub
3. Adicionar variáveis de ambiente
4. Deploy automático a cada push

---

## 📝 Observações Importantes

### **Campos Críticos Preservados**
- ⚠️ **`notes`**: Justificativa do vendedor - NUNCA sobrescrever
- ⚠️ **`supervisor_notes`**: Motivos de aprovação/reprovação - usar este campo

### **Status em Inglês vs Português**
- Backend salva: `"Pending"`, `"Aprovado"`, etc.
- Frontend exibe: Tradução em português
- Filtros: Usar valores em inglês do backend

### **Performance**
- Frontend: Polling a cada 5 segundos para atualizar status
- Backend: Índices MongoDB em `requester_id`, `codigo_supervisor`, `status`
- CSV: Parse em memória (não persiste no BD)

### **Segurança**
- Senhas: bcrypt com salt rounds = 10
- JWT: Secret key em variável de ambiente
- CORS: Configurado para domínio do frontend
- Validação: Zod no frontend + validações manuais no backend

---

## 🐛 Problemas Conhecidos e Soluções

### **1. Justificativas Desaparecendo**
- **Problema:** Campo `notes` era sobrescrito na aprovação
- **Solução:** Usar `supervisor_notes` para supervisor/gerente
- **Status:** ✅ Corrigido

### **2. Filtro de Status Não Funcionando**
- **Problema:** Backend usa "Pending" (inglês), filtro buscava "Pendente" (português)
- **Solução:** Filtro usa valores em inglês do backend
- **Status:** ✅ Corrigido

### **3. Validação de Preço Máximo Incorreta**
- **Problema:** Comparava preço digitado com máximo, ignorando desconto
- **Solução:** Comparar preço FINAL (após desconto) com máximo
- **Status:** ✅ Corrigido

### **4. Duplicação de Solicitações**
- **Problema:** Vendedores criavam múltiplas solicitações para mesmo cliente+produto
- **Solução:** Validação pré-submit bloqueia duplicatas pendentes
- **Status:** ✅ Corrigido

---

## 📞 Contatos e Referências

- **Repositório:** https://github.com/ValeMilk/App-pre-os
- **Frontend URL:** https://app-precos.vercel.app
- **Backend URL:** https://app-precos-production.up.railway.app
- **Cliente:** Vale Milk

---

## 🔮 Melhorias Futuras

1. **Notificações Push/Email** quando status mudar
2. **Dashboard de Analytics** mais robusto (gráficos)
3. **Histórico de Alterações** (audit log)
4. **Exportação para Excel** com formatação
5. **Upload de CSV de Descontos** (atualmente hardcoded)
6. **Relatórios PDF** de solicitações
7. **Integração com ERP** da Vale Milk
8. **Chat/Comentários** nas solicitações
9. **Mobile App** (React Native)
10. **Busca Avançada** com filtros combinados

---

**Última Atualização:** 19 de Dezembro de 2025  
**Versão da Documentação:** 1.0  
**Autor:** Equipe de Desenvolvimento Vale Milk
