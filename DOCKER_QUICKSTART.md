# 🚀 Quick Start - Docker

## Desenvolvimento Local

```bash
# 1. Build dos containers
docker compose build

# 2. Subir tudo
docker compose up -d

# 3. Ver logs
docker compose logs -f

# 4. Acessar
# Frontend: http://localhost
# Backend: http://localhost:3001
```

## Deploy no VPS

```bash
# SSH no VPS
ssh root@72.61.62.17

# Clone ou pull
cd /root/app-docker
git pull origin main

# Migrar de PM2 (primeira vez)
./migrate-to-docker.sh

# Deploy
./deploy-docker.sh

# Acessar
# Frontend: http://72.61.62.17
# Backend: http://72.61.62.17:3001
```

## Comandos Rápidos

```bash
# Ver status
docker compose ps

# Logs em tempo real
docker compose logs -f

# Restart
docker compose restart

# Parar tudo
docker compose down

# Rebuild após mudanças
docker compose up -d --build

# Acessar PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions

# Ver logs do ETL
docker compose logs etl

# Executar ETL manualmente
docker exec -it app-precos-etl node /app/etl.js
```

## Troubleshooting

```bash
# Container não inicia?
docker compose logs <nome-do-servico>

# Porta ocupada?
sudo lsof -i :80
sudo lsof -i :3001

# Reset completo
docker compose down -v
docker compose up -d --build
```

## Mais Detalhes

Veja [DOCKER_DEPLOY_GUIDE.md](DOCKER_DEPLOY_GUIDE.md) para documentação completa.
