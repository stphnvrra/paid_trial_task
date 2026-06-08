import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  onModuleInit() {
    this.logger.log('Initializing PostgreSQL connection pool...');
    this.pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5433', 10),
      database: process.env.DATABASE_NAME || 'missions_db',
      user: process.env.DATABASE_USER || 'stephen',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    this.pool.query('SELECT 1')
      .then(() => this.logger.log('Successfully connected to PostgreSQL'))
      .catch((err) => {
        this.logger.error('Failed to connect to PostgreSQL', err.stack);
      });
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.log(`Executed query: ${text} [duration: ${duration}ms, rows: ${res.rowCount}]`);
      return res;
    } catch (error) {
      this.logger.error(`Error executing query: ${text}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing PostgreSQL connection pool...');
    await this.pool.end();
  }
}
