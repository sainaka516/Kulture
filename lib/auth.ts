import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // Check if user exists
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email }
      })

      // If user doesn't exist, create them
      if (!dbUser) {
        // Generate a unique username from email
        const baseUsername = user.email.split('@')[0]
        let username = baseUsername
        let counter = 1

        // Keep trying until we find a unique username
        while (true) {
          const existingUser = await prisma.user.findUnique({
            where: { username }
          })
          if (!existingUser) break
          username = `${baseUsername}${counter}`
          counter++
        }

        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            username,
          }
        })
      }

      return true
    },
    async session({ session, token }) {
      if (session.user) {
        // Get the user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (dbUser) {
          session.user.id = dbUser.id
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  events: {
    async signIn({ user }) {
      // Update user's last login time or other metadata if needed
      if (user.email) {
        await prisma.user.updateMany({
          where: { email: user.email },
          data: { updatedAt: new Date() }
        })
      }
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/error',
  },
  debug: process.env.NODE_ENV === 'development',
} 