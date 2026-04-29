# 🚀 DEPLOY AGORA - VPS (Branch vps-test)

## 📋 COMANDO ÚNICO (Copie e Cole NA VPS)

```bash
cd /root && \
([ -d app-precos ] && cd app-precos && git fetch origin && git checkout vps-test && git pull origin vps-test) || (git clone -b vps-test https://github.com/ValeMilk/App-pre-os.git app-precos && cd app-precos) && \
echo "" && \
echo "🔧 Limpando containers antigos..." && \
docker compose down 2>/dev/null || true && \
echo "" && \
echo "🏗️ Building Docker images (aguarde 10-15 min)..." && \
docker compose build --no-cache && \
echo "" && \
echo "🚀 Iniciando containers..." && \
docker compose up -d && \
echo "" && \
echo "⏳ Aguardando 15 segundos..." && \
sleep 15 && \
echo "" && \
echo "════════════════════════════════════════════════════════" && \
echo "✅ DEPLOY CONCLUÍDO!" && \
echo "════════════════════════════════════════════════════════" && \
echo "" && \
echo "📊 Status:" && \
docker compose ps && \
echo "" && \
echo "🌐 Acesse em seu navegador:" && \
echo "   http://72.61.62.17:9000" && \
echo "" && \
echo "🔍 Verificação:" && \
echo "   Backend: curl http://localhost:9001/api/produtos" && \
echo "   PostgreSQL: docker exec -it app-precos-postgres pg_isready -U apiuser" && \
echo "" && \
echo "📋 Logs completos:" && \
docker compose logs
```

---

## 📝 PASSO A PASSO

### 1️⃣ Conectar na VPS (Windows PowerShell)
```powershell
ssh root@72.61.62.17
```

### 2️⃣ Colar o comando em uma linha (VPS)
```bash
# Cole TUDO de uma vez (o comando acima)
```

### 3️⃣ Aguardar
- ⏳ Git pull: **1-2 min**
- 🏗️ Build: **10-15 min**
- 🚀 Iniciar: **1 min**

### 4️⃣ Ver resultado
Verá output mostrando:
```
app-precos-postgres    Up 20 seconds     0.0.0.0:9002->5432/tcp
app-precos-backend     Up 18 seconds     0.0.0.0:9001->3001/tcp
app-precos-frontend    Up 16 seconds     0.0.0.0:9000->80/tcp
app-precos-etl         Up 10 seconds
```

### 5️⃣ Acessar no navegador
```
http://72.61.62.17:9000
```

---

## ✅ Pronto!

Se vir a tela de login, está **100% funcionando**! ✅

---

## 🆘 Se algo não funcionar

### Verificar logs
```bash
cd /root/app-precos
docker compose logs
```

### Reiniciar
```bash
docker compose restart
```

### Rebuild completo
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 📊 Verificações Rápidas

```bash
# Ver containers
docker compose ps

# Ver logs de um serviço
docker compose logs frontend
docker compose logs backend
docker compose logs postgres

# Testar backend
curl http://localhost:9001/api/produtos | head -c 200

# Testar PostgreSQL
docker exec -it app-precos-postgres pg_isready -U apiuser
```

---

**Vamos lá! Cole o comando acima na VPS e aguarde!** 🚀
