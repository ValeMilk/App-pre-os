# 🚀 CORREÇÃO - Diretório Correto

## Problema
Você está em `/root` mas precisa estar em `/root/app-precos`

## Solução

Execute NA VPS:

```bash
cd /root/app-precos
ls -la docker-compose.yml
pwd
```

Se não existir, use:

```bash
cd /root/app-precos && \
ls -la && \
echo "" && \
echo "Se docker-compose.yml não aparece acima:" && \
echo "Execute: git status"
```

---

## Se ainda não funcionar

Execute isto tudo:

```bash
# Limpar e reclonar
rm -rf /root/app-precos
cd /root
git clone -b vps-test https://github.com/ValeMilk/App-pre-os.git app-precos
cd app-precos
ls -la docker-compose.yml
```

---

## Depois que tiver arquivo, execute:

```bash
cd /root/app-precos && \
docker compose down 2>/dev/null || true && \
docker compose build --no-cache && \
docker compose up -d && \
sleep 15 && \
docker compose ps
```
