import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import * as z from 'zod'

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { username, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username },
                { email: username } // Allow login with email as well
              ]
            }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.username = token.username
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email!,
        },
      })

      if (!dbUser) {
        if (user) {
          token.id = user?.id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        username: dbUser.username,
        picture: dbUser.image,
      }
    },
    async signOut({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.username = token.username
        session.user.image = token.picture
      }

      return session
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
    signIn: '/login',
    error: '/error',
  },
  debug: process.env.NODE_ENV === 'development',
} 