import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  try {
    // First, delete existing test data
    console.log('Cleaning up existing test data...')
    
    // Delete takes from test users
    await prisma.take.deleteMany({
      where: {
        author: {
          email: {
            in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
          }
        }
      }
    })
    
    // Delete viewed takes for test users
    await prisma.viewedTake.deleteMany({
      where: {
        user: {
          email: {
            in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
          }
        }
      }
    })

    // Delete friendships for test users
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            user: {
              email: {
                in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
              }
            }
          },
          {
            friend: {
              email: {
                in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
              }
            }
          }
        ]
      }
    })

    // Delete community memberships for test users
    await prisma.communityMember.deleteMany({
      where: {
        user: {
          email: {
            in: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com']
          }
        }
      }
    })

    console.log('Creating test users...')
    // Create or update test users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'alice@test.com' },
        update: {},
        create: {
          name: 'Alice Smith',
          email: 'alice@test.com',
          username: 'alice_music',
          password: await hash('password123', 10),
          verified: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'bob@test.com' },
        update: {},
        create: {
          name: 'Bob Johnson',
          email: 'bob@test.com',
          username: 'bob_beats',
          password: await hash('password123', 10),
          verified: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'charlie@test.com' },
        update: {},
        create: {
          name: 'Charlie Brown',
          email: 'charlie@test.com',
          username: 'charlie_tunes',
          password: await hash('password123', 10),
          verified: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'diana@test.com' },
        update: {},
        create: {
          name: 'Diana Ross',
          email: 'diana@test.com',
          username: 'diana_melody',
          password: await hash('password123', 10),
          verified: true,
        },
      }),
    ])

    console.log('Creating friendships...')
    // Create friendships (Alice is friends with Bob and Charlie)
    await Promise.all([
      prisma.friendship.upsert({
        where: {
          userId_friendId: {
            userId: users[0].id,
            friendId: users[1].id,
          },
        },
        update: {},
        create: {
          userId: users[0].id, // Alice
          friendId: users[1].id, // Bob
        },
      }),
      prisma.friendship.upsert({
        where: {
          userId_friendId: {
            userId: users[0].id,
            friendId: users[2].id,
          },
        },
        update: {},
        create: {
          userId: users[0].id, // Alice
          friendId: users[2].id, // Charlie
        },
      }),
    ])

    console.log('Finding Music Kulture...')
    // Get the existing Music Kulture
    const musicKulture = await prisma.community.findFirst({
      where: {
        name: {
          contains: 'Music',
          mode: 'insensitive'
        }
      },
    })

    if (!musicKulture) {
      throw new Error('Music Kulture not found! Please create it first.')
    }

    console.log('Creating community memberships...')
    // Make all users members of the Music Kulture
    await Promise.all(
      users.map(user =>
        prisma.communityMember.upsert({
          where: {
            userId_communityId: {
              userId: user.id,
              communityId: musicKulture.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            communityId: musicKulture.id,
          },
        })
      )
    )

    console.log('Creating test takes...')
    // Create test takes
    await Promise.all([
      // Bob's takes (friend)
      prisma.take.create({
        data: {
          title: "Amazing Jazz Discovery",
          content: "Just discovered an amazing jazz album! Can't stop listening to it 🎷",
          authorId: users[1].id,
          communityId: musicKulture.id,
        },
      }),
      prisma.take.create({
        data: {
          title: "Taylor Swift Hype",
          content: "Who else is excited for the new Taylor Swift album? 🎵",
          authorId: users[1].id,
          communityId: musicKulture.id,
        },
      }),
      
      // Charlie's takes (friend)
      prisma.take.create({
        data: {
          title: "Classical Music Appreciation",
          content: "Classical music is underrated. Bach's compositions are pure genius! 🎹",
          authorId: users[2].id,
          communityId: musicKulture.id,
        },
      }),
      prisma.take.create({
        data: {
          title: "Vinyl Experience",
          content: "Just got my first vinyl record player. The sound quality is amazing! 🎵",
          authorId: users[2].id,
          communityId: musicKulture.id,
        },
      }),

      // Diana's takes (not friend)
      prisma.take.create({
        data: {
          title: "Hip Hop Evolution",
          content: "Hip hop is evolving in such interesting ways these days 🎤",
          authorId: users[3].id,
          communityId: musicKulture.id,
        },
      }),
      prisma.take.create({
        data: {
          title: "Underground Artists",
          content: "Anyone else love discovering underground artists? Share your favorites! 🎸",
          authorId: users[3].id,
          communityId: musicKulture.id,
        },
      }),
    ])

    console.log('Test data seeded successfully!')
  } catch (error) {
    console.error('Error seeding test data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 