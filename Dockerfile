# Backend Dockerfile for Railway - Node.js API
FROM node:18-slim AS builder

WORKDIR /app

# Copiar arquivos de dependências do backend
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte do backend
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Produção (apenas runtime)
FROM node:18-slim

WORKDIR /app

# Copiar package*.json
COPY backend/package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 5000

# Variáveis de ambiente (serão sobrescritas pelo Railway)
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicialização
CMD ["node", "dist/index.js"]
