#!/usr/bin/env node
/**
 * Script para corrigir solicitações sem supervisor preenchido
 * Lê o CSV de clientes e atualiza as solicitações com os dados corretos
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Papa = require('papaparse');

const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri) {
  console.error('❌ MONGO_URI não definido no .env');
  console.log('\n📝 Por favor, crie um arquivo .env com:');
  console.log('MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/dbname');
  process.exit(1);
}

// Simples schemas
const priceRequestSchema = new mongoose.Schema({
  requester_name: String,
  requester_id: String,
  customer_code: String,
  customer_name: String,
  product_id: String,
  product_name: String,
  codigo_supervisor: String,
  nome_supervisor: String,
  status: String,
  created_at: { type: Date, default: Date.now }
}, { strict: false }); // Aceitar outros campos

const PriceRequest = mongoose.model('PriceRequest', priceRequestSchema);

async function fix() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado!\n');

    // Carregar CSV de clientes
    console.log('📖 Carregando arquivo clientes.csv...');
    const csvPath = path.join(__dirname, '..', 'frontend', 'public', 'clientes.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Arquivo não encontrado: ${csvPath}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsedCsv = Papa.parse(csvContent, { 
      header: false,
      delimiter: ';',
      skipEmptyLines: true
    });

    const clienteMap = new Map(); // codigo_cliente -> { supervisor_code, supervisor_name }
    
    // Processar CSV
    parsedCsv.data.slice(1).forEach(row => {
      if (row.length < 10) return;
      
      const codigoCliente = String(row[4]).trim();
      const supervisorCode = String(row[8]).trim();
      const supervisorName = String(row[9]).trim();
      
      if (codigoCliente && supervisorCode) {
        clienteMap.set(codigoCliente, {
          supervisor_code: supervisorCode,
          supervisor_name: supervisorName
        });
      }
    });

    console.log(`✅ ${clienteMap.size} clientes mapeados no CSV\n`);

    // Buscar solicitações sem supervisor OU com supervisor inválido
    console.log('🔍 Buscando solicitações para correção...');
    const requestsToFix = await PriceRequest.find({
      $or: [
        { codigo_supervisor: null },
        { codigo_supervisor: '' },
        { codigo_supervisor: undefined },
        { nome_supervisor: null },
        { nome_supervisor: '' }
      ]
    }).sort({ created_at: -1 });

    console.log(`   Encontradas ${requestsToFix.length} solicitações para corrigir\n`);

    if (requestsToFix.length === 0) {
      console.log('✅ Nenhuma solicitação para corrigir!');
      await mongoose.disconnect();
      return;
    }

    // Corrigir uma por uma
    let corrigidas = 0;
    let naoEncontradas = 0;

    for (const req of requestsToFix) {
      const clienteKey = req.customer_code?.toString();
      const supervisor = clienteMap.get(clienteKey);

      if (supervisor) {
        await PriceRequest.updateOne(
          { _id: req._id },
          {
            codigo_supervisor: supervisor.supervisor_code,
            nome_supervisor: supervisor.supervisor_name
          }
        );
        corrigidas++;
        console.log(`   ✅ Corrigida: ${req.customer_name} → Supervisor: ${supervisor.supervisor_name}`);
      } else {
        naoEncontradas++;
        console.log(`   ⚠️  Não encontrado no CSV: ${req.customer_code} (${req.customer_name})`);
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   ✅ Corrigidas: ${corrigidas}`);
    console.log(`   ⚠️  Não encontradas: ${naoEncontradas}`);

    // Verificar quantas solicitações tem JOAO NAZARENO agora
    console.log(`\n🔍 Verificando solicitações de JOAO NAZARENO (11746)...`);
    const joaoRequests = await PriceRequest.find({
      $or: [
        { codigo_supervisor: '11746' },
        { nome_supervisor: /JOAO NAZARENO/i }
      ]
    });
    console.log(`   ✅ Total: ${joaoRequests.length} solicitações`);

    await mongoose.disconnect();
    console.log('\n✅ Correção concluída!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err);
    process.exit(1);
  }
}

fix();
