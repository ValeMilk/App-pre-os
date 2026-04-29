/**
 * Script para verificar e listar supervisores únicos do CSV de clientes
 * Execute: node check-supervisores.js
 */

const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../frontend/public/clientes.csv');

try {
  const data = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = data.split('\n');
  
  // Pular o header
  const dataLines = lines.slice(1);
  
  const supervisores = new Map();
  
  dataLines.forEach((line, index) => {
    const columns = line.split(';');
    
    if (columns.length >= 10) {
      const codigo = columns[8]?.trim();
      const nome = columns[9]?.trim();
      
      if (codigo && nome && codigo !== '-' && nome !== '-') {
        if (!supervisores.has(codigo)) {
          supervisores.set(codigo, {
            codigo,
            nome,
            count: 0
          });
        }
        supervisores.get(codigo).count++;
      }
    }
  });
  
  console.log('\n=== SUPERVISORES ENCONTRADOS NO CSV ===\n');
  console.log(`Total de supervisores únicos: ${supervisores.size}\n`);
  
  const sorted = Array.from(supervisores.values()).sort((a, b) => b.count - a.count);
  
  sorted.forEach((sup, i) => {
    console.log(`${i + 1}. Código: ${sup.codigo} | Nome: ${sup.nome} | Clientes: ${sup.count}`);
  });
  
  console.log('\n=== COMANDOS PARA CADASTRAR SUPERVISORES (Via API) ===\n');
  console.log('Execute cada comando com o token de admin:\n');
  
  sorted.forEach((sup, i) => {
    const email = sup.nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '.') + '@vale.com';
    
    console.log(`# ${i + 1}. ${sup.nome}`);
    console.log(`curl -X POST http://localhost:5000/api/auth/supervisor-register \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \\`);
    console.log(`  -d '{`);
    console.log(`    "name": "${sup.nome}",`);
    console.log(`    "email": "${email}",`);
    console.log(`    "password": "senha${sup.codigo}",`);
    console.log(`    "codigo_supervisor": "${sup.codigo}"`);
    console.log(`  }'\n`);
  });
  
  console.log('\n=== SCRIPT MONGODB PARA VERIFICAR SUPERVISORES CADASTRADOS ===\n');
  console.log('db.users.find({ tipo: "supervisor" }, { name: 1, email: 1, codigo_supervisor: 1 }).pretty()\n');
  
  console.log('\n=== SCRIPT MONGODB PARA ATUALIZAR CÓDIGO (Se necessário) ===\n');
  sorted.forEach((sup, i) => {
    const email = sup.nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '.') + '@vale.com';
    
    console.log(`// ${i + 1}. ${sup.nome}`);
    console.log(`db.users.updateOne(`);
    console.log(`  { email: "${email}" },`);
    console.log(`  { $set: { codigo_supervisor: "${sup.codigo}" } }`);
    console.log(`)\n`);
  });
  
} catch (error) {
  console.error('Erro ao ler o arquivo CSV:', error.message);
  process.exit(1);
}
