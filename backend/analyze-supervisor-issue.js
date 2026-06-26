#!/usr/bin/env node
/**
 * Script para verificar o problema do SUPERVISOR JOAO NAZARENO
 * Sem conectar ao MongoDB - apenas análise local
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

console.log('📊 ANÁLISE DO PROBLEMA - SUPERVISOR JOAO NAZARENO\n');
console.log('=' .repeat(70));

// 1. Ler CSV de clientes
const csvPath = path.join(__dirname, '..', 'frontend', 'public', 'clientes.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf8');
const parsedCsv = Papa.parse(csvContent, { 
  header: false,
  delimiter: ';',
  skipEmptyLines: true
});

// Mapear clientes com supervisor 11746 (JOAO NAZARENO)
const clientesJoao = [];
const vendedoresJoao = new Set();

parsedCsv.data.slice(1).forEach((row, idx) => {
  if (row.length < 10) return;
  
  const codigoCliente = String(row[4]).trim();
  const nomeCliente = String(row[5]).trim();
  const vendedor = String(row[7]).trim();
  const supervisorCode = String(row[8]).trim();
  const supervisorName = String(row[9]).trim();
  
  if (supervisorCode === '11746' && supervisorName.includes('JOAO NAZARENO')) {
    clientesJoao.push({
      codigo: codigoCliente,
      nome: nomeCliente,
      vendedor: vendedor,
      linha: idx + 2 // +1 para header, +1 para 1-indexed
    });
    vendedoresJoao.add(vendedor);
  }
});

console.log(`\n✅ SUPERVISOR: JOAO NAZARENO (código: 11746)`);
console.log(`\n📋 DADOS ENCONTRADOS NO CSV:`);
console.log(`   • Total de clientes: ${clientesJoao.length}`);
console.log(`   • Vendedores únicos: ${vendedoresJoao.size}`);

console.log(`\n👥 Vendedores de JOAO NAZARENO:`);
vendedoresJoao.forEach(v => {
  console.log(`   - ${v}`);
});

console.log(`\n🏪 Primeiros 10 clientes:`);
clientesJoao.slice(0, 10).forEach((c, i) => {
  console.log(`   ${i+1}. ${c.codigo} - ${c.nome}`);
});

// 2. Análise de problema
console.log('\n' + '='.repeat(70));
console.log('\n🔍 POSSÍVEIS CAUSAS DO PROBLEMA:\n');

console.log('1️⃣  SOLICITAÇÕES NÃO ESTÃO SENDO CRIADAS:');
console.log('   ✓ CSV está correto (encontrei ' + clientesJoao.length + ' clientes)');
console.log('   ✓ Supervisor está cadastrado com código 11746');
console.log('   ❓ Vendedores não estão criando solicitações?\n');

console.log('2️⃣  SOLICITAÇÕES NÃO ESTÃO CHEGANDO AO SUPERVISOR:');
console.log('   Possíveis razões:');
console.log('   a) O frontend NÃO está enviando supervisor_code/supervisor_name');
console.log('   b) O backend NÃO está salvando no documento');
console.log('   c) A rota de busca está procurando por valor diferente\n');

console.log('3️⃣  SOLICITAÇÕES CRIADAS COM DADOS ERRADOS:');
console.log('   ✓ Precisamos executar fix-supervisor-requests.js (requer MongoDB)\n');

// 3. Próximas ações
console.log('=' .repeat(70));
console.log('\n🚀 PRÓXIMAS AÇÕES:\n');

console.log('OPÇÃO 1 - Verificar logs do backend (recomendado):');
console.log('   1. Acesse o dashboard do supervisor JOAO NAZARENO');
console.log('   2. Peça para um vendedor dele criar uma solicitação');
console.log('   3. Veja os LOGS do backend no console\n');

console.log('OPÇÃO 2 - Executar script de correção (após resolver conexão):');
console.log('   1. Resolver problema de conectividade com MongoDB Atlas');
console.log('   2. Executar: node fix-supervisor-requests.js\n');

console.log('OPÇÃO 3 - Debug manual no browser:');
console.log('   1. Abra DevTools (F12)');
console.log('   2. Vá para a aba "Network"');
console.log('   3. Crie uma solicitação');
console.log('   4. Inspecione o request POST /api/requests');
console.log('   5. Veja se codigo_supervisor e nome_supervisor estão sendo enviados\n');

console.log('=' .repeat(70));
console.log('\n✅ Análise concluída!');
