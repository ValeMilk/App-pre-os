-- Script de inicialização do banco de dados PostgreSQL
-- Este script é executado automaticamente quando o container é criado

-- Criar tabelas se não existirem

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    e02_id INTEGER PRIMARY KEY,
    e02_livre VARCHAR(50),
    e02_desc VARCHAR(255),
    tabela_70 NUMERIC(10, 2),
    minimo NUMERIC(10, 2),
    promo NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    a00_id VARCHAR(10) PRIMARY KEY,
    a00_fantasia VARCHAR(255),
    rede_id INTEGER,
    rede VARCHAR(255),
    canal_de_venda VARCHAR(255),
    segmento VARCHAR(255),
    a00_id_vend VARCHAR(10),
    vendedor VARCHAR(255),
    a00_id_vend_2 VARCHAR(10),
    supervisor VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sub-redes
CREATE TABLE IF NOT EXISTS subredes (
    a00_id INTEGER PRIMARY KEY,
    a00_fantasia VARCHAR(255),
    a00_id_a16 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de descontos
CREATE TABLE IF NOT EXISTS descontos (
    id SERIAL,
    rede_id INTEGER NOT NULL,
    rede_desc VARCHAR(255),
    valor_desconto NUMERIC(5, 2),
    produto_id INTEGER NOT NULL,
    produto_livre VARCHAR(50),
    produto_desc VARCHAR(255),
    e01_id INTEGER,
    grupo VARCHAR(255),
    tipo_desconto VARCHAR(20) DEFAULT 'produto',
    a23_id INTEGER,
    a23_desc VARCHAR(255),
    a24_id_e01 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rede_id, produto_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_livre ON produtos(e02_livre);
CREATE INDEX IF NOT EXISTS idx_clientes_rede ON clientes(rede_id);
CREATE INDEX IF NOT EXISTS idx_descontos_rede ON descontos(rede_id);
CREATE INDEX IF NOT EXISTS idx_descontos_produto ON descontos(produto_id);
CREATE INDEX IF NOT EXISTS idx_descontos_e01 ON descontos(e01_id);
CREATE INDEX IF NOT EXISTS idx_descontos_tipo ON descontos(tipo_desconto);

-- Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'vendor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de solicitações de preços
CREATE TABLE IF NOT EXISTS price_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    cliente_codigo VARCHAR(10),
    cliente_nome VARCHAR(255),
    produto_codigo VARCHAR(50),
    produto_nome VARCHAR(255),
    quantidade INTEGER,
    preco_unitario NUMERIC(10, 2),
    desconto NUMERIC(5, 2),
    preco_final NUMERIC(10, 2),
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_requests_user ON price_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_price_requests_status ON price_requests(status);

-- Mensagem de sucesso
DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema initialized successfully!';
END $$;
