# 🚀 Deploy: Vercel + Railway

## Passo 1️⃣: Deploy do Backend (Railway)

### 1. Criar conta no Railway
- Acesse: https://railway.app
- Faça login com GitHub

### 2. Criar novo projeto
- Clique em "New Project"
- Escolha "Empty Project"

### 3. Adicionar serviço
- Clique em "+ New"
- Escolha "Empty Service"
- Nome: `app-precos-backend`

### 4. Deploy do código
**Opção A - Via GitHub (recomendado):**
- Conecte o repositório GitHub
- Railway detecta automaticamente Node.js

**Opção B - Via CLI:**
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

### 5. Configurar variáveis de ambiente
No painel Railway, vá em "Variables" e adicione:
```
MONGO_URI=mongodb+srv://nicolasimoes_db_user:TOG293qtDIlYsa6X@pricerequest.p5p0lrb.mongodb.net/?appName=priceRequest
JWT_SECRET=Kj8!sD9@2lQwZx7pLmN4vRtY
PORT=4000
NODE_ENV=production
```

### 6. Obter URL do backend
- Após deploy, Railway gera uma URL tipo: `https://app-precos-backend-production.up.railway.app`
- **COPIE ESSA URL** - vamos usar no frontend!

---

## Passo 2️⃣: Deploy do Frontend (Vercel)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer login
```bash
vercel login
```

### 3. Configurar variável de ambiente
Edite o arquivo `frontend/.env.production` e substitua pela URL do Railway:
```
VITE_API_URL=https://app-precos-backend-production.up.railway.app
```

### 4. Deploy
```bash
cd frontend
vercel
```

Siga os prompts:
- Set up and deploy? **Y**
- Which scope? **Sua conta**
- Link to existing project? **N**
- Project name? **app-precos** (ou outro nome)
- In which directory? **./**
- Override settings? **N**

### 5. Deploy de produção
```bash
vercel --prod
```

### 6. Obter URL do frontend
- Vercel gera URL tipo: `https://app-precos.vercel.app`
- **Essa é a URL que os vendedores vão acessar!**

---

## Passo 3️⃣: Configurar CORS no Backend

Após ter a URL do Vercel, atualize o CORS no Railway:

Adicione variável de ambiente no Railway:
```
FRONTEND_URL=https://app-precos.vercel.app
```

E no código do backend (`src/index.ts`), o CORS já está configurado para aceitar todas as origens.

---

## ✅ Checklist Final

- [ ] Backend deployado no Railway com variáveis de ambiente
- [ ] Frontend deployado no Vercel
- [ ] Arquivo `.env.production` atualizado com URL do Railway
- [ ] Testar login na URL do Vercel
- [ ] Testar criação de solicitação
- [ ] Testar aprovação pelo supervisor

---

## 🔧 Comandos Úteis

### Atualizar backend:
```bash
cd backend
git push  # Se usando GitHub conectado ao Railway
# OU
railway up  # Se usando Railway CLI
```

### Atualizar frontend:
```bash
cd frontend
vercel --prod
```

### Ver logs do backend:
```bash
railway logs
```

### Ver logs do frontend:
```bash
vercel logs
```

---

## 🌐 URLs Finais

Após deploy completo, você terá:

- **Frontend:** `https://app-precos.vercel.app`
- **Backend API:** `https://app-precos-backend-production.up.railway.app`
- **MongoDB:** Atlas (já configurado)

**Compartilhe o link do frontend com os vendedores!** 🎉

---

## 💡 Dicas

- **Domínio personalizado:** Vercel permite adicionar domínio próprio gratuitamente (ex: `precos.suaempresa.com`)
- **Monitoramento:** Railway e Vercel têm dashboards com métricas de uso
- **Limites gratuitos:**
  - Railway: 500h/mês, 512MB RAM
  - Vercel: 100GB bandwidth/mês
- **Upgrade:** Se crescer muito, upgrade é simples e acessível

---

## 🆘 Troubleshooting

**Erro CORS:**
- Verificar se `FRONTEND_URL` está correto no Railway
- Backend deve aceitar requisições da URL do Vercel

**Frontend não conecta:**
- Verificar se `.env.production` tem URL correta
- Fazer rebuild: `vercel --prod --force`

**Backend não inicia:**
- Verificar logs no Railway: `railway logs`
- Confirmar variáveis de ambiente (MONGO_URI, JWT_SECRET)

**MongoDB não conecta:**
- Verificar se IP do Railway está na whitelist do MongoDB Atlas
- Ou usar `0.0.0.0/0` (permitir todos) temporariamente
