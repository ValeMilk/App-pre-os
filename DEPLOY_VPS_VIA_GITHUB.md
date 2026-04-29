# 🚀 DEPLOY NA VPS - Via GitHub (vps-test)

## ⚡ OPÇÃO A: Puxar do GitHub (Recomendado)

### PASSO 1️⃣ - Conectar na VPS

```powershell
# No Windows PowerShell:
ssh root@72.61.62.17
```

Você verá: `root@srv1160641:~#`

---

### PASSO 2️⃣ - Clonar ou Atualizar Repositório (VPS)

**Se é primeira vez:**
```bash
cd /root
git clone https://github.com/ValeMilk/App-pre-os.git app-precos
cd app-precos
git checkout vps-test
```

**Se já tem o repositório:**
```bash
cd /root/app-precos
git fetch origin
git checkout vps-test
git pull origin vps-test
```

---

### PASSO 3️⃣ - Verificar (VPS)

```bash
# Verificar branch
git branch

# Ver últimos commits
git log --oneline -5

# Verificar arquivos
ls -la docker-compose.yml
ls -la deploy-agora.sh
```

---

### PASSO 4️⃣ - Build (VPS)

```bash
cd /root/app-precos
docker compose build --no-cache
```

⏳ Aguarde 10-15 minutos

---

### PASSO 5️⃣ - Iniciar (VPS)

```bash
docker compose up -d
sleep 15
docker compose ps
```

---

### PASSO 6️⃣ - Testar (VPS)

```bash
# Status
docker compose ps

# Logs
docker compose logs --tail=20

# Backend
curl http://localhost:9001/api/produtos

# PostgreSQL
docker exec -it app-precos-postgres pg_isready -U apiuser
```

---

### PASSO 7️⃣ - Acessar (Windows Navegador)

```
http://72.61.62.17:9000
```

---

## ⚡ OPÇÃO B: Script Automático (Ultra Rápido)

Se preferir tudo de uma vez (VPS):

```bash
cd /root/app-precos && \
git fetch origin && \
git checkout vps-test && \
git pull origin vps-test && \
docker compose down 2>/dev/null || true && \
docker compose build --no-cache && \
docker compose up -d && \
sleep 15 && \
docker compose ps
```

---

## 📋 Resumo do que vai acontecer

```
1. Clone/Pull do GitHub (branch vps-test)
   ↓
2. Build das imagens Docker:
   - Frontend (React + Nginx) → porta 9000
   - Backend (Node.js + Express) → porta 9001
   - PostgreSQL → porta 9002
   - ETL (sincronização SQL Server)
   ↓
3. Containers iniciam
   ↓
4. ✅ App Preços rodando!
   http://72.61.62.17:9000
```

---

## ✅ Checklist Final

- [ ] SSH conectado na VPS
- [ ] Repositório clonado/atualizado da branch vps-test
- [ ] Git log mostra último commit (d073937)
- [ ] docker-compose.yml presente
- [ ] `docker compose build --no-cache` executado com sucesso
- [ ] `docker compose up -d` executado
- [ ] `docker compose ps` mostra 4 containers verde
- [ ] Frontend carrega em http://72.61.62.17:9000
- [ ] Backend responde em http://72.61.62.17:9001/api/produtos
- [ ] PostgreSQL respondendo

---

## 🆘 Troubleshooting

### Container falha
```bash
docker compose logs
docker compose restart
```

### Precisa de rebuild
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Verificar branch certa
```bash
git branch
git log --oneline -1
```

---

Quer que eu execute os passos para você? 🚀
