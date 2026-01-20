-- Tabela de descontos (relacionamento entre redes e produtos)
DROP TABLE IF EXISTS descontos;

CREATE TABLE descontos (
  -- Identificação da rede/desconto
  rede_id INTEGER NOT NULL,
  rede_desc VARCHAR(255),
  valor_desconto DECIMAL(10, 2),
  
  -- Identificação do produto
  produto_id INTEGER NOT NULL,
  produto_livre VARCHAR(50),
  produto_desc VARCHAR(255),
  
  -- Chave primária composta
  PRIMARY KEY (rede_id, produto_id)
);

-- Índices para melhorar performance de consultas
CREATE INDEX idx_descontos_rede ON descontos(rede_id);
CREATE INDEX idx_descontos_produto ON descontos(produto_id);
