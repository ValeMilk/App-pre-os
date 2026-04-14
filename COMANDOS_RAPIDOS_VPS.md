# 🚀 COMANDOS RÁPIDOS - Deploy VPS

## 1️⃣ CONECTAR NA VPS
```bash
ssh root@72.61.62.17
```

## 2️⃣ VERIFICAR PORTAS
```bash
# Copiar e colar tudo de uma vez:
cat > /tmp/check-ports.sh << 'EOF'
#!/bin/bash
echo "Verificando portas 80, 3001, 5433..."
for port in 80 3001 5433; do
    if netstat -tuln | grep -q ":$port "; then
        echo "❌ Porta $port: EM USO"
        lsof -i :$port 2>/dev/null || true
    else
        echo "✅ Porta $port: DISPONÍVEL"
    fi
done
EOF

chmod +x /tmp/check-ports.sh
/tmp/check-ports.sh
```

## 3️⃣ INSTALAR DOCKER (se necessário)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt update && apt install -y docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Verificar
docker --version
docker compose version
```

## 4️⃣ TRANSFERIR PROJETO

### Opção A: Git (Recomendado)
```bash
cd /root
git clone <URL_DO_SEU_REPOSITORIO> app-precos
cd app-precos
```

### Opção B: SCP (do Windows PowerShell)
```powershell
cd "c:\Users\LENOVO 059\Desktop"
scp -r App-pre-os root@72.61.62.17:/root/app-precos
```

## 5️⃣ LIBERAR PORTAS (se estiverem ocupadas)
```bash
# Parar PM2
pm2 stop all
pm2 delete all

# Matar processos nas portas
fuser -k 80/tcp
fuser -k 3001/tcp
fuser -k 5433/tcp

# Parar containers antigos
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
```

## 6️⃣ FAZER DEPLOY
```bash
cd /root/app-precos

# Build e iniciar
docker compose down
docker compose build --no-cache
docker compose up -d

# Aguardar 10 segundos
sleep 10

# Verificar status
docker compose ps
```

## 7️⃣ TESTAR
```bash
# Ver logs
docker compose logs -f

# Testar backend
curl http://localhost:3001/api/produtos

# Testar frontend
curl http://localhost:80

# Ver logs do ETL
docker compose logs etl | tail -50
```

## 8️⃣ ACESSAR NO NAVEGADOR
- Frontend: http://72.61.62.17
- Backend: http://72.61.62.17:3001/api/produtos

## 🔧 COMANDOS ÚTEIS
```bash
# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço
docker compose logs -f backend
docker compose logs -f etl

# Reiniciar
docker compose restart

# Parar
docker compose down

# Ver uso de recursos
docker stats

# Acessar banco
docker exec -it app-precos-postgres psql -U apiuser -d dbactions

# Ver dados
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM produtos;"
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM clientes;"
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM descontos;"
```

## 🆘 TROUBLESHOOTING
```bash
# Porta ocupada
lsof -i :80
kill -9 <PID>

# Container com erro
docker compose logs backend
docker compose restart backend

# Limpar tudo e recomeçar
docker compose down -v
docker system prune -a
docker compose up -d --build
```

## 📊 VERIFICAR TUDO ESTÁ OK
```bash
# Status containers
docker ps

# Health checks
docker inspect app-precos-postgres | grep -i health
docker inspect app-precos-backend | grep -i health

# Consumo de recursos
docker stats --no-stream

# Espaço em disco
df -h
docker system df
```
