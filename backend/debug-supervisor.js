#!/usr/bin/env node
/**
 * Script para debugar por que o supervisor JOAO NAZARENO não vê suas solicitações
 * Executar: node debug-supervisor.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri) {
  console.error('❌ MONGO_URI não definido no .env');
  process.exit(1);
}

// Simples schemas para debug
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  tipo: String,
  codigo_supervisor: String,
  vendedor_code: String
});

const priceRequestSchema = new mongoose.Schema({
  requester_name: String,
  requester_id: String,
  customer_name: String,
  codigo_supervisor: String,
  nome_supervisor: String,
  status: String,
  created_at: Date
});

const User = mongoose.model('User', userSchema);
const PriceRequest = mongoose.model('PriceRequest', priceRequestSchema);

async function debug() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado!\n');

    // 1. Buscar o supervisor JOAO NAZARENO
    console.log('📋 1️⃣  Buscando supervisor JOAO NAZARENO...');
    const supervisor = await User.findOne({ 
      $or: [
        { name: /JOAO NAZARENO/i },
        { email: /joao.*nazareno/i }
      ],
      tipo: 'supervisor'
    });

    if (!supervisor) {
      console.log('❌ Supervisor não encontrado no banco!');
      const allSupervisors = await User.find({ tipo: 'supervisor' });
      console.log('\n📊 Supervisores cadastrados:', allSupervisors.length);
      allSupervisors.forEach(s => {
        console.log(`   - ${s.name} (codigo: ${s.codigo_supervisor}) [${s.email}]`);
      });
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Encontrado: ${supervisor.name}`);
    console.log(`   ID: ${supervisor._id}`);
    console.log(`   Email: ${supervisor.email}`);
    console.log(`   Código Supervisor: ${supervisor.codigo_supervisor}`);
    console.log('');

    // 2. Buscar vendedores que deveriam ser subordinados dele
    console.log('📋 2️⃣  Buscando vendedores no banco...');
    const allVendors = await User.find({ tipo: 'vendedor' });
    console.log(`   Total de vendedores: ${allVendors.length}`);
    allVendors.slice(0, 5).forEach(v => {
      console.log(`   - ${v.name} (vendedor_code: ${v.vendedor_code}) [${v.email}]`);
    });
    console.log('');

    // 3. Verificar solicitações desse supervisor
    console.log('📋 3️⃣  Buscando solicitações onde codigo_supervisor === nome_supervisor...');
    const requestsByCodigo = await PriceRequest.find({
      codigo_supervisor: supervisor.codigo_supervisor
    });
    console.log(`   Solicitações com codigo_supervisor "${supervisor.codigo_supervisor}": ${requestsByCodigo.length}`);
    if (requestsByCodigo.length > 0) {
      requestsByCodigo.slice(0, 3).forEach(r => {
        console.log(`   - ${r.customer_name} (${r.status})`);
      });
    }

    const requestsByNome = await PriceRequest.find({
      nome_supervisor: supervisor.name
    });
    console.log(`   Solicitações com nome_supervisor "${supervisor.name}": ${requestsByNome.length}`);
    if (requestsByNome.length > 0) {
      requestsByNome.slice(0, 3).forEach(r => {
        console.log(`   - ${r.customer_name} (${r.status})`);
      });
    }
    console.log('');

    // 4. Verificar TODOS os código_supervisor únicos nas solicitações
    console.log('📋 4️⃣  Supervisores únicos nas solicitações...');
    const supervisorUnicos = await PriceRequest.aggregate([
      {
        $group: {
          _id: {
            codigo: '$codigo_supervisor',
            nome: '$nome_supervisor'
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    console.log(`   ${supervisorUnicos.length} supervisores únicos:`);
    supervisorUnicos.forEach(s => {
      console.log(`   - ${s._id.nome} (codigo: ${s._id.codigo}): ${s.total} solicitações`);
    });
    console.log('');

    // 5. Análise final
    console.log('📋 5️⃣  DIAGNÓSTICO:');
    const joaoCodigoPresente = supervisorUnicos.some(s => s._id.codigo === supervisor.codigo_supervisor);
    const joaoNomePresente = supervisorUnicos.some(s => s._id.nome === supervisor.name);

    if (!joaoCodigoPresente && !joaoNomePresente) {
      console.log('❌ PROBLEMA: Nenhuma solicitação foi salva com o código ou nome deste supervisor!');
      console.log('   Possíveis causas:');
      console.log('   1. O CSV de clientes não está sendo carregado no frontend');
      console.log('   2. Os clientes não têm a informação de supervisor correspondente');
      console.log('   3. O supervisor_code/supervisor_name não está sendo enviado ao criar solicitação');
    } else if (joaoCodigoPresente && !joaoNomePresente) {
      console.log('⚠️  AVISO: Solicitações salvas com CÓDIGO, mas a rota pode estar procurando por NOME');
    } else if (!joaoCodigoPresente && joaoNomePresente) {
      console.log('⚠️  AVISO: Solicitações salvas com NOME, mas a rota pode estar procurando por CÓDIGO');
    } else {
      console.log('✅ OK: Solicitações encontradas com código e/ou nome do supervisor');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

debug();
