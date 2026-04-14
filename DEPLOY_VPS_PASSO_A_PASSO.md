# 🚀 Deploy na VPS - Guia Passo a Passo

## 📋 Pré-requisitos
- IP da VPS: **72.61.62.17**
- Usuário SSH: root
- Senha: (você deve ter)

---

## PASSO 1️⃣ - Conectar na VPS via SSH

### Opção A: PowerShell (Windows)
```powershell
ssh root@72.61.62.17
```

### Opção B: PuTTY
- Host: 72.61.62.17
- Port: 22
- Username: root

---

## PASSO 2️⃣ - Verificar Portas na VPS

Após conectar via SSH, execute:

```bash
# Verificar portas em uso
netstat -tuln | grep -E ':(80|3001|5433)'

# Ou usar ss (mais moderno)
ss -tuln | grep -E ':(80|3001|5433)'

# Verificar processos nas portas específicas
lsof -i :80
lsof -i :3001
lsof -i :5433
```

**Resultado esperado:** Nenhuma saída (portas livres)

---

## PASSO 3️⃣ - Verificar/Instalar Docker

```bash
# Verificar se Docker está instalado
docker --version
docker-compose --version

# Se NÃO estiver instalado, instalar:
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt update
apt install -y docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Iniciar serviço Docker
systemctl start docker
systemctl enable docker
systemctl status docker
```

---

## PASSO 4️⃣ - Parar Serviços Antigos (Se Existirem)

```bash
# Parar PM2 (se estiver rodando)
pm2 stop all
pm2 delete all

# Liberar portas ocupadas (se necessário)
fuser -k 80/tcp
fuser -k 3001/tcp
fuser -k 5433/tcp

# Remover containers Docker antigos
docker ps -a
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
```

---

## PASSO 5️⃣ - Transferir Projeto para VPS

### Opção A: Via Git (Recomendado)
```bash
# Na VPS:
cd /root
git clone <URL_DO_REPOSITORIO> app-precos
cd app-precos
```

### Opção B: Via SCP (do Windows)
```powershell
# No PowerShell (Windows):
cd "c:\Users\LENOVO 059\Desktop"
scp -r App-pre-os root@72.61.62.17:/root/app-precos
```

---

## PASSO 6️⃣ - Configurar Variáveis de Ambiente

Na VPS, edite o arquivo docker-compose.yml se necessário:

```bash
cd /root/app-precos
nano docker-compose.yml
```

**Verificar:**
- ✅ CORS_ORIGIN: `http://72.61.62.17`
- ✅ VITE_API_URL: `http://72.61.62.17:3001`
- ✅ Credenciais do SQL Server
- ✅ Portas: 80, 3001, 5433

---

## PASSO 7️⃣ - Fazer Deploy com Docker

```bash
cd /root/app-precos

# Opção A: Usar o script pronto
chmod +x deploy-docker.sh
./deploy-docker.sh

# Opção B: Comandos manuais
docker compose down
docker compose build --no-cache
docker compose up -d

# Verificar containers
docker compose ps
docker compose logs -f
```

---

## PASSO 8️⃣ - Verificar Deployment

```bash
# Verificar containers rodando
docker ps

# Verificar logs de cada serviço
docker compose logs postgres
docker compose logs backend
docker compose logs frontend
docker compose logs etl

# Testar endpoints
curl http://localhost:3001/api/produtos
curl http://localhost:80

# Verificar conectividade SQL Server (do ETL)
docker compose logs etl | grep -i "conectado\|sucesso\|erro"
```

---

## PASSO 9️⃣ - Testar Aplicação

### Do navegador (externo):
- Frontend: http://72.61.62.17
- Backend: http://72.61.62.17:3001/api/produtos

### Da VPS (interno):
```bash
curl http://localhost:80
curl http://localhost:3001/api/produtos
```

---

## PASSO 🔟 - Configurar Firewall (Se Necessário)

```bash
# Verificar firewall
ufw status

# Liberar portas necessárias
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # Frontend
ufw allow 3001/tcp  # Backend
ufw enable
ufw status
```

---

## 📊 Comandos Úteis Pós-Deploy

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f etl

# Reiniciar serviços
docker compose restart
docker compose restart backend

# Parar tudo
docker compose down

# Parar e limpar volumes (CUIDADO: apaga dados!)
docker compose down -v

# Ver uso de recursos
docker stats

# Executar comando dentro do container
docker exec -it app-precos-backend sh
docker exec -it app-precos-postgres psql -U apiuser -d dbactions

# Ver banco de dados
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM produtos;"
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM clientes;"
docker exec -it app-precos-postgres psql -U apiuser -d dbactions -c "SELECT COUNT(*) FROM descontos;"
```

---

## ⚠️ Troubleshooting

### Problema: Porta já em uso
```bash
# Identificar processo
lsof -i :80
lsof -i :3001

# Matar processo
kill -9 <PID>
```

### Problema: ETL não conecta ao SQL Server
```bash
# Verificar logs
docker compose logs etl

# Verificar se VPN está ativa
ping 10.1.0.3

# Testar conexão manual
docker exec -it app-precos-etl node /app/test-sql-connection.js
```

### Problema: Backend não conecta ao PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
docker exec -it app-precos-postgres pg_isready -U apiuser

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar PostgreSQL
docker compose restart postgres
```

### Problema: Frontend mostra erro de API
```bash
# Verificar CORS no backend
docker compose logs backend | grep -i cors

# Verificar variável de ambiente no frontend
docker exec -it app-precos-frontend cat /etc/nginx/conf.d/default.conf
```

---

## 🔄 Para Atualizar o Código

```bash
cd /root/app-precos
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📈 Monitoramento

```bash
# Verificar uso de CPU/Memória
docker stats

# Ver processos dentro do container
docker top app-precos-backend
docker top app-precos-postgres

# Disco usado
df -h
docker system df
```

---

## ✅ Checklist Final

- [ ] SSH conectado na VPS
- [ ] Portas 80, 3001, 5433 disponíveis
- [ ] Docker instalado e rodando
- [ ] Projeto transferido para VPS
- [ ] `docker-compose.yml` configurado
- [ ] Containers iniciados com sucesso
- [ ] PostgreSQL saudável
- [ ] Backend respondendo
- [ ] Frontend carregando
- [ ] ETL sincronizando (verificar logs)
- [ ] Firewall configurado
- [ ] Aplicação acessível externamente

---

## 🆘 Suporte

Se algo der errado, envie os logs:
```bash
docker compose logs > /tmp/logs.txt
cat /tmp/logs.txt
```
