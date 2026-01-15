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
    console.log('🔄 Tentando conectar ao SQL Server...');
    console.log(`📍 Server: ${config.server}:${config.port}`);
    console.log(`📦 Database: ${config.database}`);
    console.log('');

    // Conectar
    const pool = await sql.connect(config);
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
    console.log('');

    // Testar uma query simples
    const result = await pool.request().query('SELECT @@VERSION AS version');
    console.log('📊 Versão do SQL Server:');
    console.log(result.recordset[0].version);
    console.log('');

    // Listar tabelas disponíveis
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `);
    
    console.log('📋 Tabelas disponíveis no banco:');
    tables.recordset.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    await pool.close();
    console.log('');
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (err) {
    console.error('❌ ERRO NA CONEXÃO:');
    console.error(err.message);
    console.error('');
    console.error('Detalhes:', err);
  }
}

testConnection();
