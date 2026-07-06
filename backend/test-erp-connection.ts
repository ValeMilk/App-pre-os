import 'dotenv/config';
import { erpService } from './src/services/ERPService';

async function testConnection() {
  try {
    console.log('🔌 Testando conexão com SQL Server...\n');

    // Teste 1: Conectar
    console.log('1️⃣ Conectando...');
    await erpService.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Teste 2: Buscar clientes
    console.log('2️⃣ Buscando clientes...');
    const clientes = await erpService.getClientes();
    console.log(`✅ ${clientes.length} clientes encontrados`);
    if (clientes.length > 0) {
      console.log('📋 Exemplo:', clientes[0]);
    }
    console.log();

    // Teste 3: Buscar produtos
    console.log('3️⃣ Buscando produtos...');
    const produtos = await erpService.getProdutos();
    console.log(`✅ ${produtos.length} produtos encontrados`);
    if (produtos.length > 0) {
      console.log('📦 Exemplo:', produtos[0]);
    }
    console.log();

    // Teste 4: Buscar descontos
    console.log('4️⃣ Buscando descontos...');
    const descontos = await erpService.getDescontos();
    console.log(`✅ ${descontos.length} descontos encontrados\n`);

    console.log('🎉 Todos os testes passaram!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await erpService.disconnect();
  }
}

testConnection();
