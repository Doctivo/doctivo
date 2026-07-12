import { Pool } from 'pg';

/**
 * Optimized PostgreSQL connection pool for Production (Vercel).
 * Enforces SSL for remote connections while maintaining local flexibility.
 */
const connectionString = process.env.DATABASE_URL;

const isValidUrl = connectionString && 
                   connectionString.startsWith('postgres') && 
                   !connectionString.includes('your_') &&
                   !connectionString.includes('base');

let pool: Pool;

try {
  pool = new Pool({
    connectionString: isValidUrl ? connectionString : undefined,
    // Production requirement: SSL is mandatory for remote Postgres hosts
    ssl: connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1') 
      ? false 
      : { rejectUnauthorized: false },
    max: 10, // Optimized for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client.', err.message);
  });
} catch (e) {
  console.error('Failed to initialize DB pool:', e);
}

export const query = async (text: string, params?: any[]) => {
  if (!isValidUrl) {
    console.error('CRITICAL: DATABASE_URL is missing or invalid in Vercel environment.');
    throw new Error('Database connection is not configured in Vercel environment variables.');
  }
  
  if (!pool) {
    throw new Error('Database pool is not initialized.');
  }
  
  try {
    return await pool.query(text, params);
  } catch (error: any) {
    console.error('DB Query Error:', error.message);
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      throw new Error(`Database connection failed. Could not reach host. Verify DATABASE_URL.`);
    }
    throw error;
  }
};

export default pool!;
