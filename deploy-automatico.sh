#!/bin/bash

# ==========================================
# 🚀 SCRIPT AUTOMÁTICO - DEPLOY VPS
# ==========================================
# Use este script para fazer deploy automaticamente
# Copie e cole INTEIRO na VPS

set -e  # Parar se houver erro

clear

echo "════════════════════════════════════════════════════════"
echo "  🚀 DEPLOY AUTOMÁTICO - App Preços Vale Milk"
echo "  🌐 VPS: 72.61.62.17"
echo "════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==========================================
# PASSO 1: Parar containers antigos
# ==========================================
echo -e "${BLUE}📍 PASSO 1 - Parando containers antigos...${NC}"
echo ""

if [ $(docker ps -aq | wc -l) -gt 0 ]; then
    echo "  Parando containers..."
    docker stop $(docker ps -aq)
    echo "  Removendo containers..."
    docker rm $(docker ps -aq)
    echo -e "${GREEN}  ✅ Containers antigos removidos${NC}"
else
    echo -e "${GREEN}  ✅ Nenhum container antigo${NC}"
fi

echo ""

# ==========================================
# PASSO 2: Liberar portas
# ==========================================
echo -e "${BLUE}📍 PASSO 2 - Liberando portas...${NC}"
echo ""

for port in 80 3001 5433 8000 8081 8082; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "  Liberando porta $port..."
        fuser -k $port/tcp 2>/dev/null || true
    fi
done

echo -e "${GREEN}  ✅ Portas liberadas${NC}"
sleep 2
echo ""

# ==========================================
# PASSO 3: Verificar Docker
# ==========================================
echo -e "${BLUE}📍 PASSO 3 - Verificando Docker...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}  ❌ Docker não está instalado!${NC}"
    echo "  Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo -e "${GREEN}  ✅ Docker: $(docker --version)${NC}"

if ! docker compose version &> /dev/null; then
    echo "  Instalando Docker Compose..."
    apt update && apt install -y docker-compose-plugin
fi

echo -e "${GREEN}  ✅ Docker Compose: $(docker compose version --short)${NC}"
echo ""

# ==========================================
# PASSO 4: Verificar projeto
# ==========================================
echo -e "${BLUE}📍 PASSO 4 - Verificando projeto...${NC}"
echo ""

if [ ! -d "/root/app-precos" ]; then
    echo -e "${RED}  ❌ Projeto não encontrado em /root/app-precos${NC}"
    echo "  Você precisa transferir o projeto primeiro!"
    echo ""
    echo "  No Windows, execute:"
    echo "    cd C:\\Users\\LENOVO 059\\Desktop"
    echo "    scp -r App-pre-os root@72.61.62.17:/root/app-precos"
    exit 1
fi

cd /root/app-precos
echo -e "${GREEN}  ✅ Projeto encontrado${NC}"

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}  ❌ docker-compose.yml não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}  ✅ docker-compose.yml validado${NC}"
echo ""

# ==========================================
# PASSO 5: Build das imagens
# ==========================================
echo -e "${BLUE}📍 PASSO 5 - Building Docker images...${NC}"
echo "  (Isso pode levar de 2-10 minutos...)"
echo ""

docker compose build --no-cache

echo ""
echo -e "${GREEN}  ✅ Build concluído${NC}"
echo ""

# ==========================================
# PASSO 6: Iniciar containers
# ==========================================
echo -e "${BLUE}📍 PASSO 6 - Iniciando containers...${NC}"
echo ""

docker compose up -d

echo ""
echo "  Aguardando containers iniciarem..."
sleep 15

echo -e "${GREEN}  ✅ Containers iniciados${NC}"
echo ""

# ==========================================
# PASSO 7: Verificar status
# ==========================================
echo -e "${BLUE}📍 PASSO 7 - Verificando status...${NC}"
echo ""

docker compose ps

echo ""

# ==========================================
# PASSO 8: Testar endpoints
# ==========================================
echo -e "${BLUE}📍 PASSO 8 - Testando endpoints...${NC}"
echo ""

echo "  Testando Backend..."
if curl -s http://localhost:3001/api/produtos > /dev/null; then
    echo -e "    ${GREEN}✅ Backend respondendo${NC}"
else
    echo -e "    ${YELLOW}⚠️ Backend não respondeu ainda (pode estar iniciando)${NC}"
fi

echo ""
echo "  Testando Frontend..."
if curl -s http://localhost:80 > /dev/null; then
    echo -e "    ${GREEN}✅ Frontend respondendo${NC}"
else
    echo -e "    ${YELLOW}⚠️ Frontend não respondeu ainda${NC}"
fi

echo ""

# ==========================================
# PASSO 9: Ver logs
# ==========================================
echo -e "${BLUE}📍 PASSO 9 - Últimos logs...${NC}"
echo ""

docker compose logs --tail=50

echo ""

# ==========================================
# CONCLUSÃO
# ==========================================
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DEPLOY COMPLETO!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}🌐 Acesse no navegador:${NC}"
echo -e "   Frontend: ${GREEN}http://72.61.62.17${NC}"
echo -e "   Backend:  ${GREEN}http://72.61.62.17:3001/api/produtos${NC}"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo "   docker compose logs -f          # Ver logs em tempo real"
echo "   docker compose ps               # Ver status dos containers"
echo "   docker compose restart          # Reiniciar todos"
echo "   docker compose down             # Parar tudo"
echo ""
echo -e "${BLUE}📈 Verificar dados:${NC}"
echo "   docker exec -it app-precos-postgres psql -U apiuser -d dbactions"
echo ""

# ==========================================
# Aguardar PostgreSQL estar pronto
# ==========================================
echo -e "${YELLOW}⏳ Aguardando PostgreSQL estar 100% pronto...${NC}"

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec -it app-precos-postgres pg_isready -U apiuser -d dbactions > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL está pronto!${NC}"
        break
    fi
    
    echo -n "."
    attempt=$((attempt + 1))
    sleep 1
done

echo ""

if [ $attempt -eq $max_attempts ]; then
    echo -e "${YELLOW}⚠️ PostgreSQL ainda está iniciando, aguarde mais um minuto...${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Pronto para usar!${NC}"
echo "════════════════════════════════════════════════════════"
