#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 MONGO_URI:', process.env.MONGO_URI ? 'definido' : 'NÃO definido');
console.log('📝 Tentando conectar...\n');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Conexão bem-sucedida!');
    console.log('🏢 Banco de dados conectado\n');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Erro na conexão:');
    console.error(`   Código: ${err.code}`);
    console.error(`   Mensagem: ${err.message}`);
    console.log('\n💡 Possíveis causas:');
    console.log('   1. Senha do MongoDB Atlas incorreta');
    console.log('   2. IP não está na whitelist (Network Access)');
    console.log('   3. Problema de DNS/Internet');
    console.log('   4. Cluster não está ativo');
    process.exit(1);
  });
