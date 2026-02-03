# ✅ Checklist de Deploy Docker

## Preparação do VPS

- [ ] VPS acessível via SSH (root@72.61.62.17)
- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker compose version`)
- [ ] Portas 80, 3001, 5433 livres
- [ ] VPN configurada (para ETL acessar SQL Server 10.1.0.3)
- [ ] Git instalado e configurado

## Backup (se migrando de PM2)

- [ ] Fazer backup do PostgreSQL atual
  ```bash
  pg_dump -h localhost -U apiuser -d dbactions > backup.sql
  ```
- [ ] Salvar arquivos de configuração (.env, etc)
- [ ] Listar processos PM2 atuais (`pm2 list`)

## Migração

- [ ] Clonar/atualizar repositório
  ```bash
  cd /root
  git clone <repo> app-docker
  cd app-docker
  ```

- [ ] Tornar scripts executáveis
  ```bash
  chmod +x deploy-docker.sh migrate-to-docker.sh
  ```

- [ ] Executar migração (se PM2 ativo)
  ```bash
  ./migrate-to-docker.sh
  ```

- [ ] Executar deploy
  ```bash
  ./deploy-docker.sh
  ```

## Verificação Pós-Deploy

### Containers

- [ ] Verificar status: `docker compose ps`
- [ ] Todos containers com status "Up"
- [ ] PostgreSQL: healthy
- [ ] Backend: healthy
- [ ] Frontend: running
- [ ] ETL: running

### Logs

- [ ] Backend sem erros: `docker compose logs backend`
- [ ] Frontend acessível: `docker compose logs frontend`
- [ ] PostgreSQL iniciado: `docker compose logs postgres`
- [ ] ETL executou primeira vez: `docker compose logs etl`

### Endpoints

- [ ] Frontend acessível: `curl http://72.61.62.17`
- [ ] Backend responde: `curl http://72.61.62.17:3001/api/produtos`
- [ ] PostgreSQL conecta:
  ```bash
  docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT 1;"
  ```

### Dados

- [ ] Produtos carregados:
  ```bash
  docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM produtos;"
  ```
- [ ] Clientes carregados:
  ```bash
  docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM clientes;"
  ```
- [ ] Descontos carregados:
  ```bash
  docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM descontos;"
  ```

### ETL

- [ ] Cron configurado corretamente
- [ ] Primeira sincronização executada
- [ ] Ver log: `docker compose logs etl | tail -50`
- [ ] Aguardar 10 min e verificar nova execução

## Testes Funcionais

### Frontend

- [ ] Acessar http://72.61.62.17
- [ ] Login funcionando
- [ ] Formulário de solicitação carrega
- [ ] Autocomplete de clientes funciona
- [ ] Autocomplete de produtos funciona
- [ ] Cálculo de desconto funciona
- [ ] Envio de solicitação funciona

### Backend

- [ ] GET /api/produtos retorna dados
- [ ] GET /api/clientes retorna dados
- [ ] GET /api/descontos retorna dados
- [ ] POST /api/auth/login funciona
- [ ] CORS configurado corretamente

## Segurança

- [ ] Senhas alteradas para produção
- [ ] JWT_SECRET único e seguro
- [ ] PostgreSQL não exposto externamente (apenas 5433 se necessário)
- [ ] Firewall configurado (80, 3001 abertos)
- [ ] VPN ativa e conectada

## Monitoramento

- [ ] Configurar backup automático:
  ```bash
  # Adicionar ao crontab
  0 3 * * * docker exec app-precos-postgres pg_dump -U apiuser dbactions > /root/backups/app-precos-$(date +\%Y\%m\%d).sql
  ```

- [ ] Testar restart automático:
  ```bash
  docker restart app-precos-backend
  # Aguardar subir novamente
  docker compose ps
  ```

- [ ] Verificar logs periodicamente:
  ```bash
  docker compose logs --tail=100
  ```

## Documentação

- [ ] README.md atualizado
- [ ] DOCKER_DEPLOY_GUIDE.md revisado
- [ ] Senhas documentadas em local seguro
- [ ] IPs e portas documentados
- [ ] Credenciais VPN documentadas

## Contingência

### Rollback para PM2 (se necessário)

```bash
# Parar Docker
docker compose down

# Subir PM2
cd /root/app/backend
pm2 start dist/index.js --name backend-precos

cd /root/app/frontend
pm2 start 'serve -s dist -l 80' --name frontend-precos

pm2 save
pm2 startup
```

### Backup de Emergência

```bash
# Backup completo
docker exec app-precos-postgres pg_dump -U apiuser dbactions > emergency-backup.sql

# Copiar para local
scp root@72.61.62.17:~/emergency-backup.sql ./
```

## ✅ Deploy Completo!

Data: _______________
Responsável: _______________
Versão: _______________

Notas:
_________________________________________________
_________________________________________________
_________________________________________________
