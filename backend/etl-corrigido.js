const sql = require('mssql');
const { Pool } = require('pg');

// Configuração SQL Server (via VPN)
const sqlConfig = {
  user: 'analistarpt',
  password: 'mM=DU9lUd3C$qb@',
  server: '10.1.0.3\\SQLSTANDARD',
  database: 'dbactions',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
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
      SELECT
        E02_ID,
        E02_LIVRE,
        E02_DESC,
        E02_PRECO AS TABELA_70,
        E02_PRECO_02 AS MINIMO,
        E02_PRECO_03 AS PROMO
      FROM E02 WITH (NOLOCK)
      WHERE E02_TIPO = '04'
        AND E02_ID <> '58'
        AND (
          E02_DESC IS NULL
          OR (
            E02_DESC NOT LIKE '%(INATIVO)%'
            AND E02_DESC NOT LIKE '%(INATIVADO)%'
            AND E02_DESC NOT LIKE '%(PASTEURIZADO)%'
          )
        )
      ORDER BY E02_ID ASC
    `);

    await pgPool.query('DELETE FROM produtos');
    
    for (const row of produtosResult.recordset) {
      await pgPool.query(
        `INSERT INTO produtos (e02_id, e02_livre, e02_desc, tabela_70, minimo, promo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.E02_ID, row.E02_LIVRE, row.E02_DESC, row.TABELA_70, row.MINIMO, row.PROMO]
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

    // ========== SYNC DESCONTOS (PRODUTO) ==========
    console.log('\n--- Sincronizando DESCONTOS (Produto) ---');
    const descontosResult = await sqlConnection.request().query(`
      SELECT
        a16.A16_ID,
        a16.A16_DESC,
        a16.A16_REM_DESC_VALOR AS VALOR_DESCONTO,
        p.E02_ID,
        p.E02_LIVRE,
        p.E02_DESC,
        g.E01_ID,
        g.E01_DESC as GRUPO
      FROM E08 e
      LEFT JOIN E02 p ON e.E08_ID_E02 = p.E02_ID
      LEFT JOIN A16 a16 ON e.E08_ID_A16 = a16.A16_ID
      LEFT JOIN E01 g ON p.E02_ID_E01 = g.E01_ID
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
          produto_id, produto_livre, produto_desc,
          e01_id, grupo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (rede_id, produto_id) DO UPDATE SET
          rede_desc = EXCLUDED.rede_desc,
          valor_desconto = EXCLUDED.valor_desconto,
          produto_livre = EXCLUDED.produto_livre,
          produto_desc = EXCLUDED.produto_desc,
          e01_id = EXCLUDED.e01_id,
          grupo = EXCLUDED.grupo`,
        [
          row.A16_ID,
          row.A16_DESC,
          row.VALOR_DESCONTO,
          row.E02_ID,
          row.E02_LIVRE,
          row.E02_DESC,
          row.E01_ID,
          row.GRUPO
        ]
      );
      descontosCount++;
    }
    
    console.log(`✓ ${descontosCount} descontos por produto sincronizados`);

    // ========== SYNC DESCONTOS POR GRUPO/CONTRATO ==========
    console.log('\n--- Sincronizando DESCONTOS POR CONTRATO (Grupo) ---');
    const descontosGrupoResult = await sqlConnection.request().query(`
      SELECT
        A23.A23_ID,
        A23.A23_DESC,
        A23.A23_ID_A16,
        A24.A24_ID_E01,
        A24.A24_DESC_PERC,
        c.E01_DESC
      FROM A23
      LEFT JOIN A24 ON A24.A24_ID_A23 = A23.A23_ID
      LEFT JOIN E01 c ON A24.A24_ID_E01 = c.E01_ID
      WHERE A23.A23_ID_A16 IS NOT NULL
        AND A23.A23_ID_A16 <> 0
        AND A24.A24_ID_E01 IS NOT NULL
      ORDER BY A23.A23_ID_A16, A24.A24_ID_E01
    `);

    let descontosGrupoCount = 0;
    for (const row of descontosGrupoResult.recordset) {
      await pgPool.query(
        `INSERT INTO descontos (
          rede_id, rede_desc, valor_desconto,
          e01_id, grupo, tipo_desconto,
          a23_id, a23_desc, a24_id_e01,
          produto_id, produto_livre, produto_desc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (rede_id, produto_id) DO NOTHING`,
        [
          row.A23_ID_A16,
          row.A23_DESC,
          row.A24_DESC_PERC,
          row.A24_ID_E01,
          row.E01_DESC,
          'grupo',
          row.A23_ID,
          row.A23_DESC,
          row.A24_ID_E01,
          -row.A24_ID_E01,
          '',
          ''
        ]
      );
      descontosGrupoCount++;
    }
    
    console.log(`✓ ${descontosGrupoCount} descontos por grupo sincronizados`);

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
