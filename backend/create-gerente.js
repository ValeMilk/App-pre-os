// Script para criar usuário gerente
// Execute: node create-gerente.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelo User simplificado
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  tipo: { type: String, default: 'vendedor' },
  vendedor_code: String,
  codigo_supervisor: String,
  supervisor_name: String
});

const User = mongoose.model('User', userSchema);

async function createGerente() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:senha_segura_123@localhost:27018/price_requests?authSource=admin';
    
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB!');

    // Senha padrão
    const password = 'gerente123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se gerente já existe
    const existingGerente = await User.findOne({ email: 'gerente@admin.com' });
    if (existingGerente) {
      console.log('⚠️  Gerente já existe! Atualizando senha...');
      await User.updateOne(
        { email: 'gerente@admin.com' },
        { password: hashedPassword }
      );
      console.log('✅ Senha atualizada com sucesso!');
      console.log('📧 Email: gerente@admin.com');
      console.log('🔑 Senha: gerente123');
      await mongoose.disconnect();
      return;
    }

    // Criar gerente
    const gerente = await User.create({
      name: 'Gerente',
      email: 'gerente@admin.com',
      password: hashedPassword,
      tipo: 'gerente'
    });

    console.log('✅ Gerente criado com sucesso!');
    console.log('📧 Email: gerente@admin.com');
    console.log('🔑 Senha: gerente123');
    console.log('\n💡 Importante: Altere a senha após o primeiro login!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

createGerente();
