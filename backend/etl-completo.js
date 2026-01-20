const sql = require('mssql');
const { Pool } = require('pg');

// Configuração SQL Server (via VPN)
const sqlConfig = {
  user: 'sa',
  password: 'Vale@2022',
  server: '192.168.254.5',
  database: 'DBACTIONS',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

// Configuração PostgreSQL (local VPS)
const pgPool = new Pool({
  host: 'localhost',
  database: 'dbactions',
  user: 'apiuser',
  password: 'Postgres@2026!',
  port: 5432
});

async function syncData() {
  let sqlConnection;
  
  try {
    console.log('=== Iniciando sincronização ===');
    
    // Conecta ao SQL Server
    console.log('Conectando ao SQL Server...');
    sqlConnection = await sql.connect(sqlConfig);
    console.log('✓ Conectado ao SQL Server');

    // ========== SYNC PRODUTOS ==========
    console.log('\n--- Sincronizando PRODUTOS ---');
    const produtosResult = await sqlConnection.request().query(`
      SELECT TOP 5000
        E02_ID,
        E02_LIVRE,
        E02_DESC
      FROM E02
      WHERE E02_TIPO = 1
      ORDER BY E02_ID
    `);

    await pgPool.query('DELETE FROM produtos');
    
    for (const row of produtosResult.recordset) {
      await pgPool.query(
        `INSERT INTO produtos (e02_id, e02_livre, e02_desc)
         VALUES ($1, $2, $3)`,
        [row.E02_ID, row.E02_LIVRE, row.E02_DESC]
      );
    }
    
    console.log(`✓ ${produtosResult.recordset.length} produtos sincronizados`);

    // ========== SYNC CLIENTES ==========
    console.log('\n--- Sincronizando CLIENTES ---');
    const clientesResult = await sqlConnection.request().query(`
      SELECT
        c.A00_STATUS,
        A16.A16_ID AS REDE_ID,
        A16.A16_DESC AS REDE,
        r.A43_DESC AS CANAL_DE_VENDA,
        t.A44_DESC AS SEGMENTO,
        c.A00_ID,
        c.A00_FANTASIA,
        c.A00_ID_VEND,
        v.A00_FANTASIA AS VENDEDOR,
        c.A00_ID_VEND_2,
        s.A00_FANTASIA AS SUPERVISOR
      FROM A00 c
      INNER JOIN A14 a ON c.A00_ID_A14 = a.A14_ID
      INNER JOIN A02 b ON c.A00_ID_A02 = b.A02_ID
      LEFT JOIN A00 v ON c.A00_ID_VEND = v.A00_ID
      LEFT JOIN A00 s ON c.A00_ID_VEND_2 = s.A00_ID
      LEFT JOIN A43 r ON c.A00_ID_A43 = r.A43_ID
      LEFT JOIN A44 t ON c.A00_ID_A44 = t.A44_ID
      LEFT JOIN A16 ON c.A00_ID_A16 = A16.A16_ID
      WHERE
        c.A00_EN_CL = 1
        AND c.A00_STATUS = 1
        AND a.A14_DESC IS NOT NULL
        AND a.A14_DESC NOT IN (
          '999 - L80-INDUSTRIA',
          '700 - L81 - REMESSA VENDA',
          '142 - L82-PARACURU-LICITAÇÃO',
          '147 - L82-PARAIPABA-LICITAÇÃO',
          '149 - L82-SGA-LICITAÇÃO',
          '000 - L82-EXTRA ROTA'
        )
    `);

    await pgPool.query('DELETE FROM clientes');
    
    for (const row of clientesResult.recordset) {
      await pgPool.query(
        `INSERT INTO clientes (
          a00_id, a00_fantasia, rede_id, rede, canal_de_venda, segmento,
          a00_id_vend, vendedor, a00_id_vend_2, supervisor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          row.A00_ID,
          row.A00_FANTASIA,
          row.REDE_ID,
          row.REDE,
          row.CANAL_DE_VENDA,
          row.SEGMENTO,
          row.A00_ID_VEND,
          row.VENDEDOR,
          row.A00_ID_VEND_2,
          row.SUPERVISOR
        ]
      );
    }
    
    console.log(`✓ ${clientesResult.recordset.length} clientes sincronizados`);

    // ========== SYNC DESCONTOS ==========
    console.log('\n--- Sincronizando DESCONTOS ---');
    const descontosResult = await sqlConnection.request().query(`
      SELECT
        a16.A16_ID,
        a16.A16_DESC,
        a16.A16_REM_DESC_VALOR as VALOR_DESCONTO,
        p.E02_ID,
        p.E02_LIVRE,
        p.E02_DESC
      FROM E08 e
      LEFT JOIN E02 p ON e.E08_ID_E02 = p.E02_ID
      LEFT JOIN A16 a16 ON e.E08_ID_A16 = a16.A16_ID
      WHERE a16.A16_ID IS NOT NULL
        AND p.E02_ID IS NOT NULL
      ORDER BY a16.A16_ID ASC, p.E02_ID ASC
    `);

    await pgPool.query('DELETE FROM descontos');
    
    let descontosCount = 0;
    for (const row of descontosResult.recordset) {
      await pgPool.query(
        `INSERT INTO descontos (
          rede_id, rede_desc, valor_desconto,
          produto_id, produto_livre, produto_desc
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (rede_id, produto_id) DO UPDATE SET
          rede_desc = EXCLUDED.rede_desc,
          valor_desconto = EXCLUDED.valor_desconto,
          produto_livre = EXCLUDED.produto_livre,
          produto_desc = EXCLUDED.produto_desc`,
        [
          row.A16_ID,
          row.A16_DESC,
          row.VALOR_DESCONTO,
          row.E02_ID,
          row.E02_LIVRE,
          row.E02_DESC
        ]
      );
      descontosCount++;
    }
    
    console.log(`✓ ${descontosCount} descontos sincronizados`);

    console.log('\n=== Sincronização concluída com sucesso! ===');
    
  } catch (err) {
    console.error('❌ Erro na sincronização:', err);
    throw err;
  } finally {
    if (sqlConnection) {
      await sqlConnection.close();
    }
    await pgPool.end();
  }
}

// Executa a sincronização
syncData()
  .then(() => {
    console.log('ETL finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('ETL falhou:', err);
    process.exit(1);
  });
