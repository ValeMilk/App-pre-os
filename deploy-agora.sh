#!/bin/bash

# ==========================================
# 🚀 DEPLOY ULTRA RÁPIDO - UMA LINHA
# ==========================================
# Execute isto NA VPS após transferir o projeto

cd /root/app-precos && \
echo "🔧 Limpando..." && \
docker compose down 2>/dev/null || true && \
echo "" && \
echo "🏗️ Building (10-15 min, aguarde)..." && \
docker compose build --no-cache && \
echo "" && \
echo "🚀 Iniciando..." && \
docker compose up -d && \
echo "" && \
echo "⏳ Aguardando 15 segundos..." && \
sleep 15 && \
echo "" && \
echo "════════════════════════════════════════════════════════" && \
echo "✅ DEPLOY CONCLUÍDO!" && \
echo "════════════════════════════════════════════════════════" && \
echo "" && \
echo "📊 Status:" && \
docker compose ps && \
echo "" && \
echo "🌐 Acesse: http://72.61.62.17:9000" && \
echo "" && \
echo "📋 Logs:" && \
docker compose logs --tail=20 && \
echo "" && \
echo "✨ Tudo pronto!"
