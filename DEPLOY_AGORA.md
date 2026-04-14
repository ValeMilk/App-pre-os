# 🚀 DEPLOY NA VPS - AÇÃO IMEDIATA

## ⚡ RESUMO (Para você lembrar)

```
Portas: Frontend 9000 | Backend 9001 | PostgreSQL 9002
Acesso: http://72.61.62.17:9000
```

---

## 🎯 PASSO 1️⃣ - Transferir Projeto (NO WINDOWS POWERSHELL)

Abra PowerShell e execute:

```powershell
cd "c:\Users\LENOVO 059\Desktop"
scp -r App-pre-os\* root@72.61.62.17:/root/app-precos/
```

**Aguarde até terminar** (pode levar 2-5 minutos)

---

## 🎯 PASSO 2️⃣ - Conectar na VPS (PowerShell)

```powershell
ssh root@72.61.62.17
```

Você verá `root@srv1160641:~#`

---

## 🎯 PASSO 3️⃣ - Ir para pasta do projeto (VPS)

```bash
cd /root/app-precos
ls -la docker-compose.yml
```

Deve retornar: `-rw-r--r-- ... docker-compose.yml`

---

## 🎯 PASSO 4️⃣ - Build (VPS)

```bash
docker compose build --no-cache
```

⏳ **Isso vai levar 10-15 minutos** - deixe rodar!

Verá muitas linhas de output tipo:
```
Step 1/10 : FROM node:18-alpine
Step 2/10 : WORKDIR /app
...
Successfully built xxx
Successfully tagged app-precos-backend:latest
```

---

## 🎯 PASSO 5️⃣ - Iniciar Containers (VPS)

```bash
docker compose up -d
```

Verá:
```
Creating network app-network
Creating volume app-precos_postgres_data
Creating app-precos-postgres ... done
Creating app-precos-backend ... done
Creating app-precos-frontend ... done
Creating app-precos-etl ... done
```

---

## 🎯 PASSO 6️⃣ - Verificar Status (VPS)

```bash
docker compose ps
```

Verá algo como:
```
NAME                    STATUS           PORTS
app-precos-postgres     Up 10 seconds     0.0.0.0:9002->5432/tcp
app-precos-backend      Up 8 seconds      0.0.0.0:9001->3001/tcp
app-precos-frontend     Up 6 seconds      0.0.0.0:9000->80/tcp
app-precos-etl          Up 4 seconds
```

Se todos forem `Up`, é sucesso! ✅

---

## 🎯 PASSO 7️⃣ - Ver Logs (VPS)

```bash
docker compose logs -f
```

Aguarde 20 segundos e procure por:
- `✅ Server running on port 3001` (backend OK)
- `LISTEN 0.0.0.0:5432` (PostgreSQL OK)
- Sem erros vermelhos

Pressione `Ctrl+C` para sair

---

## 🎯 PASSO 8️⃣ - Testar no Navegador

Abra no **Windows** (seu navegador):

```
http://72.61.62.17:9000
```

Você verá a tela de login do App Preços! ✅

---

## 📋 Checklist Rápido

```bash
# Tudo de uma vez para testar:
echo "1️⃣ Docker PS:"; docker compose ps; \
echo ""; \
echo "2️⃣ Backend:"; curl http://localhost:9001/api/produtos | head -c 100; \
echo ""; \
echo "3️⃣ PostgreSQL:"; docker exec -it app-precos-postgres pg_isready -U apiuser; \
echo ""; \
echo "✅ Tudo OK se não há erros acima"
```

---

## 🆘 Se algo der erro

### ❌ "Connection refused" na VPS
```bash
# Espere mais 1-2 minutos e tente de novo
sleep 30
docker compose logs -f
```

### ❌ Container com Exited
```bash
docker compose logs
docker compose restart
```

### ❌ Frontend mostra erro
```bash
docker compose logs frontend
```

### ❌ Backend não responde
```bash
docker compose logs backend
docker compose restart backend
```

---

## ✅ QUANDO PRONTO

Você terá:
- ✅ App Preços rodando na porta 9000
- ✅ Backend na porta 9001
- ✅ PostgreSQL na porta 9002
- ✅ ETL sincronizando a cada 10 min
- ✅ Nenhuma app existente afetada

---

## 🎯 URL FINAL

```
http://72.61.62.17:9000
```

**Credenciais padrão (se existirem):**
- User: vendedor@valemilk.com
- Ou configure em Admin Panel

---

## 📞 Próximo Passo

**Execute os passos 1-8 acima e me envie:**

```bash
# Copie e rode tudo de uma vez:
echo "=== DOCKER PS ===" && docker compose ps && \
echo "" && \
echo "=== LOGS (primeiros 30 linhas) ===" && docker compose logs --tail=30 && \
echo "" && \
echo "=== TESTE BACKEND ===" && curl http://localhost:9001/api/produtos && \
echo "" && \
echo "✅ PRONTO!"
```

**Quando terminar, me envie o resultado!** 🚀
