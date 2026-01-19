const sql = require('mssql');
const { Pool } = require('pg');

// SQL Server config
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

// PostgreSQL config
const pgPool = new Pool({
  host: 'localhost',
  database: 'dbactions',
  user: 'apiuser',
  password: 'Postgres@2026!',
  port: 5432
});

async function syncProdutos() {
  console.log('🔄 Sincronizando produtos...');

  const sqlPool = await sql.connect(sqlConfig);
  const result = await sqlPool.request().query(`
    SELECT
      E02_ID,
      E02_LIVRE,
      E02_DESC,
      E02_PRECO AS TABELA_70,
      E02_PRECO_02 AS MINIMO,
      E02_PRECO_03 AS PROMO
    FROM e02 WITH (NOLOCK)
    WHERE
      E02_TIPO = '04'
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

  for (const row of result.recordset) {
    await pgPool.query(
      'INSERT INTO produtos (e02_id, e02_livre, e02_desc, tabela_70, minimo, promo) VALUES ($1, $2, $3, $4, $5, $6)',
      [row.E02_ID, row.E02_LIVRE, row.E02_DESC, row.TABELA_70, row.MINIMO, row.PROMO]
    );
  }

  console.log(`✅ ${result.recordset.length} produtos sincronizados`);
  await sqlPool.close();
}

async function syncClientes() {
  console.log('🔄 Sincronizando clientes...');

  const sqlPool = await sql.connect(sqlConfig);
  const result = await sqlPool.request().query(`
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

  let inserted = 0;
  let errors = 0;

  for (const row of result.recordset) {
    try {
      await pgPool.query(
        `INSERT INTO clientes (
          a00_id, a00_fantasia, rede_id, rede, canal_de_venda, segmento, 
          a00_id_vend, vendedor, a00_id_vend_2, supervisor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          row.A00_ID,
          row.A00_FANTASIA,
          row.REDE_ID || null,
          row.REDE || null,
          row.CANAL_DE_VENDA || null,
          row.SEGMENTO || null,
          row.A00_ID_VEND || null,
          row.VENDEDOR || null,
          row.A00_ID_VEND_2 || null,
          row.SUPERVISOR || null
        ]
      );
      inserted++;
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`❌ Erro ao inserir cliente ID ${row.A00_ID}:`, err.message);
      }
    }
  }

  console.log(`✅ ${inserted} clientes sincronizados (${errors} erros)`);
  await sqlPool.close();
}

async function main() {
  try {
    await syncProdutos();
    await syncClientes();
    console.log('✅ ETL concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await pgPool.end();
  }
}

main();
