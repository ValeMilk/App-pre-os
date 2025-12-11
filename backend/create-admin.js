// Script para criar usuário administrador
// Execute: node create-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelo User simplificado
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  tipo: { type: String, default: 'vendedor' },
  vendedor_code: String,
  codigo_supervisor: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:senha_segura_123@localhost:27018/price_requests?authSource=admin';
    
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB!');

    // Verificar se admin já existe
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin já existe!');
      console.log('📧 Email: admin@admin.com');
      await mongoose.disconnect();
      return;
    }

    // Criar senha hash
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar admin
    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@admin.com',
      password: hashedPassword,
      tipo: 'admin'
    });

    console.log('✅ Administrador criado com sucesso!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Senha: admin123');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    await mongoose.disconnect();
    console.log('👋 Desconectado do MongoDB');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdmin();
