# App Preços - Frontend (React + TypeScript + Vite)

Este scaffold contém um frontend mínimo para carregar `clientes.csv` (via fetch de `/clientes.csv` na pasta `public` ou via upload), fazer autocomplete de clientes, preencher produto e preço, e salvar solicitações localmente (LocalStorage). Também permite exportar solicitações como `price_requests.csv`.

Instruções rápidas (Windows `cmd`):

1. Ir para a pasta do frontend:

```cmd
cd "c:\Users\PC 0025\Desktop\App Preços\frontend"
```

2. Instalar dependências:

```cmd
npm install
```

3. Rodar em desenvolvimento:

```cmd
npm run dev
```

4. Coloque seu `clientes.csv` em `frontend/public/clientes.csv` para que o app carregue automaticamente, ou use o botão de upload na UI.

Observações:
- No futuro podemos conectar diretamente ao backend para salvar solicitações em arquivo CSV no servidor ou em banco.
- Se quiser, posso adicionar MUI ou Tailwind e suporte PWA/SSO.
