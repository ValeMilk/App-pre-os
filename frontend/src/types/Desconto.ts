export interface Desconto {
  rede?: string;
  rede_id?: string; // ID da rede (A16_ID)
  subrede?: string;
  codigo_produto: string;
  nome_produto: string;
  desconto: string; // Percentual como "5,00%"
}
