import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          rememberMe: credentials.rememberMe === 'true',
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rememberMe = (user as any).rememberMe || false
        token.createdAt = Date.now()
      }

      // Check if token has expired based on rememberMe setting
      if (token.createdAt) {
        const maxAge = token.rememberMe
          ? 30 * 24 * 60 * 60 * 1000  // 30 days
          : 24 * 60 * 60 * 1000        // 1 day

        if (Date.now() - (token.createdAt as number) > maxAge) {
          // Token expired - return empty token to force re-login
          return {} as typeof token
        }
      }

      return token
    },
    async session({ session, token }) {
      // If token was invalidated (empty), return null session
      if (!token.id) {
        return { ...session, user: undefined }
      }

      if (session.user) {
        (session.user as { id: string }).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: false,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}