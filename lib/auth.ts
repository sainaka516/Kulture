import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import * as z from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  debug: true,
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
          if (!credentials?.username || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username.toLowerCase() },
                { email: credentials.username.toLowerCase() }
              ]
            },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              password: true,
              verified: true
            }
          })

          if (!user || !user.password) {
            console.log('[AUTH] User not found or no password set')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name || user.username
          }
        } catch (error) {
          console.error('[AUTH] Error in authorize:', error)
          return null
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user?.email) {
          console.error("[AUTH] No email provided by OAuth provider")
          return false
        }

        if (account?.provider === 'google') {
          // Find or create user
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          })

          if (!dbUser) {
            // Generate username from email
            const baseUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            let username = baseUsername
            let counter = 1

            while (true) {
              const exists = await prisma.user.findUnique({
                where: { username },
                select: { id: true }
              })
              
              if (!exists) break
              username = `${baseUsername}${counter}`
              counter++
            }

            // Create new user
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: profile?.name || username,
                username: username,
                image: profile?.picture as string,
                verified: false,
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    expires_at: account.expires_at
                  }
                }
              },
              include: { accounts: true }
            })
          } else if (!dbUser.accounts.some(acc => acc.provider === 'google')) {
            // Link Google account to existing user
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                expires_at: account.expires_at
              }
            })
          }

          // Update user object with database values
          user.id = dbUser.id
          user.username = dbUser.username
          user.name = dbUser.name || dbUser.username
          user.image = dbUser.image
        }

        return true
      } catch (error) {
        console.error("[AUTH] Error in signIn callback:", error)
        return false
      }
    },
    async jwt({ token, user, account, trigger }) {
      if (trigger === 'signIn' && user) {
        token.sub = user.id
        token.username = user.username
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }
      return session
    }
  }
} 