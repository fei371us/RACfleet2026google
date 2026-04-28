import sql from 'mssql';

function buildConfig(url: string): sql.config {
  const u = new URL(url.startsWith('mssql://') ? url : `mssql://${url}`);
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    server: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 1433,
    database: u.pathname.slice(1),
    options: {
      encrypt: u.searchParams.get('encrypt') !== 'false',
      trustServerCertificate: u.searchParams.get('trustServerCertificate') === 'true',
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

let pool: sql.ConnectionPool | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool;
  pool = new sql.ConnectionPool(buildConfig(process.env.DATABASE_URL ?? ''));
  await pool.connect();
  return pool;
}

export { sql };
