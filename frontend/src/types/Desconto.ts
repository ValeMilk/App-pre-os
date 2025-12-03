export interface Desconto {
  rede?: string;
  subrede?: string;
  codigo_produto: string;
  nome_produto: string;
  desconto: string; // Percentual como "5,00%"
}
