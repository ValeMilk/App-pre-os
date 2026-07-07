#!/bin/bash

echo "🔍 Testando API endpoints..."
echo ""

# Test /api/clientes
echo "📋 Teste /api/clientes:"
CLIENTES=$(curl -s http://localhost:9001/api/clientes)
CLIENTES_COUNT=$(echo $CLIENTES | jq 'length')
echo "✅ Clientes encontrados: $CLIENTES_COUNT"
echo $CLIENTES | jq '.[0]' | head -15
echo ""

# Test /api/produtos  
echo "📦 Teste /api/produtos:"
PRODUTOS=$(curl -s http://localhost:9001/api/produtos)
PRODUTOS_COUNT=$(echo $PRODUTOS | jq 'length')
echo "✅ Produtos encontrados: $PRODUTOS_COUNT"
echo $PRODUTOS | jq '.[0]' | head -15
echo ""

# Test /api/descontos
echo "🏷️  Teste /api/descontos:"
DESCONTOS=$(curl -s http://localhost:9001/api/descontos)
echo $DESCONTOS | jq '.' | head -20
echo ""

echo "✨ Testes concluídos!"
