#!/bin/bash

# Script de Migração de PM2 para Docker
# Este script ajuda na transição do setup atual (PM2) para Docker

set -e

echo "=== Migração PM2 → Docker ==="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Backup do banco de dados atual
echo -e "${YELLOW}1. Fazendo backup do PostgreSQL atual...${NC}"
BACKUP_FILE="backup_postgres_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h localhost -U apiuser -d dbactions > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${RED}❌ Erro no backup. Tem PostgreSQL rodando?${NC}"
    echo "Se não tiver dados importantes, pode pular esta etapa."
    read -p "Continuar sem backup? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
}

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup salvo: $BACKUP_FILE${NC}"
fi

# Listar processos PM2 atuais
echo ""
echo -e "${YELLOW}2. Processos PM2 atuais:${NC}"
pm2 list

# Confirmar migração
echo ""
echo -e "${RED}⚠️  ATENÇÃO: Este script vai:${NC}"
echo "   - Parar todos os processos PM2"
echo "   - Remover processos PM2 do startup"
echo "   - Iniciar Docker Compose"
echo "   - Usar novo PostgreSQL em container"
echo ""
read -p "Confirma migração? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Migração cancelada."
    exit 0
fi

# Parar PM2
echo ""
echo -e "${YELLOW}3. Parando processos PM2...${NC}"
pm2 stop all
pm2 delete all
pm2 unstartup
pm2 save --force

echo -e "${GREEN}✓ PM2 parado e removido do startup${NC}"

# Verificar portas livres
echo ""
echo -e "${YELLOW}4. Verificando portas...${NC}"
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Porta 80 está em uso${NC}"
    lsof -i :80
    exit 1
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Porta 3001 está em uso${NC}"
    lsof -i :3001
    exit 1
fi

echo -e "${GREEN}✓ Portas 80 e 3001 livres${NC}"

# Restaurar backup no novo PostgreSQL (se existir)
if [ -f "$BACKUP_FILE" ]; then
    echo ""
    echo -e "${YELLOW}5. Deseja restaurar o backup no novo PostgreSQL?${NC}"
    read -p "Restaurar dados? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Após o Docker subir, execute:"
        echo "  cat $BACKUP_FILE | docker exec -i app-precos-postgres psql -U apiuser -d dbactions"
    fi
fi

echo ""
echo -e "${GREEN}=== Migração concluída! ===${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Execute: ./deploy-docker.sh"
echo "  2. Aguarde os containers subirem"
echo "  3. Acesse: http://72.61.62.17"
echo ""
echo "Para voltar ao PM2 (se necessário):"
echo "  docker-compose down"
echo "  cd /root/app/backend && pm2 start dist/index.js --name backend-precos"
echo "  cd /root/app/frontend && pm2 start 'serve -s dist -l 80' --name frontend-precos"
