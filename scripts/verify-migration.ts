import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function verifyMigration() {
  try {
    // 1. Create backup before migration
    console.log('Creating backup...')
    execSync('bash scripts/backup-db.sh')

    // 2. Get table statistics before migration
    const beforeStats = await getTableStats()
    console.log('\nCurrent database statistics:')
    console.log(beforeStats)

    // 3. Check for dangerous operations in pending migrations
    const pendingMigrations = getPendingMigrations()
    const dangerousOperations = [
      'DROP TABLE',
      'DROP COLUMN',
      'ALTER TABLE .* DROP',
      'TRUNCATE',
      'DELETE FROM'
    ]

    for (const migration of pendingMigrations) {
      const content = fs.readFileSync(migration, 'utf8')
      const dangerous = dangerousOperations.filter(op => 
        new RegExp(op, 'i').test(content)
      )

      if (dangerous.length > 0) {
        console.log(`\n⚠️  WARNING: Potentially dangerous operations found in ${path.basename(migration)}:`)
        dangerous.forEach(op => console.log(`  - ${op}`))
        console.log('\nPlease verify these operations are intended.')
        
        // Prompt for confirmation
        console.log('\nDo you want to:')
        console.log('1. Proceed with migration')
        console.log('2. Review migration file')
        console.log('3. Abort')
        
        // In a real implementation, you'd handle user input here
        // For now, we'll just warn and continue
        console.log('\nAutomatically proceeding due to script limitations...')
      }
    }

    console.log('\nMigration verification completed.')
    console.log('You can now run: npx prisma migrate deploy')

  } catch (error) {
    console.error('Verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function getTableStats() {
  const stats: Record<string, number> = {}
  
  // Get list of tables
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public'
  `

  // Get row count for each table
  for (const { tablename } of tables) {
    const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count FROM "${tablename}"
    `
    stats[tablename] = Number(count)
  }

  return stats
}

function getPendingMigrations(): string[] {
  const migrationsDir = path.join(process.cwd(), 'prisma/migrations')
  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => path.join(migrationsDir, f))

  return migrations
}

verifyMigration() 