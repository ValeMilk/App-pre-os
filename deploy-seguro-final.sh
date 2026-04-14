#!/bin/bash

# ==========================================
# 🚀 DEPLOY AUTOMÁTICO - APP PREÇOS
# ==========================================
# Portas: Frontend 9000 | Backend 9001 | PostgreSQL 9002
# Sem afetar outras aplicações

set -e

clear

echo "════════════════════════════════════════════════════════"
echo "  🚀 DEPLOY APP PREÇOS - CONFIGURAÇÃO SEGURA"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Portas a usar:"
echo "  Frontend   → 9000"
echo "  Backend    → 9001"
echo "  PostgreSQL → 9002"
echo ""
echo "Acesso: http://72.61.62.17:9000"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==========================================
# PASSO 1: Verificar diretório
# ==========================================
echo -e "${BLUE}📍 PASSO 1 - Verificando projeto...${NC}"
echo ""

if [ ! -d "/root/app-precos" ]; then
    echo -e "${RED}❌ Diretório /root/app-precos não encontrado!${NC}"
    echo ""
    echo "Crie com:"
    echo "  mkdir -p /root/app-precos"
    echo ""
    echo "Transfira do Windows com:"
    echo "  scp -r App-pre-os\\* root@72.61.62.17:/root/app-precos/"
    exit 1
fi

cd /root/app-precos
echo -e "${GREEN}✅ Projeto encontrado em /root/app-precos${NC}"

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ docker-compose.yml encontrado${NC}"
echo ""

# ==========================================
# PASSO 2: Verificar Docker
# ==========================================
echo -e "${BLUE}📍 PASSO 2 - Verificando Docker...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose: $(docker compose version --short)${NC}"
echo ""

# ==========================================
# PASSO 3: Verificar portas
# ==========================================
echo -e "${BLUE}📍 PASSO 3 - Verificando portas...${NC}"
echo ""

PORTS_OK=1

for port in 9000 9001 9002; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}❌ Porta $port: EM USO${NC}"
        PORTS_OK=0
    else
        echo -e "${GREEN}✅ Porta $port: DISPONÍVEL${NC}"
    fi
done

if [ $PORTS_OK -eq 0 ]; then
    echo ""
    echo -e "${RED}Uma ou mais portas estão em uso!${NC}"
    echo "Libere com:"
    echo "  fuser -k 9000/tcp"
    echo "  fuser -k 9001/tcp"
    echo "  fuser -k 9002/tcp"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Todas as portas estão livres!${NC}"
echo ""

# ==========================================
# PASSO 4: Build
# ==========================================
echo -e "${BLUE}📍 PASSO 4 - Building Docker images...${NC}"
echo "   (Isso pode levar 5-15 minutos...)"
echo ""

docker compose build --no-cache

echo ""
echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# ==========================================
# PASSO 5: Iniciar
# ==========================================
echo -e "${BLUE}📍 PASSO 5 - Iniciando containers...${NC}"
echo ""

docker compose down 2>/dev/null || true

docker compose up -d

echo ""
echo "  Aguardando containers iniciarem..."
sleep 15

echo -e "${GREEN}✅ Containers iniciados${NC}"
echo ""

# ==========================================
# PASSO 6: Status
# ==========================================
echo -e "${BLUE}📍 PASSO 6 - Status dos containers...${NC}"
echo ""

docker compose ps

echo ""

# ==========================================
# PASSO 7: Testes
# ==========================================
echo -e "${BLUE}📍 PASSO 7 - Testando serviços...${NC}"
echo ""

MAX_ATTEMPTS=30
ATTEMPT=0

echo "  Aguardando PostgreSQL iniciar..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec app-precos-postgres pg_isready -U apiuser -d dbactions > /dev/null 2>&1; then
        echo -e "    ${GREEN}✅ PostgreSQL respondendo${NC}"
        break
    fi
    echo -n "."
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

echo ""
echo "  Testando Backend..."
if curl -s http://localhost:9001/api/produtos > /dev/null; then
    echo -e "    ${GREEN}✅ Backend respondendo${NC}"
else
    echo -e "    ${YELLOW}⚠️ Backend ainda iniciando...${NC}"
fi

echo ""
echo "  Testando Frontend..."
if curl -s http://localhost:9000 > /dev/null; then
    echo -e "    ${GREEN}✅ Frontend respondendo${NC}"
else
    echo -e "    ${YELLOW}⚠️ Frontend ainda iniciando...${NC}"
fi

echo ""

# ==========================================
# Resumo
# ==========================================
clear

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}🌐 Acesso:${NC}"
echo -e "   Frontend: ${GREEN}http://72.61.62.17:9000${NC}"
echo -e "   Backend:  ${GREEN}http://72.61.62.17:9001/api/produtos${NC}"
echo ""

echo -e "${BLUE}📊 Status dos Containers:${NC}"
docker compose ps

echo ""

echo -e "${BLUE}📊 Últimos Logs:${NC}"
docker compose logs --tail=20

echo ""

echo -e "${BLUE}📈 Comandos Úteis:${NC}"
echo "   docker compose logs -f             # Logs em tempo real"
echo "   docker compose ps                  # Status"
echo "   docker compose restart             # Reiniciar tudo"
echo "   docker compose down                # Parar tudo"
echo ""

echo -e "${BLUE}✅ Checklist:${NC}"
echo "   [ ] Frontend: http://72.61.62.17:9000"
echo "   [ ] Backend: curl http://localhost:9001/api/produtos"
echo "   [ ] PostgreSQL: docker exec -it app-precos-postgres pg_isready"
echo "   [ ] Verificar logs: docker compose logs"
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Pronto para usar!${NC}"
echo "════════════════════════════════════════════════════════"
