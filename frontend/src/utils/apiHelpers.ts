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

export async function fetchDescontosFromAPI(): Promise<Desconto[]> {
  const response = await fetch(API_ENDPOINTS.data.descontos);
  if (!response.ok) throw new Error('Erro ao buscar descontos da API');
  const data = await response.json();
  
  // Mapear do formato PostgreSQL para Desconto
  return data.map((row: any) => ({
    rede: row.rede_desc ? String(row.rede_desc).trim() : undefined,
    rede_id: row.rede_id ? String(row.rede_id) : undefined,
    codigo_produto: String(row.produto_livre || ''),
    nome_produto: String(row.produto_desc || ''),
    desconto: row.valor_desconto ? `${parseFloat(row.valor_desconto).toFixed(2).replace('.', ',')}%` : '0,00%',
  }));
}

