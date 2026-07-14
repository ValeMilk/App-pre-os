# 🎉 Deploy: Histórico de Status com Timeline

## ✅ Status Atual

**Branch**: `vps-test` (commit `879f452`)
**Alterações**: 5 arquivos, 330 linhas adicionadas

### Mudanças Implementadas:

#### 1. **Backend** ✅
- ✅ `backend/src/models/PriceRequest.ts`: Adicionado field `status_history` com schema
- ✅ `backend/src/index.ts`: 
  - Implementado helper `addStatusHistory()`
  - Atualizado POST `/api/requests` com inicialização de status_history
  - Atualizado PATCH `/api/requests/:id/approve` com status_history tracking
  - Atualizado PATCH `/api/requests/:id/reject` com status_history tracking
  - Atualizado PATCH `/api/requests/:id/mark-altered` com status_history tracking
  - Atualizado PATCH `/api/requests/:id/encaminhar-gerencia` com status_history tracking
- ✅ Build executado com sucesso (`npm run build` → tsc OK)

#### 2. **Frontend** ✅
- ✅ Criado novo componente `frontend/src/components/StatusHistoryDialog.tsx`
  - Timeline visual com ícone "i" (InfoIcon)
  - Timeline mostra: status, timestamp, usuário que alterou
  - Cálculo de duração entre status changes (ex: "15min", "2h 30min")
  - Dialog modal ao clicar no ícone
  - Cores por status: verde (Aprovado), vermelho (Reprovado), laranja (Alterado)
  
- ✅ Atualizado `frontend/src/components/AdminRequestsPanel.tsx`
  - Importado `StatusHistoryDialog`
  - Adicionada nova coluna "Histórico" na tabela de requisições
  - StatusHistoryDialog passando `statusHistory` e `createdAt` de cada requisição
  
- ✅ Instalado `@mui/lab` para componentes Timeline
- ✅ Build frontend executado com sucesso (5.29s)

---

## 🚀 INSTRUÇÕES DE DEPLOY

### Opção 1: Deploy Manual via SSH (Recomendado)

```bash
# 1. SSH na VPS
ssh root@72.61.62.17

# 2. Navegar para o diretório do projeto
cd /root/App-pre-os

# 3. Pull da branch vps-test
git pull origin vps-test

# 4. Rebuild dos containers
docker-compose up -d --build

# 5. Verificar logs
docker-compose logs -f
```

### Opção 2: Deploy via SCP (Se SSH não funcionar)

```bash
# No seu Windows PowerShell
cd "c:\Users\LENOVO 059\Desktop\App-pre-os"

# Copiar backend dist
scp -r backend/dist/* root@72.61.62.17:/root/App-pre-os/backend/dist/

# Copiar frontend dist
scp -r frontend/dist/* root@72.61.62.17:/root/App-pre-os/frontend/dist/

# SSH na VPS e restart containers
ssh root@72.61.62.17
docker-compose restart
```

### Opção 3: Deploy via GitHub Webhook (Automático)

Configure um webhook no GitHub que chame um script na VPS para fazer pull automático em cada push para `vps-test`.

---

## 🧪 TESTE NA VPS

Após deploy, verificar:

```bash
# 1. Verificar se containers estão rodando
docker ps

# 2. Acessar aplicação
curl http://localhost:9000  # Frontend
curl http://localhost:9001/api/requests  # Backend API

# 3. Criar uma requisição e ver histórico
# - Acesse http://72.61.62.17:9000
# - Faça login
# - Crie uma requisição
# - Na tabela de requisições, clique no ícone "i"
# - Veja o histórico de status com timeline
```

---

## 📊 Formato do Status History (Retornado pela API)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Aprovado",
  "status_history": [
    {
      "status": "Pendente",
      "timestamp": "2024-01-15T14:30:00.000Z",
      "changed_by": "user@email.com"
    },
    {
      "status": "Aguardando Gerência",
      "timestamp": "2024-01-15T15:15:00.000Z",
      "changed_by": "gerente@email.com"
    },
    {
      "status": "Aprovado",
      "timestamp": "2024-01-15T15:45:00.000Z",
      "changed_by": "gerente@email.com"
    }
  ]
}
```

---

## 🎨 Componente StatusHistoryDialog

### Props:
- `statusHistory?: { status: string; timestamp: string; changed_by?: string }[]` - Array do histórico
- `createdAt?: string` - Data de criação da requisição

### Funcionalidades:
- ✅ Ícone "i" flutuante (clicável)
- ✅ Timeline visual com icons por tipo de status
- ✅ Timestamps formatados em "HH:MM:SS" (pt-BR)
- ✅ Duração entre status changes
- ✅ Exibe usuário que fez a alteração
- ✅ Resume: data total e número de etapas
- ✅ Responsive e integrado com Material-UI

---

## 📝 Próximos Passos (Opcional)

- [ ] Adicionar status_history nos outros painéis (Supervisor, Manager)
- [ ] Exportar histórico para CSV/PDF
- [ ] Criar gráfico de tempo médio por status
- [ ] Notificações em tempo real de alterações
- [ ] Audit log completo com IP do usuário

---

## ❌ Conhecidos Pendentes

- Batch endpoints (`/api/requests/batch/:batchId/approve` e `/reject`) podem ainda não estar usando status_history (necessário verificar se é crítico)
- Endpoint `/api/requests/:id/request-cancel` pode precisar ser atualizado com status_history

---

**Status**: ✅ PRONTO PARA DEPLOY
**Data**: 2024-01-15
**Branch**: vps-test
**Commit**: 879f452
