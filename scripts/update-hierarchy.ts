import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // First, make sure Sports, Fashion, and Music are parent Kultures
    const sports = await prisma.community.update({
      where: { slug: 'sports' },
      data: { parentId: null }
    })
    
    const fashion = await prisma.community.update({
      where: { slug: 'fashion' },
      data: { parentId: null }
    })
    
    const music = await prisma.community.update({
      where: { slug: 'music' },
      data: { parentId: null }
    })

    console.log('Updated parent Kultures:', { sports, fashion, music })

    // Make Football and Basketball children of Sports
    const football = await prisma.community.update({
      where: { slug: 'football' },
      data: { parentId: sports.id }
    })

    const basketball = await prisma.community.update({
      where: { slug: 'basketball' },
      data: { parentId: sports.id }
    })

    console.log('Updated Sports children:', { football, basketball })

    // Make New York Giants a child of Football
    const nyGiants = await prisma.community.update({
      where: { slug: 'new-york-giants' },
      data: { parentId: football.id }
    })

    console.log('Updated Football children:', { nyGiants })

    // Make Rap a child of Music
    const rap = await prisma.community.update({
      where: { slug: 'rap' },
      data: { parentId: music.id }
    })

    console.log('Updated Music children:', { rap })

    console.log('Successfully updated all hierarchies!')
  } catch (error) {
    console.error('Error updating hierarchies:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 