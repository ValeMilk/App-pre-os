# 📝 Comandos Git - Push para GitHub

Execute estes comandos **NO PowerShell** (na pasta do projeto):

---

## ✅ PASSO 1 - Verificar Status
```powershell
cd "c:\Users\LENOVO 059\Desktop\App-pre-os"
git status
```

Você verá:
```
On branch vps-test
Changes not staged for commit:
  modified:   backend/etl-completo.js
  modified:   backend/etl-corrigido.js
  modified:   etl-fixed.js
  modified:   frontend/tsconfig.json
  modified:   projeto nuvem/querry base de clientes.sql

Untracked files:
  COMANDOS_RAPIDOS_VPS.md
  DEPLOY_AGORA.md
  ... (12 arquivos novos)
```

---

## ✅ PASSO 2 - Adicionar Todos os Arquivos
```powershell
git add .
```

---

## ✅ PASSO 3 - Fazer Commit
```powershell
git commit -m "🚀 Deploy VPS: Atualizar ETL com filtro de redes, corrigir TypeScript, preparar scripts de deploy seguro com portas 9000/9001/9002"
```

Verá algo como:
```
[vps-test xxxx] 🚀 Deploy VPS: ...
 18 files changed, 1500 insertions(+), 50 deletions(-)
 create mode 100644 COMANDOS_RAPIDOS_VPS.md
 ... (mais arquivos)
```

---

## ✅ PASSO 4 - Push para GitHub
```powershell
git push origin vps-test
```

Verá:
```
Enumerating objects: 25, done.
Counting objects: 100% (25/25), done.
Delta compression using up to 8 threads
Compressing objects: 100% (20/20), done.
Writing objects: 100% (23/23), 15.34 KiB | 2.57 MiB/s, done.
Total 23 (delta 2), reused 0 (delta 0), reused pack 0 (delta 0)
remote: Resolving deltas: 100% (2/2), done.
To github.com:seu-usuario/seu-repo.git
   abc1234..def5678  vps-test -> vps-test
```

---

## ✅ PASSO 5 - Verificar Push
```powershell
git log --oneline -5
```

Verá seu commit no topo.

---

## ✅ PASSO 6 - Após Push, Deploy na VPS!

Depois que terminar, execute:

```powershell
ssh root@72.61.62.17
cd /root/app-precos
docker compose build --no-cache
docker compose up -d
docker compose ps
```

---

## 📋 Resumo Rápido (Copie e Cole)

```powershell
cd "c:\Users\LENOVO 059\Desktop\App-pre-os"; `
git add .; `
git commit -m "🚀 Deploy VPS: Atualizar ETL com filtro de redes, corrigir TypeScript, preparar scripts de deploy seguro com portas 9000/9001/9002"; `
git push origin vps-test; `
git log --oneline -5
```

---

Quando terminar o push, me avise! 🎯
