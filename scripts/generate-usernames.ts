import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get all users without usernames who signed up with Google
    const users = await prisma.user.findMany({
      where: {
        username: null,
        accounts: {
          some: {
            provider: 'google'
          }
        }
      },
      select: {
        id: true,
        email: true
      }
    })
    
    console.log(`Found ${users.length} Google users without usernames`)
    
    // Update usernames to be their email addresses
    for (const user of users) {
      if (!user.email) {
        console.log(`Skipping user ${user.id} - no email found`)
        continue
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username: user.email }
      })
      
      console.log(`Updated user ${user.id} with username: ${user.email}`)
    }
    
    console.log('Username updates complete!')
  } catch (error) {
    console.error('Error updating usernames:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 