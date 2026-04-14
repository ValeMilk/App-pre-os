#!/bin/bash

# Script para encontrar portas livres de forma SEGURA
# SEM afetar outras aplicações

echo "════════════════════════════════════════════════════════"
echo "  🔍 SCANNER DE PORTAS SEGURO"
echo "  VPS: 72.61.62.17"
echo "════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}1️⃣ CONTAINERS RODANDO ATUALMENTE${NC}"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

echo -e "${BLUE}2️⃣ PORTAS EM USO (sistema inteiro)${NC}"
echo ""

netstat -tuln | grep LISTEN | awk '{print $4}' | sed 's/.*://' | sort -n | uniq

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

echo -e "${BLUE}3️⃣ TESTES DE PORTAS ESPECÍFICAS${NC}"
echo ""
echo "Recomendadas para App Preços:"
echo ""

# Testar portas sugeridas
PORTAS_SUGERIDAS=(
    "8080:Frontend"
    "8001:Backend"
    "5434:PostgreSQL"
    "3000:Frontend-Alt"
    "3100:Backend-Alt"
    "5433:PostgreSQL-Original"
)

for entry in "${PORTAS_SUGERIDAS[@]}"; do
    port="${entry%:*}"
    descricao="${entry#*:}"
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}❌ Porta $port ($descricao): EM USO${NC}"
        # Tentar identificar qual container/processo
        if command -v docker &> /dev/null; then
            container=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$port" | awk '{print $1}')
            if [ ! -z "$container" ]; then
                echo "   └─ Usado por: $container"
            fi
        fi
    else
        echo -e "${GREEN}✅ Porta $port ($descricao): DISPONÍVEL${NC}"
    fi
done

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

echo -e "${BLUE}4️⃣ VERIFICAR PORTAS ORIGINAIS DO PROJETO${NC}"
echo ""

PORTAS_ORIGINAIS=(
    "80:Frontend"
    "3001:Backend"
    "5433:PostgreSQL"
)

unavailable_count=0

for entry in "${PORTAS_ORIGINAIS[@]}"; do
    port="${entry%:*}"
    descricao="${entry#*:}"
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}❌ Porta $port ($descricao): EM USO${NC}"
        ((unavailable_count++))
        
        # Tentar identificar qual container/processo
        if command -v docker &> /dev/null; then
            container=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$port" | awk '{print $1}')
            if [ ! -z "$container" ]; then
                echo "   └─ Usado por: $container"
            fi
        fi
    else
        echo -e "${GREEN}✅ Porta $port ($descricao): DISPONÍVEL${NC}"
    fi
done

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

if [ $unavailable_count -eq 0 ]; then
    echo -e "${GREEN}🎉 EXCELENTE! Todas as portas originais estão LIVRES!${NC}"
    echo -e "${GREEN}   Você pode usar 80, 3001 e 5433 sem problemas.${NC}"
else
    echo -e "${YELLOW}⚠️ AVISO: $unavailable_count porta(s) em uso por outras apps.${NC}"
    echo -e "${YELLOW}   Use portas alternativas para o App Preços.${NC}"
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

echo -e "${BLUE}5️⃣ RECOMENDAÇÕES${NC}"
echo ""

if [ $unavailable_count -eq 0 ]; then
    echo -e "   ${GREEN}Use configuração original:${NC}"
    echo "   - Frontend:  porta 80"
    echo "   - Backend:   porta 3001"
    echo "   - Database:  porta 5433"
else
    echo -e "   ${YELLOW}Use configuração alternativa:${NC}"
    echo "   - Frontend:  porta 8080"
    echo "   - Backend:   porta 8001"
    echo "   - Database:  porta 5434"
    echo ""
    echo "   Ou confirme outras portas livres acima."
fi

echo ""
echo "════════════════════════════════════════════════════════"
