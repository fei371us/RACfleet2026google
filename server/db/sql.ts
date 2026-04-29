import sql from 'mssql';

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}

function unquote(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseAzureSqlConnectionString(raw: string): sql.config {
  const entries = raw
    .split(';')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      const idx = p.indexOf('=');
      if (idx < 0) return null;
      return [p.slice(0, idx).trim().toLowerCase(), unquote(p.slice(idx + 1).trim())] as const;
    })
    .filter((x): x is readonly [string, string] => x !== null);

  const map = new Map(entries);

  const serverRaw = map.get('server') ?? map.get('data source') ?? '';
  const cleanedServer = serverRaw.replace(/^tcp:/i, '');
  const [serverHost, serverPort] = cleanedServer.split(',');
  const auth = (map.get('authentication') ?? '').toLowerCase();

  const cfg: sql.config = {
    server: serverHost,
    port: serverPort ? parseInt(serverPort, 10) : 1433,
    database: map.get('initial catalog') ?? map.get('database') ?? '',
    connectionTimeout: map.get('connection timeout') ? parseInt(map.get('connection timeout')!, 10) * 1000 : undefined,
    options: {
      encrypt: parseBool(map.get('encrypt'), true),
      trustServerCertificate: parseBool(map.get('trustservercertificate'), false),
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };

  // SQL auth
  const user = map.get('user id') ?? map.get('uid') ?? map.get('user');
  const password = map.get('password') ?? map.get('pwd');
  if (user) cfg.user = user;
  if (password) cfg.password = password;

  // Azure AD auth (for example: Authentication="Active Directory Default")
  if (auth === 'active directory default') {
    (cfg as any).authentication = { type: 'azure-active-directory-default', options: {} };
  } else if (auth === 'active directory msi' || auth === 'active directory managed identity') {
    (cfg as any).authentication = { type: 'azure-active-directory-msi-app-service', options: {} };
  }

  return cfg;
}

function buildConfig(databaseUrl: string): sql.config {
  const raw = databaseUrl.trim();
  if (!raw) throw new Error('DATABASE_URL is required');

  // Supports classic URL: mssql://user:pass@host:1433/db?encrypt=true
  if (raw.includes('://')) {
    const u = new URL(raw.startsWith('mssql://') ? raw : `mssql://${raw}`);
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

  // Supports Azure SQL style:
  // Server=tcp:<host>,1433;Initial Catalog=<db>;Encrypt=True;TrustServerCertificate=False;...
  return parseAzureSqlConnectionString(raw);
}

let pool: sql.ConnectionPool | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool;
  pool = new sql.ConnectionPool(buildConfig(process.env.DATABASE_URL ?? ''));
  await pool.connect();
  return pool;
}

export { sql };
