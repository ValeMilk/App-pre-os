const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dbactions',
  user: 'apiuser',
  password: 'Postgres@2026!',
});

async function importSubredes() {
  try {
    console.log('Criando tabela subredes...');
    
    // Criar tabela
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subredes (
        a00_id INTEGER PRIMARY KEY,
        rede VARCHAR(255),
        subrede VARCHAR(255),
        rede_fidelidade VARCHAR(255),
        cnpj_cpf VARCHAR(50)
      )
    `);
    
    console.log('Tabela criada. Limpando dados antigos...');
    await pool.query('DELETE FROM subredes');
    
    console.log('Lendo arquivo CSV...');
    const csvData = fs.readFileSync(__dirname + '/subrede_mapping.csv', 'utf-8');
    const lines = csvData.split('\n');
    
    let inserted = 0;
    let errors = 0;
    
    // Pular cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(';');
      if (parts.length < 5) continue;
      
      const [a00_id, rede, subrede, rede_fidelidade, cnpj_cpf] = parts;
      
      try {
        await pool.query(
          'INSERT INTO subredes (a00_id, rede, subrede, rede_fidelidade, cnpj_cpf) VALUES ($1, $2, $3, $4, $5)',
          [
            parseInt(a00_id) || null,
            rede || null,
            subrede === '-' ? null : subrede,
            rede_fidelidade === '-' ? null : rede_fidelidade,
            cnpj_cpf || null
          ]
        );
        inserted++;
      } catch (err) {
        console.error(`Erro na linha ${i}: ${err.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ Importação concluída!`);
    console.log(`   - Registros inseridos: ${inserted}`);
    console.log(`   - Erros: ${errors}`);
    
    // Verificar
    const result = await pool.query('SELECT COUNT(*) FROM subredes');
    console.log(`   - Total na tabela: ${result.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

importSubredes();
