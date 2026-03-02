# Guia de Verificação de Supervisores

## Problema Identificado

Quando o vendedor cria uma solicitação, o sistema não mostra a solicitação para o supervisor correspondente. Isso acontece porque:

1. **CSV de Clientes** contém colunas "ID SUPERVISOR" e "SUPERVISOR" (ex: 12534 e "JOSE FURTADO CASTRO")
2. **Banco User** tem campo `codigo_supervisor` que deve corresponder ao "ID SUPERVISOR" do CSV
3. **Se os códigos não coincidirem**, as solicitações não aparecem para o supervisor

## Correções Implementadas

### 1. Backend - Filtro Mais Flexível
A rota `/api/requests/supervisor` agora busca por:
- `codigo_supervisor` (código do CSV) **OU**
- `nome_supervisor` (nome do usuário logado)

Isso torna o sistema mais robusto mesmo se os códigos não coincidirem perfeitamente.

### 2. Logs de Debug Adicionados
- Backend loga informações detalhadas ao criar e buscar solicitações
- Frontend loga dados recebidos e processados

## Como Verificar se Supervisores Estão Corretos

### Passo 1: Verificar Supervisores no CSV
Abra `frontend/public/clientes.csv` e veja as colunas:
- Coluna 8: ID SUPERVISOR (ex: 12534)
- Coluna 9: SUPERVISOR (ex: JOSE FURTADO CASTRO)

### Passo 2: Verificar Supervisores Cadastrados no Banco
Execute no MongoDB:
```javascript
db.users.find({ tipo: 'supervisor' }, { name: 1, email: 1, codigo_supervisor: 1 })
```

### Passo 3: Comparar
Certifique-se que:
- O `codigo_supervisor` no banco corresponde ao "ID SUPERVISOR" do CSV
- O `name` no banco é similar ao "SUPERVISOR" do CSV (pode ter variações)

### Passo 4: Usar Endpoint de Debug (Admin)
Como admin, acesse:
```
GET http://localhost:5000/api/debug/supervisores
```

Isso retorna todos os códigos e nomes de supervisores que aparecem nas solicitações.

## Como Cadastrar Supervisores Corretamente

### Via API (Recomendado)
```bash
curl -X POST http://localhost:5000/api/auth/supervisor-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "name": "JOSE FURTADO CASTRO",
    "email": "jose.castro@empresa.com",
    "password": "senha123",
    "codigo_supervisor": "12534"
  }'
```

**IMPORTANTE**: Use o CÓDIGO (12534) e o NOME exatamente como aparecem no CSV de clientes!

### Exemplo Completo
Se no CSV você tem:
```
ID SUPERVISOR;SUPERVISOR
12534;JOSE FURTADO CASTRO
```

Então cadastre:
```json
{
  "name": "JOSE FURTADO CASTRO",
  "email": "jose.castro@empresa.com", 
  "password": "senha_segura",
  "codigo_supervisor": "12534"
}
```

## Teste de Funcionamento

### 1. Vendedor Cria Solicitação
- Faça login como vendedor
- Crie uma solicitação para um cliente
- Verifique nos logs do backend:
  ```
  [REQUESTS] Solicitação criada com ID: ... para supervisor: 12534 JOSE FURTADO CASTRO
  ```

### 2. Supervisor Visualiza
- Faça login como supervisor
- Verifique nos logs do backend:
  ```
  [SUPERVISOR] Buscando solicitações para: { codigo_supervisor: '12534', nome_user: 'JOSE FURTADO CASTRO' }
  [SUPERVISOR] Solicitações encontradas: X
  ```

### 3. Verificar no Console do Navegador
Abra DevTools (F12) e veja:
```
📊 Total de solicitações recebidas: X
📊 Exemplo de solicitação: { ... codigo_supervisor: '12534', nome_supervisor: 'JOSE FURTADO CASTRO' }
```

## Comandos Úteis

### Ver Logs do Backend
```bash
# Windows PowerShell
Get-Content -Path "caminho/do/log" -Tail 50 -Wait
```

### Atualizar Supervisor Existente
```javascript
// MongoDB
db.users.updateOne(
  { email: 'jose.castro@empresa.com' },
  { $set: { codigo_supervisor: '12534' } }
)
```

## Problemas Comuns

### Problema: Solicitações não aparecem
**Causa**: Código do supervisor no banco não corresponde ao CSV
**Solução**: Atualize o `codigo_supervisor` no banco User

### Problema: Nomes diferentes
**Causa**: Nome no banco e no CSV são ligeiramente diferentes
**Solução**: Sistema agora busca por código OU nome, então deve funcionar

### Problema: Status incorreto
**Causa**: Frontend envia "Pending" mas backend espera outro status
**Solução**: Verificado - está correto como "Pending"

## Monitoramento em Tempo Real

O sistema tem polling de 5 segundos. Após criar uma solicitação:
- Aguarde até 5 segundos
- A solicitação deve aparecer automaticamente no painel do supervisor
- Se não aparecer, verifique os logs do backend

## Contato de Suporte

Se o problema persistir:
1. Capture os logs do backend durante a criação da solicitação
2. Capture os logs do frontend do supervisor
3. Execute o endpoint `/api/debug/supervisores` e compartilhe o resultado
