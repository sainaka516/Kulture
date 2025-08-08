import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('[DB] Initializing Prisma client...');
  console.log('[DB] DATABASE_URL exists:', !!databaseUrl);
  console.log('[DB] NODE_ENV:', process.env.NODE_ENV);

  // Check if we're using Supabase and add required parameters
  let finalDatabaseUrl = databaseUrl;
  if (databaseUrl.includes('supabase.co')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    finalDatabaseUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1&sslmode=require`;
    console.log('[DB] Using Supabase connection with pooling');
  }

  try {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: finalDatabaseUrl,
        },
      },
    });

    console.log('[DB] Prisma client initialized successfully');
    return prisma;
  } catch (error) {
    console.error('[DB] Failed to initialize Prisma client:', error);
    throw error;
  }
};

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const db = prisma; 