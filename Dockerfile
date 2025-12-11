# Backend Dockerfile for Railway - Node.js API
FROM node:18-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências do backend
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fonte do backend
COPY backend/src ./src

# Build TypeScript
RUN npx tsc

# Stage 2: Produção (apenas runtime)
FROM node:18-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package*.json
COPY backend/package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 5000

# Variáveis de ambiente (serão sobrescritas pelo Railway)
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicialização
CMD ["node", "dist/index.js"]
