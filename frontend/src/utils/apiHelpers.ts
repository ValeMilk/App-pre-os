import { Cliente } from '../types/Cliente';
import { Produto } from '../types/Produto';
import { Desconto } from '../types/Desconto';
import { API_ENDPOINTS } from '../config/api';

export async function fetchClientesFromAPI(): Promise<Cliente[]> {
  const response = await fetch(API_ENDPOINTS.data.clientes);
  if (!response.ok) throw new Error('Erro ao buscar clientes da API');
  const data = await response.json();
  
  console.log('🔍 Primeiros clientes da API (RAW):', data.slice(0, 2));
  
  // Mapear do formato SQL Server para Cliente
  const mapped = data.map((row: any) => ({
    codigo: String(row.A00_ID || ''),
    nome_fantasia: String(row.A00_FANTASIA || '').trim(),
    rede: row.REDE && row.REDE !== '-' ? String(row.REDE).trim() : undefined,
    subrede: row.SUBREDE && row.SUBREDE !== '-' ? String(row.SUBREDE).trim() : undefined,
    canal_venda: row.CANAL_DE_VENDA ? String(row.CANAL_DE_VENDA).trim() : undefined,
    segmento: row.SEGMENTO ? String(row.SEGMENTO).trim() : undefined,
    vendedor_code: String(row.CODIGO_VENDEDOR || '').trim(),
    vendedor_name: row.VENDEDOR ? String(row.VENDEDOR).trim() : undefined,
    supervisor_code: String(row.CODIGO_SUPERVISOR || '').trim(),
    supervisor_name: row.SUPERVISOR ? String(row.SUPERVISOR).trim() : undefined,
  }));
  
  console.log('✅ Clientes mapeados:', mapped.length, 'primeiros:', mapped.slice(0, 2));
  return mapped;
}

export async function fetchProdutosFromAPI(): Promise<Produto[]> {
  const response = await fetch(API_ENDPOINTS.data.produtos);
  if (!response.ok) throw new Error('Erro ao buscar produtos da API');
  const data = await response.json();
  
  // Mapear do formato SQL Server para Produto
  return data.map((row: any) => ({
    id: String(row.E02_ID || ''),
    codigo_produto: String(row.E02_LIVRE || ''),
    nome_produto: String(row.E02_DESC || '').trim(),
    maximo: row.TABELA_70 ? String(row.TABELA_70) : undefined,
    minimo: row.MINIMO ? String(row.MINIMO) : undefined,
    promocional: row.PROMO ? String(row.PROMO) : undefined,
  }));
}

// fetchDescontosFromAPI() removida - descontos agora são carregados dinamicamente
// por cliente usando fetchDescontosPorClienteFromAPI(clienteId)

/**
 * Busca descontos do cliente baseado na última compra (dinâmico)
 * @param clienteId Código do cliente
 * @returns Array com descontos aplicáveis
 */
export async function fetchDescontosPorClienteFromAPI(clienteId: string): Promise<any[]> {
  try {
    const url = `${API_ENDPOINTS.data.descontos}?clienteId=${clienteId}`;
    console.log(`📡 Chamando API de descontos:`, url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`❌ Erro ${response.status} ao buscar descontos para cliente ${clienteId}:`, errorText);
      return [];
    }
    
    const data = await response.json();
    
    console.log(`📊 Descontos carregados para cliente ${clienteId}:`, data.length, 'produtos');
    
    // Mapear do formato SQL Server para objeto normalizado
    return data.map((row: any) => ({
      cliente_codigo: row.cliente_codigo,
      produto_codigo: String(row.produto_codigo || '').trim(),
      codigo_produto: row.codigo_produto,
      desconto_percentual: Number(row.desconto_percentual || 0), // Ex: 0.05 para 5%
      produto_nome: String(row.produto_nome || '').trim(),
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar descontos por cliente:', error);
    return [];
  }
}

