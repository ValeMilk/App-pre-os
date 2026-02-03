import { z } from 'zod';

// Schema para Cliente (CSV)
export const ClienteSchema = z.object({
  codigo: z.string().min(1, 'Código do cliente é obrigatório'),
  nome_fantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  rede: z.string().optional(),
  rede_id: z.number().optional(),
  subrede: z.string().optional(),
  canal_venda: z.string().optional(),
  segmento: z.string().optional(),
  vendedor_code: z.string().optional(),
  vendedor_name: z.string().optional(),
  supervisor_code: z.string().optional(),
  supervisor_name: z.string().optional()
});

export type Cliente = z.infer<typeof ClienteSchema>;

// Schema para array de clientes
export const ClientesArraySchema = z.array(ClienteSchema);

// Schema para Produto (CSV)
export const ProdutoSchema = z.object({
  id: z.string().min(1, 'ID do produto é obrigatório'),
  codigo_produto: z.string().min(1, 'Código do produto é obrigatório'),
  nome_produto: z.string().min(1, 'Nome do produto é obrigatório'),
  minimo: z.string().optional(),
  maximo: z.string().optional(),
  promocional: z.string().optional()
});

export type Produto = z.infer<typeof ProdutoSchema>;

// Schema para array de produtos
export const ProdutosArraySchema = z.array(ProdutoSchema);

// Schema para Desconto (CSV)
export const DescontoSchema = z.object({
  rede: z.string().optional(),
  rede_id: z.number().optional(),
  subrede: z.string().optional(),
  codigo_produto: z.string().min(1, 'Código do produto é obrigatório'),
  nome_produto: z.string().min(1, 'Nome do produto é obrigatório'),
  desconto: z.string().min(1, 'Desconto é obrigatório'),
  e01_id: z.number().optional(),
  grupo: z.string().optional(),
  tipo_desconto: z.string().optional()
});

export type Desconto = z.infer<typeof DescontoSchema>;

// Schema para array de descontos
export const DescontosArraySchema = z.array(DescontoSchema);
