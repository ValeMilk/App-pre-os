# Guia de Deploy Docker - App Preços

## 🚀 Arquitetura Docker

O sistema agora roda 100% em containers Docker com:

- **PostgreSQL**: Banco de dados isolado (porta 5433 externa)
- **Backend**: API Node.js + Express (porta 3001)
- **Frontend**: React + Vite + Nginx (porta 80)
- **ETL**: Sincronização automática a cada 10 minutos

## 📋 Pré-requisitos no VPS

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

## 🔧 Deploy Inicial

### 1. Clonar repositório no VPS

```bash
cd /root
git clone <repo-url> app-docker
cd app-docker
```

### 2. Migrar de PM2 para Docker

Se você tem o sistema rodando com PM2:

```bash
chmod +x migrate-to-docker.sh deploy-docker.sh
./migrate-to-docker.sh
```

Isso vai:
- Fazer backup do PostgreSQL atual
- Parar processos PM2
- Liberar portas 80 e 3001

### 3. Deploy com Docker

```bash
./deploy-docker.sh
```

O script vai:
- Parar containers antigos
- Build das imagens
- Subir todos os containers
- Verificar health checks
- Testar endpoints

## 🐳 Comandos Docker Úteis

### Gerenciar containers

```bash
# Ver status
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f etl

# Reiniciar tudo
docker compose restart

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e remover volumes (⚠️ perde dados)
docker compose down -v
```

### Acessar containers

```bash
# Bash no backend
docker exec -it app-precos-backend sh

# Bash no PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions

# Ver tabelas no PostgreSQL
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "\dt"

# Contar registros
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM descontos;"
```

### Rebuild após mudanças no código

```bash
# Pull do git
git pull origin main

# Rebuild e restart
docker compose up -d --build

# Ou rebuild apenas um serviço
docker compose up -d --build backend
```

## 🔄 ETL (Sincronização)

O ETL roda automaticamente a cada 10 minutos via cron dentro do container.

### Ver logs do ETL

```bash
docker compose logs -f etl
```

### Executar ETL manualmente

```bash
docker exec -it app-precos-etl node /app/etl.js
```

### Mudar frequência do cron

Edite o `docker-compose.yml`:

```yaml
etl:
  environment:
    CRON_SCHEDULE: "*/5 * * * *"  # A cada 5 minutos
```

## 🗄️ Backup e Restore do PostgreSQL

### Fazer backup

```bash
docker exec app-precos-postgres pg_dump -U apiuser dbactions > backup.sql
```

### Restaurar backup

```bash
cat backup.sql | docker exec -i app-precos-postgres psql -U apiuser -d dbactions
```

### Backup automático (adicionar ao crontab)

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 3h)
0 3 * * * docker exec app-precos-postgres pg_dump -U apiuser dbactions > /root/backups/app-precos-$(date +\%Y\%m\%d).sql
```

## 🌐 Acessar a aplicação

- **Frontend**: http://72.61.62.17
- **Backend API**: http://72.61.62.17:3001
- **PostgreSQL**: localhost:5433 (apenas internamente)

## 🔐 Segurança

### Mudar senhas do PostgreSQL

1. Edite `docker-compose.yml`:

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: SuaNovaSenha
```

2. Edite as variáveis do backend e ETL também

3. Rebuild:

```bash
docker compose down -v
docker compose up -d
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs backend

# Ver se porta está ocupada
sudo lsof -i :3001
sudo lsof -i :80
```

### PostgreSQL não conecta

```bash
# Verificar se está rodando
docker compose ps postgres

# Ver logs
docker compose logs postgres

# Testar conexão
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT 1;"
```

### ETL não sincroniza

```bash
# Ver logs
docker compose logs etl

# Verificar se tem conexão com SQL Server via VPN
docker exec -it app-precos-etl ping 10.1.0.3
```

### Reset completo

```bash
# Parar tudo e remover volumes
docker compose down -v

# Remover imagens
docker rmi app-precos-backend app-precos-frontend app-precos-etl

# Rebuild from scratch
docker compose up -d --build
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
# CPU e memória de cada container
docker stats

# Espaço em disco
docker system df
```

### Limpar espaço

```bash
# Remover imagens não usadas
docker image prune -a

# Remover volumes não usados
docker volume prune

# Limpeza completa
docker system prune -a --volumes
```

## 🔄 Atualização de Código

### Workflow de atualização

```bash
# 1. Pull do git
cd /root/app-docker
git pull origin main

# 2. Rebuild e restart
docker compose up -d --build

# 3. Verificar logs
docker compose logs -f
```

### Atualização sem downtime

Para atualizações críticas sem parar o serviço:

```bash
# Build nova versão
docker compose build backend

# Criar novo container sem parar o antigo
docker compose up -d --no-deps --build backend

# Verificar se está funcionando
docker compose ps

# Ver logs
docker compose logs backend
```

## 📝 Variáveis de Ambiente

Todas as configurações estão no `docker-compose.yml`:

- **PostgreSQL**: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- **Backend**: PORT, DB_HOST, JWT_SECRET, CORS_ORIGIN
- **Frontend**: VITE_API_URL (build arg)
- **ETL**: SQL_HOST, SQL_USER, PG_HOST, CRON_SCHEDULE

## 🎯 Checklist de Deploy

- [ ] Docker e Docker Compose instalados
- [ ] Portas 80, 3001, 5433 livres
- [ ] VPN conectada (para ETL acessar SQL Server)
- [ ] Git configurado com acesso ao repositório
- [ ] Backup do banco antigo (se PM2)
- [ ] Executar `./deploy-docker.sh`
- [ ] Testar frontend (http://72.61.62.17)
- [ ] Testar backend (http://72.61.62.17:3001/api/produtos)
- [ ] Verificar logs do ETL
- [ ] Configurar backup automático

## 🆘 Suporte

Em caso de problemas:

1. Ver logs: `docker compose logs -f`
2. Verificar status: `docker compose ps`
3. Restart: `docker compose restart`
4. Reset: `docker compose down && docker compose up -d`
