# 📊 API de Analytics para Power BI

Este documento descreve os endpoints de analytics criados para integração com Power BI.

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token no header:
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Permissões:**
- `admin`: Acesso total a todos os dados
- `gerente`: Acesso total a todos os dados
- `supervisor`: Acesso apenas aos dados do seu código de supervisor

---

## 📍 Endpoints Disponíveis

### 1️⃣ **GET /api/analytics/requests**
Retorna todas as solicitações com filtros opcionais.

**Query Parameters:**
- `start_date` (opcional): Data inicial (formato: YYYY-MM-DD)
- `end_date` (opcional): Data final (formato: YYYY-MM-DD)
- `status` (opcional): aprovado | rejeitado | pendente
- `vendedor_id` (opcional): ID do vendedor
- `supervisor_code` (opcional): Código do supervisor

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/requests?start_date=2025-01-01&end_date=2025-12-31&status=aprovado
```

**Resposta:**
```json
{
  "total": 150,
  "data": [
    {
      "_id": "...",
      "requester_name": "João Silva",
      "customer_name": "REDE SEMPRE BEM",
      "product_name": "IOGURTE MORANGO 170G",
      "status": "aprovado",
      "created_at": "2025-01-15T10:30:00Z",
      "approved_at": "2025-01-15T14:20:00Z",
      "requested_price": "5.50",
      "discount_percent": "10%",
      ...
    }
  ]
}
```

---

### 2️⃣ **GET /api/analytics/summary**
Retorna resumo geral das solicitações.

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/summary?start_date=2025-01-01
```

**Resposta:**
```json
{
  "total": 500,
  "aprovados": 380,
  "rejeitados": 70,
  "pendentes": 40,
  "cancelados": 10,
  "taxaAprovacao": "76.00%",
  "taxaRejeicao": "14.00%"
}
```

---

### 3️⃣ **GET /api/analytics/by-product**
Agrupa solicitações por produto (mais solicitados).

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/by-product
```

**Resposta:**
```json
[
  {
    "_id": {
      "product_id": "188025",
      "product_name": "GAR IOGURTE MORANGO VALEMILK 170G"
    },
    "total_solicitacoes": 85,
    "aprovados": 70,
    "rejeitados": 10,
    "pendentes": 5
  },
  ...
]
```

---

### 4️⃣ **GET /api/analytics/by-vendedor**
Performance de cada vendedor.

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/by-vendedor
```

**Resposta:**
```json
[
  {
    "_id": {
      "requester_id": "user123",
      "requester_name": "João Silva"
    },
    "total_solicitacoes": 120,
    "aprovados": 95,
    "rejeitados": 15,
    "pendentes": 10
  },
  ...
]
```

---

### 5️⃣ **GET /api/analytics/by-period**
Dados agregados por período (dia/semana/mês).

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)
- `period` (opcional): day | week | month (default: day)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/by-period?period=month
```

**Resposta:**
```json
[
  {
    "_id": "2025-01",
    "total_solicitacoes": 180,
    "aprovados": 140,
    "rejeitados": 25,
    "pendentes": 15
  },
  {
    "_id": "2025-02",
    "total_solicitacoes": 220,
    "aprovados": 180,
    "rejeitados": 30,
    "pendentes": 10
  },
  ...
]
```

---

### 6️⃣ **GET /api/analytics/by-supervisor**
Performance de cada supervisor (apenas admin/gerente).

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/by-supervisor
```

**Resposta:**
```json
[
  {
    "_id": {
      "codigo_supervisor": "SUP001",
      "nome_supervisor": "Maria Santos"
    },
    "total_solicitacoes": 350,
    "aprovados": 280,
    "rejeitados": 50,
    "pendentes": 20
  },
  ...
]
```

---

### 7️⃣ **GET /api/analytics/by-customer**
Solicitações agrupadas por cliente.

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/by-customer
```

**Resposta:**
```json
[
  {
    "_id": {
      "customer_code": "12345",
      "customer_name": "REDE SEMPRE BEM"
    },
    "total_solicitacoes": 95,
    "aprovados": 75,
    "rejeitados": 15,
    "pendentes": 5
  },
  ...
]
```

---

### 8️⃣ **GET /api/analytics/tempo-aprovacao**
Tempo médio de aprovação das solicitações.

**Query Parameters:**
- `start_date` (opcional)
- `end_date` (opcional)

**Exemplo de URL:**
```
https://seu-backend.railway.app/api/analytics/tempo-aprovacao
```

**Resposta:**
```json
{
  "tempo_medio_horas": "4.75",
  "tempo_minimo_horas": "0.25",
  "tempo_maximo_horas": "48.50",
  "total_aprovacoes": 380
}
```

---

## 🔌 Como usar no Power BI

### Passo 1: Obter dados da Web
1. Abra o Power BI Desktop
2. Clique em **"Obter Dados"** → **"Web"**
3. Cole a URL do endpoint (ex: `https://seu-backend.railway.app/api/analytics/summary`)

### Passo 2: Configurar autenticação
1. Na janela de autenticação, selecione **"Avançado"**
2. Em **"Cabeçalhos HTTP"**, adicione:
   - Nome: `Authorization`
   - Valor: `Bearer SEU_TOKEN_JWT`

### Passo 3: Transformar dados
1. O Power BI vai carregar os dados JSON
2. Use o **Editor de Consultas** para expandir os campos JSON
3. Configure os tipos de dados (data, número, texto)

### Passo 4: Criar relacionamentos
- Crie múltiplas consultas (uma para cada endpoint)
- Configure relacionamentos entre tabelas (ex: vendedor_id, product_id)

### Passo 5: Criar visualizações
Exemplos de visualizações úteis:
- **Gráfico de pizza**: Taxa de aprovação vs rejeição
- **Gráfico de barras**: Top 10 produtos mais solicitados
- **Gráfico de linha**: Solicitações por período (tendência)
- **Tabela**: Performance de vendedores
- **Cartões**: Total de solicitações, média de aprovação, tempo médio

---

## 📝 Dicas para Power BI

### Atualizar dados automaticamente
Configure a atualização automática dos dados no Power BI Service (após publicar):
1. Publique o relatório no Power BI Service
2. Configure o **Gateway** (se necessário)
3. Agende a atualização (ex: a cada 1 hora, diariamente)

### Filtros dinâmicos
Use **parâmetros** no Power BI para criar filtros dinâmicos de data:
```
https://seu-backend.railway.app/api/analytics/requests?start_date=" & Text.From(DataInicio) & "&end_date=" & Text.From(DataFim)
```

### Performance
- Use os endpoints agregados (by-product, by-vendedor) em vez de processar todos os requests
- Configure cache no Power BI Service
- Limite o período de dados (últimos 90 dias, 6 meses, etc)

---

## 🚀 Deploy

Após fazer commit, o Railway vai fazer deploy automático do backend com os novos endpoints.

**URL do backend:** `https://seu-projeto.railway.app`

Substitua `SEU_TOKEN_JWT` pelo token obtido no login do app.

---

## 📞 Suporte

Se tiver dúvidas ou precisar de novos endpoints, entre em contato!
