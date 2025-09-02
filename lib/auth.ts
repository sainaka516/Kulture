import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import * as z from 'zod'
import { Profile } from 'next-auth'
import { User as PrismaUser } from '@prisma/client'
import { JWT } from 'next-auth/jwt'

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

declare module 'next-auth' {
  interface Profile {
    picture?: string
    sub?: string
  }

  interface Session {
    user: {
      id: string
      name: string | null
      email: string | null
      username: string
      image: string | null
      verified: boolean
    }
  }

  interface User extends PrismaUser {
    verified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    picture?: string | null
    verified?: boolean
  }
}

interface GoogleProfile {
  sub: string
  name: string | null
  email: string | null
  picture: string | null
}

async function authorize(credentials: Record<"username" | "password", string> | undefined) {
  try {
    if (!credentials?.username || !credentials?.password) {
      console.log('[AUTH] Missing credentials:', { username: !!credentials?.username, password: !!credentials?.password })
      return null
    }

    const { username, password } = credentials
    const isEmail = username.includes('@')
    console.log('[AUTH] Attempting login with:', { username, isEmail })

    const user = await db.user.findUnique({
      where: isEmail ? { email: username.toLowerCase() } : { username: username.toLowerCase() },
    })

    if (!user) {
      console.log('[AUTH] User not found:', { username, isEmail })
      return null
    }

    if (!user.password) {
      console.log('[AUTH] User has no password (OAuth-only account):', { username, isEmail })
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('[AUTH] Password validation:', { username, isValid: isValidPassword })

    if (!isValidPassword) {
      return null
    }

    const userToReturn = {
      id: user.id,
      name: user.name || user.username,
      email: user.email || `${user.username}@example.com`,
      image: user.image || undefined,
      username: user.username,
      verified: true,
      emailVerified: user.emailVerified,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
    console.log('[AUTH] Login successful:', { username, userId: user.id })
    return userToReturn
  } catch (error) {
    console.error('[AUTH] Error in authorize:', error)
    return null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-in',
    error: '/sign-in',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile, tokens) {
        return {
          id: profile.sub,
          name: profile.name || undefined,
          email: profile.email || undefined,
          image: profile.picture || undefined,
          username: profile.email?.split('@')[0] || '',
          verified: true,
          password: null,
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          console.log('[AUTH] Credentials provider called with:', {
            hasUsername: !!credentials?.username,
            hasPassword: !!credentials?.password
          })

          if (!credentials?.username || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          const { username, password } = credentials
          const isEmail = username.includes('@')
          console.log('[AUTH] Attempting login with:', { username, isEmail })

          // Try to find user by email or username
          const user = await db.user.findUnique({
            where: isEmail 
              ? { email: username.toLowerCase() }
              : { username: username.toLowerCase() }
          })

          console.log('[AUTH] Database query result:', { 
            found: !!user, 
            userId: user?.id,
            hasPassword: !!user?.password 
          })

          if (!user) {
            console.log('[AUTH] User not found:', { username, isEmail })
            return null
          }

          if (!user.password) {
            console.log('[AUTH] User has no password (OAuth-only account):', { username, isEmail })
            return null
          }

          const isValidPassword = await bcrypt.compare(password, user.password)
          console.log('[AUTH] Password validation:', { username, isValid: isValidPassword })

          if (!isValidPassword) {
            console.log('[AUTH] Invalid password for user:', { username, isEmail })
            return null
          }

          console.log('[AUTH] Login successful:', { username, userId: user.id })
          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email || '',
            image: user.image || '',
            username: user.username,
            verified: user.verified || false,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            password: user.password
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
          let dbUser = await db.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          })

          if (!dbUser) {
            // Generate username from email
            const baseUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            let username = baseUsername
            let counter = 1

            while (true) {
                          const exists = await db.user.findUnique({
              where: { username },
              select: { id: true }
            })
              
              if (!exists) break
              username = `${baseUsername}${counter}`
              counter++
            }

            // Create new user
            dbUser = await db.user.create({
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
            await db.account.create({
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
          user.image = dbUser.image || undefined
        }

        return true
      } catch (error) {
        console.error("[AUTH] Error in signIn callback:", error)
        return false
      }
    },
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id
        token.name = user.name || undefined
        token.email = user.email || undefined
        token.username = user.username
        token.picture = user.image || undefined
        token.verified = user.verified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id || '',
          name: token.name || null,
          email: token.email || null,
          username: token.username || '',
          image: token.picture || null,
          verified: token.verified || false,
        }
      }

      return session
    }
  }
} 