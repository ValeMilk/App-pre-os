import sql from 'mssql';

class ERPService {
  private pool: sql.ConnectionPool | null = null;
  private config: sql.config;

  constructor() {
    // Construir server string com instância nomeada se disponível
    const host = process.env.ERP_HOST || '10.1.0.3';
    const instance = process.env.ERP_INSTANCE;
    const port = process.env.ERP_PORT ? parseInt(process.env.ERP_PORT) : undefined;
    
    // Se temos instância nomeada, usa formato: host\INSTANCE
    // Senão, usa host:port ou apenas host
    let server = host;
    if (instance) {
      server = `${host}\\${instance}`;
    }

    const config: any = {
      server,
      database: process.env.ERP_DATABASE || 'dbactions',
      authentication: {
        type: 'default',
        options: {
          userName: process.env.ERP_USER || 'analistarpt',
          password: process.env.ERP_PASSWORD || '',
        },
      },
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 30000,
      },
    };

    // Adiciona porta apenas se não temos instância nomeada e porta está definida
    if (!instance && port) {
      config.port = port;
    }

    this.config = config;
  }

  /**
   * Conecta ao SQL Server e mantém a conexão aberta
   */
  async connect(): Promise<void> {
    if (this.pool) return;

    try {
      this.pool = new sql.ConnectionPool(this.config);
      await this.pool.connect();
      console.log('[ERPService] Conectado ao SQL Server com sucesso');
    } catch (error) {
      console.error('[ERPService] Erro ao conectar:', error);
      throw error;
    }
  }

  /**
   * Desconecta do SQL Server
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('[ERPService] Desconectado do SQL Server');
    }
  }

  /**
   * Busca todos os clientes (carteira)
   */
  async getClientes(): Promise<any[]> {
    try {
      if (!this.pool) await this.connect();

      const request = this.pool!.request();
      const result = await request.query(`
        SELECT
            c.A00_ID,
            c.A00_FANTASIA,
            c.A00_ID_VEND,
            c.A00_ID_VEND_2,
            r.A43_DESC AS CANAL_DE_VENDA,
            t.A44_DESC AS SEGMENTO,
            v.A00_FANTASIA AS VENDEDOR,
            s.A00_FANTASIA AS SUPERVISOR,
            ISNULL(classe.A68_DESC, '-') AS REDE,
            ISNULL(subclasse.A68_DESC, '-') AS SUBREDE
        FROM dbo.A00 c
        LEFT JOIN dbo.A00 v ON c.A00_ID_VEND = v.A00_ID
        LEFT JOIN dbo.A00 s ON c.A00_ID_VEND_2 = s.A00_ID
        LEFT JOIN dbo.A43 r ON c.A00_ID_A43 = r.A43_ID
        LEFT JOIN dbo.A44 t ON c.A00_ID_A44 = t.A44_ID
        LEFT JOIN dbo.A68 classe ON c.A00_ID_A68_CLASSE = classe.A68_ID
        LEFT JOIN dbo.A68 subclasse ON c.A00_ID_A68_SUBCLASSE = subclasse.A68_ID
        WHERE
            c.A00_STATUS = 1
            AND c.A00_ID NOT IN (1,2,3,4,13,265,278)
            AND c.A00_ID_VEND NOT IN (11919,0,2,3,1,8029,12171) 
            AND c.A00_EN_CL = 1
        ORDER BY c.A00_FANTASIA ASC
      `);

      return result.recordset;
    } catch (error) {
      console.error('[ERPService] Erro ao buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Busca todos os produtos
   */
  async getProdutos(): Promise<any[]> {
    try {
      if (!this.pool) await this.connect();

      const request = this.pool!.request();
      const result = await request.query(`
        SELECT
          E02_ID,
          E02_LIVRE,
          E02_DESC,
          E02_PRECO    AS TABELA_70,
          E02_PRECO_02 AS MINIMO,
          E02_PRECO_03 AS PROMO,
          e29.E29_DESC AS SUBCATEGORIA,
          E23.E23_DESC AS CATEGORIA
        FROM dbo.E02 WITH (NOLOCK)
        LEFT JOIN dbo.E23 WITH (NOLOCK) ON E02.E02_ID_E23 = E23.E23_ID
        LEFT JOIN dbo.E29 WITH (NOLOCK) ON e02.E02_ID_E29 = e29.E29_ID
        WHERE
          E02_TIPO = '04'
          AND E02_ID <> '58'
          AND (
            E02_DESC IS NULL
            OR (
              E02_DESC NOT LIKE '%(INATIVO)%'
              AND E02_DESC NOT LIKE '%(INATIVADO)%'
              AND E02_DESC NOT LIKE '%(PASTEURIZADO)%'
            )
          )
        ORDER BY E02_ID ASC
      `);

      return result.recordset;
    } catch (error) {
      console.error('[ERPService] Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Busca todos os descontos (placeholder - aguardando query do usuário)
   */
  async getDescontos(): Promise<any[]> {
    try {
      if (!this.pool) await this.connect();

      // TODO: Implementar quando o usuário fornecer a query de descontos
      console.warn('[ERPService] Query de descontos ainda não foi implementada');
      return [];
    } catch (error) {
      console.error('[ERPService] Erro ao buscar descontos:', error);
      throw error;
    }
  }

  /**
   * Executa uma query customizada
   */
  async executeQuery(query: string): Promise<any[]> {
    try {
      if (!this.pool) await this.connect();

      const request = this.pool!.request();
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('[ERPService] Erro ao executar query:', error);
      throw error;
    }
  }
}

// Singleton instance
export const erpService = new ERPService();
