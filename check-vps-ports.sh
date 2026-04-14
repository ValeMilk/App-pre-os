#!/bin/bash

# Script para verificar portas disponíveis na VPS
# Uso: ./check-vps-ports.sh

echo "════════════════════════════════════════════════════════"
echo "  🔍 VERIFICAÇÃO DE PORTAS - VPS 72.61.62.17"
echo "════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Portas a verificar
PORTS=(80 3001 5433)

echo -e "${BLUE}📋 Portas necessárias para o projeto:${NC}"
echo "  - 80    → Frontend (Nginx)"
echo "  - 3001  → Backend (Node.js API)"
echo "  - 5433  → PostgreSQL"
echo ""

# Função para verificar porta
check_port() {
    local port=$1
    local service=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}❌ Porta $port ($service) - EM USO${NC}"
        
        # Tentar identificar processo
        if command -v lsof &> /dev/null; then
            local process=$(lsof -i :$port -t 2>/dev/null)
            if [ ! -z "$process" ]; then
                local processname=$(ps -p $process -o comm= 2>/dev/null)
                echo "   └─ Processo: $processname (PID: $process)"
            fi
        fi
        return 1
    else
        echo -e "${GREEN}✅ Porta $port ($service) - DISPONÍVEL${NC}"
        return 0
    fi
}

# Verificar cada porta
echo -e "${YELLOW}🔎 Verificando disponibilidade...${NC}"
echo ""

available_count=0
total_ports=${#PORTS[@]}

check_port 80 "Frontend" && ((available_count++))
check_port 3001 "Backend" && ((available_count++))
check_port 5433 "PostgreSQL" && ((available_count++))

echo ""
echo "─────────────────────────────────────────────────────────"

# Resumo
if [ $available_count -eq $total_ports ]; then
    echo -e "${GREEN}🎉 TODAS AS PORTAS ESTÃO DISPONÍVEIS!${NC}"
    echo -e "${GREEN}✅ Você pode prosseguir com o deploy Docker.${NC}"
else
    echo -e "${YELLOW}⚠️  $(($total_ports - $available_count)) porta(s) em uso.${NC}"
    echo ""
    echo "Para liberar as portas, execute:"
    echo ""
    
    if netstat -tuln 2>/dev/null | grep -q ":80 "; then
        echo "  # Porta 80:"
        echo "  fuser -k 80/tcp"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":3001 "; then
        echo "  # Porta 3001:"
        echo "  fuser -k 3001/tcp"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":5433 "; then
        echo "  # Porta 5433:"
        echo "  fuser -k 5433/tcp"
    fi
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# Mostrar todas as portas em uso
echo -e "${BLUE}📊 Todas as portas TCP em estado LISTEN:${NC}"
echo ""
netstat -tuln 2>/dev/null | grep LISTEN | awk '{print $4}' | sed 's/.*://' | sort -n | uniq | head -20
echo ""

# Verificar Docker
echo "─────────────────────────────────────────────────────────"
echo -e "${BLUE}🐳 Status do Docker:${NC}"
echo ""

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker instalado: $(docker --version)${NC}"
    
    if systemctl is-active --quiet docker 2>/dev/null; then
        echo -e "${GREEN}✅ Docker daemon rodando${NC}"
    else
        echo -e "${RED}❌ Docker daemon NÃO está rodando${NC}"
        echo "   Execute: systemctl start docker"
    fi
else
    echo -e "${RED}❌ Docker NÃO instalado${NC}"
    echo "   Execute: curl -fsSL https://get.docker.com | sh"
fi

echo ""

if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose instalado: $(docker compose version --short)${NC}"
else
    echo -e "${RED}❌ Docker Compose NÃO instalado${NC}"
    echo "   Execute: apt install -y docker-compose-plugin"
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# Verificar containers Docker rodando
if command -v docker &> /dev/null; then
    echo -e "${BLUE}📦 Containers Docker ativos:${NC}"
    echo ""
    
    if [ $(docker ps -q | wc -l) -eq 0 ]; then
        echo "  Nenhum container rodando"
    else
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    echo ""
fi

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Verificação concluída!${NC}"
echo "════════════════════════════════════════════════════════"
