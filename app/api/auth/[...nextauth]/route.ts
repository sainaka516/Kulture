import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user?.email) {
          console.error("[AUTH] No email provided by OAuth provider");
          return false;
        }
        console.log("[AUTH] Sign in attempt:", { 
          email: user.email,
          name: user.name,
          provider: account?.provider 
        });
        return true;
      } catch (error) {
        console.error("[AUTH] Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        if (account && user) {
          console.log("[AUTH] First time JWT creation for user");
          return {
            ...token,
            id: user.id,
          };
        }
        console.log("[AUTH] Returning existing JWT");
        return token;
      } catch (error) {
        console.error("[AUTH] Error in jwt callback:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        console.log("[AUTH] Creating session:", { 
          userId: token.id,
          userEmail: session.user?.email 
        });
        
        if (token.id && session.user) {
          session.user.id = token.id as string;
        }
        
        return session;
      } catch (error) {
        console.error("[AUTH] Error in session callback:", error);
        return session;
      }
    },
  },
  events: {
    async signIn(message) {
      console.log("[AUTH] Sign in event:", message);
    },
    async signOut(message) {
      console.log("[AUTH] Sign out event:", message);
    },
    async error(error) {
      console.error("[AUTH] Error event:", error);
    },
    async createUser(message) {
      console.log("[AUTH] Create user event:", message);
    },
    async linkAccount(message) {
      console.log("[AUTH] Link account event:", message);
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 