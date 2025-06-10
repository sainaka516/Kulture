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

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      username: string
      image?: string
      verified: boolean
    }
  }

  interface User {
    id: string
    name: string
    email: string
    username: string
    image?: string
    verified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    username: string
    picture?: string
    verified: boolean
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split("@")[0],
          verified: true
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          username: user.username,
          image: user.image || undefined,
          verified: user.verified
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
    async jwt({ token, user, account, profile }) {
      if (account?.type === "oauth" && profile) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: profile.email },
              { username: profile.email?.split("@")[0] }
            ]
          }
        })

        if (!dbUser) {
          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              username: profile.email?.split("@")[0] || "",
              image: profile.picture,
              verified: true
            }
          })
          token.id = newUser.id
          token.username = newUser.username
          token.verified = newUser.verified
        } else {
          token.id = dbUser.id
          token.username = dbUser.username
          token.verified = dbUser.verified
          if (dbUser.image !== profile.picture) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: profile.picture }
            })
          }
        }
      }

      if (user) {
        token.id = user.id
        token.username = user.username
        token.verified = user.verified
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.username = token.username
        session.user.verified = token.verified
      }
      return session
    }
  }
} 