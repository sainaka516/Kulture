import { PrismaClient } from '@prisma/client'

interface Post {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  authorId: string
  communityId: string
}

const prisma = new PrismaClient()

async function migratePosts() {
  try {
    // Get all posts
    const posts = await prisma.$queryRaw<Post[]>`
      SELECT * FROM "Post"
    `

    console.log(`Found ${posts.length} posts to migrate`)

    // Migrate each post to a take
    for (const post of posts) {
      await prisma.take.create({
        data: {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorId: post.authorId,
          communityId: post.communityId,
        },
      })
      console.log(`Migrated post ${post.id}`)
    }

    // Update comments
    await prisma.$executeRaw`
      UPDATE "Comment"
      SET "takeId" = "postId"
      WHERE "postId" IS NOT NULL
    `

    // Update votes
    await prisma.$executeRaw`
      UPDATE "Vote"
      SET "takeId" = "postId"
      WHERE "postId" IS NOT NULL
    `

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migratePosts() 