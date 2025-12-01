# 🎯 Guia de Teste — Fluxo Supervisor

## ✅ Implementações Realizadas

### Backend (`backend/src/routes/auth.ts`)
- ✅ Campo `tipo` adicionado ao token JWT no login
- ✅ Campo `tipo` retornado na resposta do login

### Frontend

**SupervisorPanel.tsx (NOVO)**
- ✅ Componente criado para supervisores
- ✅ Tabela de solicitações pendentes com ações
- ✅ Botão ✅ (CHECK) para aprovar
- ✅ Botão ❌ (X) para reprovar (abre dialog para Justificativa obrigatórias)
- ✅ Histórico de solicitações processadas (aprovadas/reprovadas)
- ✅ Polling automático a cada 5s para atualizar em tempo real
- ✅ Integração com endpoints:
  - `GET /api/requests/supervisor` (listar solicitações)
  - `PATCH /api/requests/:id/approve` (aprovar)
  - `PATCH /api/requests/:id/reject` (reprovar com Justificativa)

**App.tsx**
- ✅ Detecta `user.tipo === 'supervisor'` e exibe `SupervisorPanel`
- ✅ Fluxo de renderização:
  - Não autenticado → `AuthForm`
  - Admin → `AdminPanel` + `AdminRequestsPanel`
  - **Supervisor → `SupervisorPanel`** (NOVO)
  - Vendedor → `RequestForm`

**RequestForm.tsx**
- ✅ Polling adicionado (5s) para atualizar status em tempo real
- ✅ Vendedor vê automaticamente quando sua solicitação é aprovada/reprovada

---

## 🧪 Como Testar o Fluxo Completo

### 1️⃣ **Criar Supervisor (como Admin)**

**Login como Admin:**
```
Email: admin@admin.com
Senha: sua_senha_admin
```

**Cadastrar Supervisor:**
- Ir para aba "Cadastrar Supervisor"
- Nome: `Supervisor Teste`
- Email: `supervisor@test.com`
- Senha: `super123`
- Código Supervisor: `12534` (deve corresponder ao código do CSV)

### 2️⃣ **Criar Vendedor (como Admin)**

**Cadastrar Vendedor:**
- Ir para aba "Cadastrar Vendedor"
- Nome: `Vendedor Teste`
- Email: `vendedor@test.com`
- Senha: `vend123`
- Código Vendedor: `12506` (opcional, mas ajuda a filtrar clientes)

### 3️⃣ **Criar Solicitação (como Vendedor)**

**Logout e Login como Vendedor:**
```
Email: vendedor@test.com
Senha: vend123
```

**Criar Solicitação:**
1. Selecionar um cliente (Autocomplete)
2. Selecionar um produto (Autocomplete)
3. Digitar preço: `100.50`
4. Adicionar Justificativa (opcional): `Cliente solicitou desconto especial`
5. Clicar em "Enviar Solicitação"

**Verificar:**
- ✅ Solicitação aparece no histórico abaixo
- ✅ Status: `Pending` (laranja)

### 4️⃣ **Aprovar/Reprovar (como Supervisor)**

**Logout e Login como Supervisor:**
```
Email: supervisor@test.com
Senha: super123
```

**Visualizar Solicitações:**
- ✅ Painel mostra "Solicitações Pendentes (1)"
- ✅ Tabela com vendedor, cliente, produto, preço, data

**Aprovar:**
1. Clicar no botão ✅ (CHECK verde)
2. ✅ Mensagem de sucesso aparece
3. ✅ Solicitação move para "Histórico Processado"
4. ✅ Status muda para "Aprovado" (verde)

**OU Reprovar:**
1. Clicar no botão ❌ (X vermelho)
2. Dialog abre pedindo motivo
3. Digitar: `Preço fora da política comercial`
4. Clicar em "Confirmar Reprovação"
5. ✅ Mensagem de sucesso aparece
6. ✅ Solicitação move para "Histórico Processado"
7. ✅ Status muda para "Reprovado" (vermelho)

### 5️⃣ **Verificar Atualização em Tempo Real**

**Login como Vendedor (outra aba/janela):**
```
Email: vendedor@test.com
Senha: vend123
```

**Aguardar 5 segundos:**
- ✅ Status da solicitação atualiza automaticamente
- ✅ Se aprovado: background verde, status "Aprovado"
- ✅ Se reprovado: background vermelho, status "Reprovado", Justificativa do supervisor visíveis

**Login como Admin (outra aba/janela):**
```
Email: admin@admin.com
Senha: sua_senha_admin
```

**Verificar Painel Admin:**
- ✅ Tabela "Solicitações de Preços" atualiza automaticamente (5s)
- ✅ Status correto (Aprovado/Reprovado)
- ✅ Coluna "Aprovado por" mostra nome do supervisor
- ✅ Coluna "Aprovado em" mostra data/hora

---

## 🔍 Checklist de Validação

### Supervisor Panel
- [ ] Supervisor vê apenas solicitações de **seus** vendedores (filtro por `codigo_supervisor`)
- [ ] Botão ✅ aprova e remove da lista de pendentes
- [ ] Botão ❌ abre dialog obrigatório para Justificativa
- [ ] Não é possível reprovar sem preencher Justificativa
- [ ] Histórico processado mostra aprovados (verde) e reprovados (vermelho)
- [ ] Polling funciona (atualiza a cada 5s sem reload)

### Vendedor Panel
- [ ] Vendedor NÃO vê botões de aprovar/reprovar
- [ ] Histórico atualiza automaticamente quando supervisor aprova/reprova
- [ ] Status muda de "Pending" → "Aprovado" ou "Reprovado"
- [ ] Justificativa de reprovação aparecem no histórico

### Admin Panel
- [ ] Admin vê TODAS as solicitações (não apenas de um supervisor)
- [ ] Coluna "Aprovado por" mostra nome do supervisor
- [ ] Coluna "Aprovado em" mostra timestamp correto
- [ ] Polling funciona (5s)

### Segurança
- [ ] Supervisor não consegue aprovar solicitações de outros supervisores
- [ ] Vendedor não consegue acessar endpoint `/api/requests/supervisor`
- [ ] Token JWT contém campo `tipo` correto

---

## 🐛 Possíveis Problemas

### "Nenhuma solicitação pendente"
**Causa:** Supervisor não está vinculado ao vendedor via `codigo_supervisor`  
**Solução:** Verificar se o `codigo_supervisor` do supervisor corresponde ao `supervisor_code` no CSV do cliente

### "Erro 403 Forbidden"
**Causa:** Supervisor tentando aprovar solicitação de outro supervisor  
**Solução:** Verificar lógica de filtro no backend (`/api/requests/supervisor`)

### Status não atualiza automaticamente
**Causa:** Polling não funcionando  
**Solução:** 
1. Abrir DevTools → Network
2. Verificar se há requests a cada 5s para `/api/requests`
3. Verificar console para erros de CORS ou 401

---

## 📊 Endpoints Envolvidos

| Endpoint | Método | Quem Usa | Função |
|----------|--------|----------|--------|
| `/api/requests/supervisor` | GET | Supervisor | Listar solicitações dos vendedores |
| `/api/requests/:id/approve` | PATCH | Supervisor | Aprovar solicitação |
| `/api/requests/:id/reject` | PATCH | Supervisor | Reprovar solicitação (requer `notes`) |
| `/api/requests` | GET | Vendedor | Listar histórico próprio |
| `/api/requests/all` | GET | Admin | Listar todas as solicitações |

---

## ✨ Melhorias Futuras

- [ ] Notificação push/email quando status muda
- [ ] WebSocket em vez de polling (Socket.io)
- [ ] Filtros avançados (data, status, vendedor)
- [ ] Comentários múltiplos (thread de discussão)
- [ ] Dashboard com métricas (taxa de aprovação, tempo médio)

---

**Última atualização:** Dezembro 2025  
**Desenvolvedor:** GitHub Copilot
