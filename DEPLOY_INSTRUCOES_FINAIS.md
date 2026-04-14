# ✅ DEPLOY CONFIRMADO - Portas Identificadas

## 📊 Análise de Portas - VPS 72.61.62.17

### ❌ PORTAS OCUPADAS (NÃO USAR)
```
3001   → cometa-backend
5433   → warehouse_postgres
5434   → bi_cometa_db
3000   → valemilk_app
5000   → attendance-backend
5551   → attendance-backend
4000   → valefish-backend
5888   → cis-backend
8000   → bi_cometa_api
8001   → warehouse_airflow_scheduler
8081   → warehouse_airflow_webserver
8082   → cometa-frontend
8085   → central-de-app
8881   → attendance-frontend
8886   → cis-frontend
8888   → valefish-frontend
```

### ✅ PORTAS LIVRES (DISPONÍVEIS)
```
8080   ✅ LIVRE
8443   ✅ LIVRE
5000   ✅ LIVRE
9000   ✅ LIVRE
9001   ✅ LIVRE
9002   ✅ LIVRE
```

---

## 🎯 CONFIGURAÇÃO RECOMENDADA PARA APP PREÇOS

```
Frontend   → Porta 9000
Backend    → Porta 9001
PostgreSQL → Porta 9002
```

**Acesso:** `http://72.61.62.17:9000`

---

## 🚀 PASSO A PASSO - DEPLOY SEGURO

### PASSO 1️⃣ - Transferir Projeto para VPS

No **Windows PowerShell**:

```powershell
cd "c:\Users\LENOVO 059\Desktop"

# Criar novo diretório para App Preços
ssh root@72.61.62.17 "mkdir -p /root/app-precos"

# Transferir projeto
scp -r App-pre-os\* root@72.61.62.17:/root/app-precos/
```

### PASSO 2️⃣ - Usar arquivos de configuração personalizados

Na **VPS**:

```bash
cd /root/app-precos

# O arquivo docker-compose.yml já está configurado com:
# - Frontend: 9000
# - Backend: 9001
# - PostgreSQL: 9002

# Se ainda não tem, crie com este conteúdo:
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: app-precos-postgres
    restart: unless-stopped
    ports:
      - "9002:5432"
    environment:
      POSTGRES_DB: dbactions
      POSTGRES_USER: apiuser
      POSTGRES_PASSWORD: Postgres@2026!
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U apiuser -d dbactions"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: app-precos-backend
    restart: unless-stopped
    ports:
      - "9001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: dbactions
      DB_USER: apiuser
      DB_PASSWORD: Postgres@2026!
      JWT_SECRET: valemilk_jwt_secret_2026
      CORS_ORIGIN: http://72.61.62.17:9000
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/produtos"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://72.61.62.17:9001
    container_name: app-precos-frontend
    restart: unless-stopped
    ports:
      - "9000:80"
    depends_on:
      - backend
    networks:
      - app-network

  etl:
    build:
      context: ./backend
      dockerfile: Dockerfile.etl
    container_name: app-precos-etl
    restart: unless-stopped
    environment:
      SQL_HOST: 10.1.0.3\\SQLSTANDARD
      SQL_USER: analistarpt
      SQL_PASSWORD: mM=DU9lUd3C$qb@
      SQL_DATABASE: dbactions
      PG_HOST: postgres
      PG_PORT: 5432
      PG_DATABASE: dbactions
      PG_USER: apiuser
      PG_PASSWORD: Postgres@2026!
      CRON_SCHEDULE: "*/10 * * * *"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
EOF
```

### PASSO 3️⃣ - Build das Imagens

Na **VPS**:

```bash
cd /root/app-precos
docker compose build --no-cache
```

### PASSO 4️⃣ - Iniciar Containers

Na **VPS**:

```bash
# Iniciar em background
docker compose up -d

# Aguardar 15 segundos
sleep 15

# Ver status
docker compose ps

# Ver logs
docker compose logs --tail=50
```

### PASSO 5️⃣ - Testar na VPS

Na **VPS**:

```bash
# Testar backend
curl http://localhost:9001/api/produtos

# Ver logs do frontend
docker compose logs frontend

# Ver logs do backend
docker compose logs backend

# Ver logs do PostgreSQL
docker compose logs postgres
```

### PASSO 6️⃣ - Acessar no navegador

Do **Windows** (navegador):

```
http://72.61.62.17:9000
```

---

## 🔍 Verificar Status Completo

Na **VPS**:

```bash
# Status dos containers App Preços
docker compose ps

# Logs completos
docker compose logs

# Verificar banco de dados
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM produtos;"

# Verificar se backend está respondendo
docker exec -it app-precos-backend curl http://localhost:3001/api/produtos

# Ver ETL
docker compose logs etl | tail -20
```

---

## 🆘 Se algo não funcionar

### Backend com erro
```bash
docker compose logs backend
docker compose restart backend
```

### PostgreSQL com erro
```bash
docker compose logs postgres
docker compose restart postgres
```

### Frontend não carrega
```bash
docker compose logs frontend
```

### ETL não sincroniza
```bash
docker compose logs etl
```

---

## 📋 Checklist Final

- [ ] Projeto transferido: `/root/app-precos`
- [ ] docker-compose.yml com portas 9000/9001/9002
- [ ] `docker compose build --no-cache` executado
- [ ] `docker compose up -d` executado
- [ ] `docker compose ps` mostra 4 containers (postgres, backend, frontend, etl)
- [ ] Frontend responde: http://72.61.62.17:9000
- [ ] Backend responde: curl http://localhost:9001/api/produtos
- [ ] PostgreSQL respondendo: docker exec ... pg_isready
- [ ] ETL rodando: docker compose logs etl

---

## 🎯 URLs de Acesso

| Serviço | URL | Notas |
|---------|-----|-------|
| Frontend | http://72.61.62.17:9000 | App principal |
| Backend API | http://72.61.62.17:9001/api/produtos | Produtos |
| Backend API | http://72.61.62.17:9001/api/clientes | Clientes |
| PostgreSQL | localhost:9002 | Apenas na VPS |

---

## 📝 Comandos Úteis

```bash
# Logs em tempo real
docker compose logs -f

# Logs de um serviço
docker compose logs -f backend

# Reiniciar
docker compose restart

# Parar
docker compose stop

# Remover (CUIDADO: apaga dados!)
docker compose down

# Remover com volumes (CUIDADO: apaga tudo!)
docker compose down -v

# Rebuild completo
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## ⚡ Próximas Ações

1. **Copie o arquivo docker-compose.yml** para VPS
2. **Execute o build:** `docker compose build --no-cache`
3. **Inicie:** `docker compose up -d`
4. **Teste:** http://72.61.62.17:9000

**Quer que eu prepare um script automático para executar tudo de uma vez?** 🚀
