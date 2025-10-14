// D1 Database Client using Cloudflare REST API
export class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.databaseId = process.env.CLOUDFLARE_DATABASE_ID || '';
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
  }

  async execute(sql: string, params: any[] = []) {
    if (!this.accountId || !this.databaseId || !this.apiToken) {
      throw new Error('Missing Cloudflare credentials. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_API_TOKEN');
    }

    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`D1 query failed: ${error}`);
    }

    const data = await response.json();
    return data.result[0];
  }

  async insert(table: string, data: Record<string, any>) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    return this.execute(sql, values);
  }

  async select(table: string, where?: Record<string, any>) {
    let sql = `SELECT * FROM ${table}`;
    let params: any[] = [];

    if (where) {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params = Object.values(where);
    }

    return this.execute(sql, params);
  }
}

export const d1 = new D1Client();