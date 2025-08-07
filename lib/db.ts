import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Check if we're using Supabase and add required parameters
  let finalDatabaseUrl = databaseUrl;
  if (databaseUrl.includes('supabase.co')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    finalDatabaseUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1&sslmode=require`;
  }

  console.log('[DB] Initializing Prisma client with URL:', finalDatabaseUrl.replace(/:[^:@]*@/, ':****@'));

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: finalDatabaseUrl,
      },
    },
  });
};

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const db = prisma; 