export interface Desconto {
  rede?: string;
  rede_id?: string; // ID da rede (A16_ID)
  subrede?: string;
  codigo_produto: string;
  nome_produto: string;
  desconto: string; // Percentual como "5,00%"
  e01_id?: number; // ID do grupo de produto
  grupo?: string; // Nome do grupo
  tipo_desconto?: string; // 'produto' ou 'grupo'
}
