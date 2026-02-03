# 🛠️ Comandos Úteis - Docker

## Gerenciamento Básico

```bash
# Ver todos os containers
docker compose ps

# Ver logs em tempo real (todos)
docker compose logs -f

# Ver logs de um serviço
docker compose logs -f backend
docker compose logs -f etl

# Reiniciar tudo
docker compose restart

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e remover volumes (⚠️ perde dados!)
docker compose down -v
```

## Build e Deploy

```bash
# Rebuild completo
docker compose build --no-cache
docker compose up -d

# Rebuild de um serviço
docker compose build backend
docker compose up -d backend

# Pull e deploy rápido
git pull origin main && docker compose up -d --build
```

## Acessar Containers

```bash
# Backend shell
docker exec -it app-precos-backend sh

# PostgreSQL psql
docker exec -it app-precos-postgres psql -U apiuser -d dbactions

# ETL shell
docker exec -it app-precos-etl sh

# Ver arquivos do frontend
docker exec -it app-precos-frontend ls -la /usr/share/nginx/html
```

## PostgreSQL

### Consultas Rápidas

```bash
# Contar produtos
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM produtos;"

# Contar clientes
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM clientes;"

# Contar descontos
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM descontos;"

# Listar tabelas
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "\dt"

# Ver últimos 10 produtos
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT * FROM produtos LIMIT 10;"

# Verificar descontos por tipo
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT tipo_desconto, COUNT(*) FROM descontos GROUP BY tipo_desconto;"

# Ver cliente específico
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT * FROM clientes WHERE a00_fantasia LIKE '%POPULAR%';"
```

### Backup e Restore

```bash
# Backup
docker exec app-precos-postgres pg_dump -U apiuser dbactions > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker exec -i app-precos-postgres psql -U apiuser -d dbactions

# Backup compactado
docker exec app-precos-postgres pg_dump -U apiuser dbactions | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore compactado
gunzip -c backup.sql.gz | docker exec -i app-precos-postgres psql -U apiuser -d dbactions
```

## ETL

```bash
# Ver logs do ETL
docker compose logs etl

# Executar ETL manualmente
docker exec -it app-precos-etl node /app/etl.js

# Ver última execução
docker compose logs etl | tail -50

# Ver cron schedule
docker exec -it app-precos-etl cat /etc/crontabs/root

# Ver log do cron
docker exec -it app-precos-etl cat /var/log/etl.log
```

## Monitoramento

```bash
# Uso de recursos (CPU, RAM)
docker stats

# Espaço em disco
docker system df

# Ver portas abertas
docker compose ps --format "table {{.Service}}\t{{.Ports}}"

# Health checks
docker inspect app-precos-backend | grep -A 10 "Health"
docker inspect app-precos-postgres | grep -A 10 "Health"
```

## Debug

```bash
# Ver variáveis de ambiente
docker exec -it app-precos-backend env

# Testar conectividade entre containers
docker exec -it app-precos-backend ping postgres
docker exec -it app-precos-etl ping postgres

# Ver logs detalhados (últimas 100 linhas)
docker compose logs --tail=100

# Seguir logs com timestamp
docker compose logs -f --timestamps

# Ver apenas erros
docker compose logs | grep -i error
docker compose logs | grep -i failed
```

## Rede

```bash
# Ver redes Docker
docker network ls

# Inspecionar rede da aplicação
docker network inspect app-precos_app-network

# Listar IPs dos containers
docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)

# Testar conexão HTTP
docker exec -it app-precos-backend wget -O- http://postgres:5432 || echo "Porta fechada"
docker exec -it app-precos-backend wget -O- http://backend:3001/api/produtos
```

## Volumes

```bash
# Listar volumes
docker volume ls

# Inspecionar volume do PostgreSQL
docker volume inspect app-precos_postgres_data

# Backup do volume PostgreSQL
docker run --rm -v app-precos_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-volume-backup.tar.gz -C /data .

# Restore do volume PostgreSQL
docker run --rm -v app-precos_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-volume-backup.tar.gz -C /data
```

## Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não usadas
docker image prune -a

# Remover volumes não usados
docker volume prune

# Limpeza completa (⚠️ cuidado!)
docker system prune -a --volumes

# Ver espaço liberado
docker system df
```

## Troubleshooting

```bash
# Container não inicia?
docker compose logs <servico>
docker inspect <container-id>

# Porta já em uso?
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :5433

# Matar processo na porta
sudo kill -9 $(sudo lsof -t -i:80)

# Verificar se PostgreSQL está respondendo
docker exec -it app-precos-postgres pg_isready -U apiuser

# Testar query no PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT version();"

# Rebuild forçado (sem cache)
docker compose build --no-cache <servico>
docker compose up -d <servico>

# Reset completo
docker compose down -v
docker system prune -a --volumes
docker compose up -d --build
```

## Performance

```bash
# Ver tempo de resposta do backend
time curl http://localhost:3001/api/produtos

# Ver tamanho das imagens
docker images | grep app-precos

# Otimizar imagens (rebuild com cache)
docker compose build --parallel

# Ver logs de performance do PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

## Atualização de Código

```bash
# Workflow completo de atualização
git pull origin main
docker compose build
docker compose up -d
docker compose logs -f

# Atualização sem downtime (zero-downtime)
docker compose build backend
docker compose up -d --no-deps backend
docker compose ps

# Rollback rápido
git checkout HEAD~1
docker compose up -d --build
```

## Segurança

```bash
# Ver processos rodando nos containers
docker exec -it app-precos-backend ps aux

# Verificar usuário do processo
docker exec -it app-precos-backend whoami

# Scan de vulnerabilidades
docker scan app-precos-backend

# Atualizar imagens base
docker compose pull
docker compose up -d --build
```

## Scripts Personalizados

### Backup Automático

```bash
#!/bin/bash
# backup-daily.sh
DATE=$(date +%Y%m%d)
docker exec app-precos-postgres pg_dump -U apiuser dbactions | gzip > /root/backups/app-precos-$DATE.sql.gz
find /root/backups -name "app-precos-*.sql.gz" -mtime +7 -delete
```

### Health Check

```bash
#!/bin/bash
# health-check.sh
curl -f http://localhost:3001/api/produtos > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Backend down! Restarting..."
    docker compose restart backend
fi
```

### Status Report

```bash
#!/bin/bash
# status-report.sh
echo "=== Docker Status ==="
docker compose ps
echo -e "\n=== Resource Usage ==="
docker stats --no-stream
echo -e "\n=== Disk Usage ==="
docker system df
echo -e "\n=== Recent Errors ==="
docker compose logs --tail=50 | grep -i error
```

## Aliases Úteis

Adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
# Docker Compose shortcuts
alias dc='docker compose'
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
alias dcps='docker compose ps'
alias dclogs='docker compose logs -f'
alias dcrestart='docker compose restart'
alias dcbuild='docker compose build'

# App Preços específicos
alias precos-logs='docker compose logs -f'
alias precos-backend='docker exec -it app-precos-backend sh'
alias precos-db='docker exec -it app-precos-postgres psql -U apiuser -d dbactions'
alias precos-etl='docker compose logs etl | tail -50'
alias precos-restart='docker compose restart'
alias precos-status='docker compose ps && docker stats --no-stream'
```

Use: `source ~/.bashrc` para carregar os aliases
