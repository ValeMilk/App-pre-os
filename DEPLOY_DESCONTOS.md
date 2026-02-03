# Deploy da Migração de Descontos para API

## 📋 Resumo da Implementação

Migração dos descontos de CSV estático para banco de dados PostgreSQL com sincronização automática via ETL.

### 🎯 O que foi feito:

1. **Tabela `descontos` no PostgreSQL** - relaciona `rede_id` + `produto_id` com desconto
2. **ETL atualizada** - sincroniza descontos do SQL Server a cada 10 minutos
3. **Endpoint `/api/descontos`** - serve descontos via API REST
4. **Frontend atualizado** - busca descontos da API ao invés do CSV

---

## 🚀 Passo a Passo de Deploy

### 1. Criar tabela de descontos no PostgreSQL da VPS

```bash
# Conectar na VPS
ssh root@72.61.62.17

# Criar tabela usando o script
psql -U apiuser -d dbactions -f /root/create-descontos-table.sql
```

Ou executar manualmente:

```sql
psql -U apiuser -d dbactions

DROP TABLE IF EXISTS descontos;

CREATE TABLE descontos (
  rede_id INTEGER NOT NULL,
  rede_desc VARCHAR(255),
  valor_desconto DECIMAL(10, 2),
  produto_id INTEGER NOT NULL,
  produto_livre VARCHAR(50),
  produto_desc VARCHAR(255),
  PRIMARY KEY (rede_id, produto_id)
);

CREATE INDEX idx_descontos_rede ON descontos(rede_id);
CREATE INDEX idx_descontos_produto ON descontos(produto_id);
```

---

### 2. Fazer upload dos arquivos para a VPS

```bash
# No seu computador, copiar arquivos para a VPS
scp backend/etl-completo.js root@72.61.62.17:/root/etl/
scp backend/create-descontos-table.sql root@72.61.62.17:/root/
```

---

### 3. Atualizar a ETL na VPS

```bash
# Na VPS
ssh root@72.61.62.17

# Backup da ETL antiga
cp /root/etl/etl.js /root/etl/etl.js.backup

# Substituir pela nova ETL
mv /root/etl/etl-completo.js /root/etl/etl.js

# Testar a ETL manualmente
cd /root/etl
node etl.js
```

Você deve ver:
```
=== Iniciando sincronização ===
✓ Conectado ao SQL Server
--- Sincronizando PRODUTOS ---
✓ 51 produtos sincronizados
--- Sincronizando CLIENTES ---
✓ 1218 clientes sincronizados
--- Sincronizando DESCONTOS ---
✓ XXXX descontos sincronizados
=== Sincronização concluída com sucesso! ===
```

---

### 4. Atualizar o backend na VPS

```bash
# No seu computador local, dentro da pasta backend
cd "C:\Users\PC 0025\Desktop\App Preços\backend"

# Fazer commit das mudanças
git add src/routes/database.ts
git commit -m "feat: Adicionar endpoint /api/descontos"
git push origin vps-test

# Na VPS, atualizar o código
ssh root@72.61.62.17
cd /root/appprecos/backend
git pull origin vps-test

# Recompilar o backend
npm run build

# Reiniciar o backend
pm2 restart backend-precos
pm2 logs backend-precos --lines 50
```

---

### 5. Atualizar o frontend

```bash
# No seu computador, na pasta frontend
cd "C:\Users\PC 0025\Desktop\App Preços\frontend"

# Fazer commit das mudanças
git add src/App.tsx src/config/api.ts src/types/Desconto.ts src/utils/apiHelpers.ts
git commit -m "feat: Migrar descontos do CSV para API"
git push origin vps-test

# Na VPS, fazer pull das mudanças
ssh root@72.61.62.17
cd /root/appprecos/frontend

git pull origin vps-test

# Rebuild do frontend
npm run build

# Copiar arquivos para o servidor web
cd dist
sudo cp -rv * /var/www/appprecos/

# Reiniciar o frontend
pm2 restart frontend-precos
```

---

### 6. Verificar se está funcionando

#### 6.1. Testar API de descontos

```bash
# Na VPS
curl http://localhost:3001/api/descontos | jq '. | length'
```

Deve retornar o número de descontos sincronizados.

#### 6.2. Verificar no navegador

1. Abrir http://72.61.62.17
2. Fazer login
3. Abrir DevTools (F12) → Console
4. Verificar mensagens:
   - `Descontos carregados da API: Array(XXXX)`

#### 6.3. Testar cálculo de desconto

1. Selecionar um cliente
2. Adicionar um produto
3. Verificar se o desconto está sendo aplicado corretamente

---

## 🔍 Verificações Importantes

### Verificar dados no PostgreSQL

```sql
-- Quantos descontos foram sincronizados?
SELECT COUNT(*) FROM descontos;

-- Ver alguns exemplos
SELECT * FROM descontos LIMIT 10;

-- Ver descontos de uma rede específica
SELECT * FROM descontos WHERE rede_id = 1;

-- Ver descontos de um produto específico
SELECT * FROM descontos WHERE produto_id = 123;
```

### Verificar logs

```bash
# Logs da ETL
cat /var/log/etl.log

# Logs do backend
pm2 logs backend-precos

# Status dos processos
pm2 status
```

---

## 🔄 Como funciona a lógica dos descontos

### Estrutura de dados:

1. **Cliente** tem um `rede_id` (campo A16_ID da tabela A00)
2. **Desconto** é definido pela combinação `rede_id` + `produto_id`
3. Quando o usuário seleciona:
   - Cliente (código 123) → tem `rede_id = 5`
   - Produto (código 456) → tem `produto_id = 456`
   - Sistema busca desconto onde `rede_id = 5 AND produto_id = 456`

### Exemplo prático:

```
Cliente "Supermercado ABC"
  └─ codigo: 123
  └─ rede_id: 5 (Rede "ATACADO")

Produto "LEITE INTEGRAL 1L"
  └─ codigo_produto: 456
  └─ produto_id: 456

Desconto encontrado:
  └─ rede_id: 5
  └─ produto_id: 456
  └─ valor_desconto: 3.50 (representa 3,50%)
```

---

## ⚠️ Troubleshooting

### Descontos não aparecem no frontend

1. Verificar se a ETL sincronizou: `SELECT COUNT(*) FROM descontos;`
2. Verificar endpoint: `curl http://localhost:3001/api/descontos`
3. Verificar console do navegador (F12)
4. Limpar cache do navegador (Ctrl+Shift+Delete)

### ETL falha ao sincronizar descontos

1. Verificar conexão VPN com SQL Server: `ping 192.168.254.5`
2. Verificar se a query funciona no SQL Server
3. Ver logs: `pm2 logs backend-precos`

### Desconto não está sendo aplicado corretamente

1. Verificar se o cliente tem `rede_id` preenchido
2. Verificar se existe desconto para aquela combinação rede+produto
3. Verificar se o campo `valor_desconto` está com o valor correto no banco

---

## 📊 Dados Esperados

Após a sincronização, você deve ter aproximadamente:
- **1218 clientes** (com rede_id)
- **51 produtos**
- **~1300-1400 descontos** (varia conforme as regras cadastradas no ERP)

---

## ✅ Checklist Final

- [ ] Tabela `descontos` criada no PostgreSQL
- [ ] ETL atualizada e testada manualmente
- [ ] ETL rodando via cron a cada 10 minutos
- [ ] Backend com endpoint `/api/descontos` funcionando
- [ ] Frontend buscando descontos da API
- [ ] Teste completo: login → selecionar cliente → adicionar produto → verificar desconto
- [ ] Logs sem erros em `pm2 logs backend-precos`
- [ ] Console do navegador mostrando "Descontos carregados da API"
- [ ] Arquivos CSV de descontos podem ser removidos do repositório

---

## 🎉 Próximos Passos (Opcional)

Após validar que tudo está funcionando:

1. Remover arquivos CSV antigos:
   ```bash
   rm /var/www/appprecos/descontos.csv
   git rm frontend/public/descontos.csv
   ```

2. Fazer merge para a branch main quando estiver tudo validado em produção

3. Atualizar documentação sobre a nova arquitetura de dados
