#!/bin/bash
# Script para configurar a VPS e testar conexão SQL Server

echo "🚀 Configurando VPS Hostinger..."
echo ""

# Verificar Node.js
echo "1️⃣ Verificando Node.js..."
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    echo "✅ Node.js instalado!"
else
    echo "✅ Node.js já instalado: $(node -v)"
fi

echo ""
echo "2️⃣ Criando diretório de teste..."
mkdir -p /root/sql-test
cd /root/sql-test

echo ""
echo "3️⃣ Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "sql-test",
  "version": "1.0.0",
  "dependencies": {
    "mssql": "^10.0.1"
  }
}
EOF

echo ""
echo "4️⃣ Instalando mssql..."
npm install

echo ""
echo "5️⃣ Criando script de teste..."
cat > test-connection.js << 'EOF'
const sql = require('mssql');

const config = {
  server: '10.1.0.3\\SQLSTANDARD',
  port: 50140,
  database: 'dbactions',
  user: 'analistarpt',
  password: 'mM=DU9lUd3C$qb@',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'SQLSTANDARD'
  }
};

async function testConnection() {
  try {
    console.log('🔄 Testando conexão SQL Server DA VPS...');
    console.log(`📍 Server: ${config.server}:${config.port}`);
    console.log(`📦 Database: ${config.database}`);
    console.log('');

    const pool = await sql.connect(config);
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO DA VPS!');
    console.log('');

    const result = await pool.request().query('SELECT @@VERSION AS version');
    console.log('📊 SQL Server versão:');
    console.log(result.recordset[0].version.substring(0, 150));
    console.log('');

    const tables = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    console.log(`📋 Total de tabelas: ${tables.recordset[0].total}`);

    await pool.close();
    console.log('');
    console.log('🎉 SUCESSO! A VPS consegue acessar o SQL Server!');
    
  } catch (err) {
    console.error('❌ ERRO NA CONEXÃO DA VPS:');
    console.error(err.message);
    console.error('');
    console.error('Verifique se:');
    console.error('1. A VPN está ativa na VPS');
    console.error('2. O IP 10.1.0.3 está acessível');
    console.error('3. A porta 50140 está liberada');
  }
}

testConnection();
EOF

echo ""
echo "6️⃣ Executando teste..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node test-connection.js
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
