const sql = require('mssql');

async function testConnection() {
  console.log('=== SQL Server Connection Diagnostic ===\n');

  const configs = [
    {
      name: 'TCP/IP (Standard)',
      config: {
        server: '10.1.0.3',
        instance: 'SQLSTANDARD',
        authentication: { type: 'default', options: { userName: 'analistarpt', password: 'mM=DU9lUd3C$qb@' } },
        options: { encrypt: false, trustServerCertificate: true, connectTimeout: 5000 }
      }
    },
    {
      name: 'TCP/IP (Explicit Port)',
      config: {
        server: '10.1.0.3',
        port: 1433,
        authentication: { type: 'default', options: { userName: 'analistarpt', password: 'mM=DU9lUd3C$qb@' } },
        options: { encrypt: false, trustServerCertificate: true, connectTimeout: 5000 }
      }
    },
    {
      name: 'Named Pipes',
      config: {
        server: '10.1.0.3\\SQLSTANDARD',
        authentication: { type: 'default', options: { userName: 'analistarpt', password: 'mM=DU9lUd3C$qb@' } },
        options: { encrypt: false, trustServerCertificate: true, connectTimeout: 5000 }
      }
    }
  ];

  for (const test of configs) {
    console.log(`\n[${test.name}]`);
    try {
      const pool = new sql.ConnectionPool(test.config);
      await pool.connect();
      console.log('✅ SUCCESS - Connected!');
      
      try {
        const result = await pool.request().query('SELECT @@VERSION');
        console.log('✅ Query executed successfully');
        console.log(`   Version: ${result.recordset[0]['']}`);
      } catch (queryErr) {
        console.error('❌ Query failed:', queryErr.message);
      }
      
      await pool.close();
    } catch (err) {
      console.error('❌ FAILED -', err.message);
      if (err.originalError) {
        console.error('   Original:', err.originalError.message);
      }
    }
  }
}

testConnection().catch(console.error);
