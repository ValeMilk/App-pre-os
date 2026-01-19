import { Cliente } from '../types/Cliente';
import { Produto } from '../types/Produto';
import { API_ENDPOINTS } from '../config/api';

export async function fetchClientesFromAPI(): Promise<Cliente[]> {
  const response = await fetch(API_ENDPOINTS.data.clientes);
  if (!response.ok) throw new Error('Erro ao buscar clientes da API');
  const data = await response.json();
  
  // Mapear do formato PostgreSQL para Cliente
  return data.map((row: any) => ({
    codigo: String(row.a00_id || ''),
    nome_fantasia: String(row.a00_fantasia || ''),
    rede: row.rede || undefined,
    subrede: row.subrede && row.subrede !== '-' ? row.subrede : undefined,
    canal_venda: row.canal_de_venda || undefined,
    segmento: row.segmento || undefined,
    vendedor_id: row.a00_id_vend ? String(row.a00_id_vend) : undefined,
    vendedor_name: row.vendedor || undefined,
    supervisor_id: row.a00_id_vend_2 ? String(row.a00_id_vend_2) : undefined,
    supervisor_name: row.supervisor || undefined,
  }));
}

export async function fetchProdutosFromAPI(): Promise<Produto[]> {
  const response = await fetch(API_ENDPOINTS.data.produtos);
  if (!response.ok) throw new Error('Erro ao buscar produtos da API');
  const data = await response.json();
  
  // Mapear do formato PostgreSQL para Produto
  return data.map((row: any) => ({
    id: String(row.e02_id || ''),
    codigo_produto: String(row.e02_livre || ''),
    nome_produto: String(row.e02_desc || ''),
    maximo: row.tabela_70 ? String(row.tabela_70) : undefined,
    minimo: row.minimo ? String(row.minimo) : undefined,
    promocional: row.promo ? String(row.promo) : undefined,
  }));
}
