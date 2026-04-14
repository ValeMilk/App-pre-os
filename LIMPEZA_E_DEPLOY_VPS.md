# 🔧 OPERAÇÃO LIMPEZA - VPS 72.61.62.17

## ⚠️ AVISO
As seguintes portas estão LISTENING:
- ✅ 80 (Frontend)
- ✅ 3001 (Backend)
- ✅ 5433 (PostgreSQL)
- ❓ 8000, 8081, 8082 (Desconhecidos)

Isso indica que há containers/processos antigos rodando.

---

## PASSO 1️⃣ - Identificar o que está rodando

Copie e cole **NA VPS** (um comando de cada vez):

```bash
# Ver todos os containers Docker
docker ps -a
```

**Resultado esperado:** Deve listar containers com nomes como:
- app-precos-frontend
- app-precos-backend
- app-precos-postgres
- app-precos-etl
- Ou outros nomes antigos

---

## PASSO 2️⃣ - Ver quais processo estão em quais portas

```bash
# Ver processo na porta 80
lsof -i :80

# Ver processo na porta 3001
lsof -i :3001

# Ver processo na porta 5433
lsof -i :5433

# Ver processo nas portas extras
lsof -i :8000
lsof -i :8081
lsof -i :8082
```

---

## PASSO 3️⃣ - Limpar tudo (IMPORTANTE!)

```bash
# Parar todos os containers
docker stop $(docker ps -aq)

# Remover todos os containers
docker rm $(docker ps -aq)

# Verificar que não há mais containers
docker ps -a

# Limpar volumes se necessário (CUIDADO: apaga dados do BD!)
# docker system prune -a --volumes
```

---

## PASSO 4️⃣ - Verificar que as portas estão vazias

```bash
# Após parar os containers, verificar:
netstat -tuln | grep -E ':(80|3001|5433)'

# Resultado esperado: NENHUMA SAÍDA (portas liberadas)
```

**Se ainda aparecerem portas:**
```bash
# Forçar liberação
fuser -k 80/tcp
fuser -k 3001/tcp
fuser -k 5433/tcp
fuser -k 8000/tcp
fuser -k 8081/tcp
fuser -k 8082/tcp
```

---

## PASSO 5️⃣ - Transferir o projeto novo para VPS

No **Windows PowerShell**, execute:

```powershell
cd "c:\Users\LENOVO 059\Desktop"
scp -r App-pre-os root@72.61.62.17:/root/app-precos
```

Ou use Git (se tiver repositório):

```bash
# NA VPS:
cd /root
git clone <seu-repositorio> app-precos
cd app-precos
```

---

## PASSO 6️⃣ - Fazer deploy do novo projeto

Na **VPS**, execute:

```bash
cd /root/app-precos

# Verificar que o docker-compose.yml existe
ls -la docker-compose.yml

# Build das imagens
docker compose build --no-cache

# Iniciar containers
docker compose up -d

# Aguardar 15 segundos
sleep 15

# Verificar status
docker compose ps
```

---

## PASSO 7️⃣ - Testar se tudo está rodando

```bash
# Ver logs em tempo real (Ctrl+C para sair)
docker compose logs -f

# Testar backend (em outro terminal)
curl http://localhost:3001/api/produtos

# Testar frontend
curl http://localhost:80

# Ver status dos containers
docker ps
```

---

## PASSO 8️⃣ - Acessar no navegador

Abra no navegador (do seu Windows):
- **Frontend:** http://72.61.62.17
- **Backend:** http://72.61.62.17:3001/api/produtos

---

## 🆘 Se algo der errado

### Containers não iniciam
```bash
# Ver logs detalhados
docker compose logs

# Reiniciar
docker compose restart

# Rebuild completo
docker compose down
docker compose build --no-cache
docker compose up -d
```

### PostgreSQL não está respondendo
```bash
# Ver logs do PostgreSQL
docker compose logs postgres

# Verificar se banco foi criado
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT 1;"
```

### Backend não conecta ao PostgreSQL
```bash
# Ver logs do backend
docker compose logs backend

# Reiniciar backend
docker compose restart backend
```

### ETL não sincroniza
```bash
# Ver logs do ETL
docker compose logs etl

# Verificar conectividade com SQL Server
docker exec -it app-precos-etl ping 10.1.0.3
```

---

## 📋 Checklist

- [ ] Conectou via SSH: `ssh root@72.61.62.17`
- [ ] Verificou containers antigos: `docker ps -a`
- [ ] Parou todos os containers: `docker stop $(docker ps -aq)`
- [ ] Verificou que portas estão livres
- [ ] Transferiu projeto para `/root/app-precos`
- [ ] Executou `docker compose build --no-cache`
- [ ] Executou `docker compose up -d`
- [ ] Verificou status: `docker compose ps`
- [ ] Testou frontend: http://72.61.62.17
- [ ] Testou backend: http://72.61.62.17:3001/api/produtos

---

## ✅ Próximo passo

Quando terminar os passos acima, envie os resultados dos comandos:
```bash
docker ps
docker compose logs
curl http://localhost:3001/api/produtos
```
