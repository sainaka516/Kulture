import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeVerifiedStatus() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        verified: true
      },
      data: {
        verified: false
      }
    })

    console.log(`Successfully removed verified status from ${result.count} users`)
  } catch (error) {
    console.error('Error removing verified status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeVerifiedStatus() 