# 🐳 Guia Docker - App Preços

## 📋 Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado (Windows/Mac/Linux)
- Git instalado (opcional, para versionamento)

## 🚀 Início Rápido

### 1. Produção (Build otimizado)

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

**Acessar a aplicação:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### 2. Desenvolvimento (Hot reload)

```bash
# Iniciar em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Parar
docker-compose -f docker-compose.dev.yml down
```

**Acessar em desenvolvimento:**
- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

## 📦 Estrutura de Containers

```
┌─────────────────────────────────────────────┐
│           App Preços - Docker               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Frontend   │  │   Backend    │        │
│  │  React+Vite  │◄─┤  Node.js API │        │
│  │   (Nginx)    │  │   Express    │        │
│  │   :3000      │  │    :5000     │        │
│  └──────────────┘  └──────┬───────┘        │
│                            │                │
│                    ┌───────▼───────┐        │
│                    │    MongoDB    │        │
│                    │   Database    │        │
│                    │    :27017     │        │
│                    └───────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔧 Comandos Úteis

### Gerenciar Containers

```bash
# Listar containers em execução
docker ps

# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Reiniciar um serviço específico
docker-compose restart backend

# Parar e remover tudo (incluindo volumes)
docker-compose down -v
```

### Build e Rebuild

```bash
# Rebuild sem cache (force rebuild)
docker-compose build --no-cache

# Rebuild e iniciar
docker-compose up --build

# Rebuild apenas um serviço
docker-compose build backend
```

### Acessar Container

```bash
# Entrar no backend
docker exec -it app-precos-backend sh

# Entrar no MongoDB
docker exec -it app-precos-mongodb mongosh -u admin -p senha_segura_123

# Ver logs em tempo real
docker-compose logs -f backend
```

### Gerenciar Volumes

```bash
# Listar volumes
docker volume ls

# Remover volume específico
docker volume rm app-precos_mongodb_data

# Backup do MongoDB
docker exec app-precos-mongodb mongodump --out /backup

# Limpar volumes não utilizados
docker volume prune
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:senha_segura_123@mongodb:27017/price_requests?authSource=admin
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_2024
CORS_ORIGIN=http://localhost:3000

# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=senha_segura_123
MONGO_INITDB_DATABASE=price_requests

# Frontend
VITE_API_URL=http://localhost:5000
```

**⚠️ IMPORTANTE:** Altere as senhas antes de usar em produção!

## 📊 Monitoramento

### Health Checks

O Docker monitora automaticamente a saúde dos serviços:

```bash
# Ver status de saúde
docker ps --format "table {{.Names}}\t{{.Status}}"

# Logs de health check
docker inspect app-precos-backend | grep -A 10 Health
```

### Recursos

```bash
# Ver uso de recursos
docker stats

# Ver uso de um container específico
docker stats app-precos-backend
```

## 🐛 Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar se porta está ocupada
netstat -ano | findstr :5000

# Rebuild forçado
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Problema: MongoDB não conecta

```bash
# Verificar se MongoDB está rodando
docker ps | findstr mongodb

# Testar conexão
docker exec -it app-precos-mongodb mongosh -u admin -p senha_segura_123

# Recriar volume do MongoDB
docker-compose down -v
docker-compose up mongodb
```

### Problema: Erros de permissão

```bash
# No Windows, executar como Administrador
# Ou adicionar seu usuário ao grupo docker-users
```

### Limpar tudo e recomeçar

```bash
# Parar todos os containers
docker-compose down -v

# Remover imagens não utilizadas
docker image prune -a

# Rebuild completo
docker-compose build --no-cache
docker-compose up
```

## 🚢 Deploy em Produção

### Railway (Backend + MongoDB)

1. Criar conta no [Railway](https://railway.app)
2. Conectar repositório GitHub
3. Railway detecta `Dockerfile` automaticamente
4. Adicionar MongoDB: `+ New` → `Database` → `MongoDB`
5. Configurar variáveis de ambiente

### Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Ou conectar via GitHub no dashboard do Vercel
```

### Docker Hub (Opcional)

```bash
# Login no Docker Hub
docker login

# Tag das imagens
docker tag app-precos-backend:latest seuusuario/app-precos-backend:latest
docker tag app-precos-frontend:latest seuusuario/app-precos-frontend:latest

# Push
docker push seuusuario/app-precos-backend:latest
docker push seuusuario/app-precos-frontend:latest
```

## 📝 Scripts NPM (Adicionar ao package.json raiz)

```json
{
  "scripts": {
    "docker:prod": "docker-compose up",
    "docker:prod:build": "docker-compose up --build",
    "docker:prod:down": "docker-compose down",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:dev:down": "docker-compose -f docker-compose.dev.yml down",
    "docker:clean": "docker-compose down -v && docker system prune -f",
    "docker:logs": "docker-compose logs -f",
    "docker:backend": "docker-compose logs -f backend",
    "docker:frontend": "docker-compose logs -f frontend"
  }
}
```

Uso:

```bash
npm run docker:prod        # Iniciar produção
npm run docker:dev         # Iniciar desenvolvimento
npm run docker:clean       # Limpar tudo
npm run docker:logs        # Ver logs
```

## 🎯 Boas Práticas

### 1. Segurança
- ✅ Use secrets do Docker para senhas
- ✅ Não commite `.env` no Git
- ✅ Altere senhas padrão antes de produção
- ✅ Use HTTPS em produção

### 2. Performance
- ✅ Use multi-stage builds (já configurado)
- ✅ Minimize camadas no Dockerfile
- ✅ Use `.dockerignore` para excluir arquivos desnecessários
- ✅ Cache de dependências Node.js (já configurado)

### 3. Manutenção
- ✅ Faça backup regular do MongoDB
- ✅ Monitore logs em produção
- ✅ Use health checks (já configurado)
- ✅ Atualize imagens base regularmente

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## 🆘 Suporte

Problemas ou dúvidas? Verifique:
1. Logs: `docker-compose logs -f`
2. Status: `docker ps`
3. Recursos: `docker stats`
4. Este guia: procure na seção Troubleshooting

---

**🎉 Pronto!** Sua aplicação está dockerizada e pronta para rodar em qualquer ambiente!
