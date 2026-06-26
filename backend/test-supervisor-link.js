#!/usr/bin/env node
/**
 * Script para simular a criação de uma solicitação de preço
 * e verificar se o supervisor está sendo vinculado corretamente
 */

require('dotenv').config();
const mongoose = require('mongoose');

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
  requested_price: String,
  quantity: String,
  product_maximo: String,
  product_minimo: String,
  product_promocional: String,
  currency: String,
  status: String,
  notes: String,
  codigo_supervisor: String,
  nome_supervisor: String,
  discount_percent: String,
  discounted_price: String,
  created_at: { type: Date, default: Date.now }
});

const PriceRequest = mongoose.model('PriceRequest', priceRequestSchema);

async function test() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado!\n');

    // Criar uma solicitação de teste com JOAO NAZARENO (11746)
    console.log('📝 Criando solicitação de teste com supervisor JOAO NAZARENO (11746)...');
    
    const testRequest = await PriceRequest.create({
      requester_name: 'FABRICIO GALDENCIO BRAGA',
      requester_id: 'vendor_123',
      customer_code: '12894',
      customer_name: 'SUPERMERCADO SKINAO',
      product_id: 'E02001',
      product_name: 'LEITE INTEGRAL',
      requested_price: '3.50',
      quantity: '100',
      product_maximo: '4.00',
      product_minimo: '3.00',
      product_promocional: '2.80',
      currency: 'R$',
      status: 'Pendente',
      notes: 'Solicitação de teste para debug',
      codigo_supervisor: '11746',  // ← IMPORTANTE!
      nome_supervisor: 'JOAO NAZARENO AIRES BARBOSA',  // ← IMPORTANTE!
      discount_percent: '5.00',
      discounted_price: '3.33'
    });

    console.log(`✅ Solicitação criada: ${testRequest._id}`);
    console.log(`   Supervisor: ${testRequest.nome_supervisor} (${testRequest.codigo_supervisor})\n`);

    // Agora buscar com os mesmos critérios que o backend usa
    console.log('🔍 Testando busca por codigo_supervisor = "11746"...');
    const found1 = await PriceRequest.find({ codigo_supervisor: '11746' });
    console.log(`   Encontradas: ${found1.length} solicitações`);

    console.log('\n🔍 Testando busca por nome_supervisor = "JOAO NAZARENO AIRES BARBOSA"...');
    const found2 = await PriceRequest.find({ nome_supervisor: 'JOAO NAZARENO AIRES BARBOSA' });
    console.log(`   Encontradas: ${found2.length} solicitações`);

    console.log('\n🔍 Testando com $or (como faz a rota)...');
    const found3 = await PriceRequest.find({
      $or: [
        { codigo_supervisor: '11746' },
        { nome_supervisor: 'JOAO NAZARENO AIRES BARBOSA' }
      ]
    });
    console.log(`   Encontradas: ${found3.length} solicitações`);

    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    await PriceRequest.deleteOne({ _id: testRequest._id });
    console.log('✅ Teste concluído!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

test();
