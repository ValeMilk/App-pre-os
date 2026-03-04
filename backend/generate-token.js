const jwt = require('jsonwebtoken');

// JWT Secret usado em produção (do DEPLOY_GUIDE.md)
const JWT_SECRET = 'Kj8!sD9@2lQwZx7pLmN4vRtY';

// Dados do usuário Admin
const payload = {
  userId: '6929c2a0cbe992f869756799',
  name: 'Admin',
  email: 'admin@admin.com',
  tipo: 'admin'
};

// Gerar token com expiração de 10 anos (praticamente fixo)
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '10y' });

console.log('\n🔑 TOKEN JWT GERADO (VÁLIDO POR 10 ANOS):\n');
console.log(token);
console.log('\n📅 Válido por: 10 anos (praticamente fixo)');
console.log('👤 Usuário: Admin (admin@admin.com)');
console.log('🎫 Tipo: admin\n');

// Decodificar para mostrar informações
const decoded = jwt.decode(token);
console.log('📋 Informações do token:');
console.log('   - Criado em:', new Date(decoded.iat * 1000).toLocaleString('pt-BR'));
console.log('   - Expira em:', new Date(decoded.exp * 1000).toLocaleString('pt-BR'));
console.log('\n✅ Copie o token acima e atualize no Power BI!\n');
