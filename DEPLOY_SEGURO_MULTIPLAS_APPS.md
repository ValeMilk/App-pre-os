# 🔧 DEPLOY SEGURO - VPS com Múltiplas Apps

## ⚠️ SITUAÇÃO ATUAL

Na VPS 72.61.62.17 há várias aplicações rodando:
- ✅ analyticsvale (2 containers)
- ✅ attendance-manager (2 containers)
- ✅ central-de-app (1 container)
- ✅ cis-valemilk (2 containers)
- ✅ docker (3 containers)
- ✅ valefish (2 containers)
- ✅ valemilk-maps (1 container)
- ✅ warehouse (3 containers)

**NÃO VAMOS MEXER EM NADA DISSO!** ❌❌❌

---

## 🎯 ESTRATÉGIA SEGURA

### Problema
As portas 80, 3001, 5433 podem estar sendo usadas por outras apps.

### Solução
1. **Identificar exatamente** quais containers estão usando quais portas
2. **Usar portas diferentes** para o App Preços (ou reconfigurar)
3. **Deploy isolado** do App Preços em novo diretório
4. **Usar seu próprio docker-compose.yml** com portas exclusivas

---

## PASSO 1️⃣ - Identificar o que está ocupando cada porta

Na **VPS**, execute:

```bash
echo "🔍 Verificando portas 80, 3001, 5433..."
echo ""

# Mostrar qual container está usando porta 80
echo "=== PORTA 80 ==="
docker ps --all --format "table {{.Names}}\t{{.Ports}}" | grep ":80"

# Mostrar qual container está usando porta 3001
echo ""
echo "=== PORTA 3001 ==="
docker ps --all --format "table {{.Names}}\t{{.Ports}}" | grep ":3001"

# Mostrar qual container está usando porta 5433
echo ""
echo "=== PORTA 5433 ==="
docker ps --all --format "table {{.Names}}\t{{.Ports}}" | grep ":5433"

# Ver TODOS os containers e suas portas
echo ""
echo "=== TODOS OS CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Envie o resultado para eu analisar quais portas realmente estão livres!**

---

## PASSO 2️⃣ - Encontrar portas livres

Após ver o resultado do comando acima, testaremos outras portas:

```bash
# Testar portas alternativas
for port in 8080 8443 5434 5000 9000 9001 9002 8888; do
    if netstat -tuln | grep -q ":$port "; then
        echo "❌ Porta $port: EM USO"
    else
        echo "✅ Porta $port: DISPONÍVEL"
    fi
done
```

---

## PASSO 3️⃣ - Preparar App Preços com portas personalizadas

Vou **adaptar o docker-compose.yml** para usar portas diferentes.

**Sugerido:**
- Frontend: Porta **8080** (em vez de 80)
- Backend: Porta **8001** (em vez de 3001)
- PostgreSQL: Porta **5434** (em vez de 5433)

Ou podemos usar:
- Frontend: Porta **3000**
- Backend: Porta **3001**
- PostgreSQL: Porta **5433**

**Qual combinação de portas você prefere?** Ou quer que use as que você sugerir?

---

## PASSO 4️⃣ - Criar diretório separado para App Preços

```bash
# Na VPS, criar diretório novo
mkdir -p /root/app-precos
cd /root/app-precos

# Estrutura será:
# /root/app-precos/
#   ├── docker-compose.yml (com portas personalizadas)
#   ├── frontend/
#   ├── backend/
#   └── ...
```

---

## PASSO 5️⃣ - Transferir e Deploy

```powershell
# No Windows PowerShell:
cd "c:\Users\LENOVO 059\Desktop"
scp -r App-pre-os root@72.61.62.17:/root/app-precos-new
```

---

## 📋 O QUE FAZER AGORA

### 1️⃣ Execute na VPS:
```bash
# Ver quais portas estão realmente em uso
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Identificar portas de cada app
for port in 80 3001 5433 8080 8443 5434 5000 9000; do
    if netstat -tuln | grep -q ":$port "; then
        echo "Porta $port: EM USO"
    else
        echo "Porta $port: LIVRE"
    fi
done
```

### 2️⃣ Envie o resultado aqui

Depois ajusto o `docker-compose.yml` com as portas certas.

---

## 🔒 Regra de Ouro

```
✅ FAZER:
- Usar portas diferentes
- Deploy em novo diretório
- Criar docker-compose.yml exclusivo

❌ NÃO FAZER:
- Parar outras apps
- Remover outros containers
- Mexer em outras configurações
```

---

## ⚡ Resumo

1. **Execute a verificação de portas** (copie o comando acima)
2. **Envie os resultados**
3. **Eu adapto o docker-compose.yml** com as portas livres
4. **Você transfere o projeto**
5. **Fazemos deploy seguro**

---

## 📞 Próximo passo

Execute na VPS e me envie o resultado deste comando:

```bash
echo "=== PORTAS EM USO ===" && \
for port in 80 3001 5433 8080 8443 5434 5000 9000 9001 9002 8888; do
    if netstat -tuln | grep -q ":$port "; then
        echo "❌ PORTA $port: EM USO"
    else
        echo "✅ PORTA $port: LIVRE"
    fi
done && \
echo "" && \
echo "=== CONTAINERS RODANDO ===" && \
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Espero sua resposta com os resultados!** 🎯
