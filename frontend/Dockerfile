# Frontend Dockerfile - React + Vite (Multi-stage build)

# Stage 1: Build da aplicação React
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY vite.config.mjs ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY public ./public
COPY src ./src
COPY index.html ./

# Definir variável de ambiente para build do Vite
ARG VITE_API_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL

# Build da aplicação (gera pasta dist)
RUN npm run build

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Copiar build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx para React Router
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando padrão do Nginx
CMD ["nginx", "-g", "daemon off;"]
