#!/bin/bash

# Script de Deploy Docker para VPS
# Uso: ./deploy-docker.sh

set -e

echo "=== Deploy App Preços com Docker ==="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo "Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    echo "Instale com: sudo apt install docker-compose-plugin"
    exit 1
fi

echo -e "${GREEN}✓ Docker instalado${NC}"

# Parar containers antigos se existirem
echo ""
echo -e "${YELLOW}Parando containers antigos...${NC}"
docker-compose down 2>/dev/null || true

# Parar PM2 processes para liberar portas
echo ""
echo -e "${YELLOW}Parando processos PM2...${NC}"
pm2 stop all || true
pm2 delete all || true

# Build das imagens
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache

# Subir containers
echo ""
echo -e "${YELLOW}Iniciando containers...${NC}"
docker-compose up -d

# Aguardar containers ficarem prontos
echo ""
echo -e "${YELLOW}Aguardando containers iniciarem...${NC}"
sleep 10

# Verificar status
echo ""
echo -e "${GREEN}=== Status dos Containers ===${NC}"
docker-compose ps

# Verificar logs
echo ""
echo -e "${YELLOW}Últimos logs:${NC}"
docker-compose logs --tail=20

# Testar endpoints
echo ""
echo -e "${GREEN}=== Testando Endpoints ===${NC}"
echo -e "${YELLOW}Backend (API):${NC}"
curl -s http://localhost:3001/api/produtos | head -n 3 || echo -e "${RED}❌ Backend não respondeu${NC}"

echo ""
echo -e "${YELLOW}Frontend:${NC}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo -e "${RED}❌ Frontend não respondeu${NC}"

echo ""
echo -e "${GREEN}=== Deploy Completo! ===${NC}"
echo ""
echo "Acesse a aplicação:"
echo "  Frontend: http://72.61.62.17"
echo "  Backend:  http://72.61.62.17:3001"
echo ""
echo "Comandos úteis:"
echo "  docker-compose logs -f           # Ver logs em tempo real"
echo "  docker-compose ps                # Status dos containers"
echo "  docker-compose restart           # Reiniciar tudo"
echo "  docker-compose down              # Parar tudo"
echo "  docker-compose logs etl          # Ver logs do ETL"
