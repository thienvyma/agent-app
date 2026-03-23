import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * NextAuth.js v5 configuration for Agentic Enterprise.
 *
 * MVP: Credentials provider (email + password).
 * Future: Add OAuth providers as needed.
 *
 * @see https://authjs.dev/getting-started
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@agentic.local",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        // MVP: Single admin user from env vars
        // TODO: Replace with DB lookup in Phase 5
        const adminEmail = process.env.ADMIN_EMAIL ?? "admin@agentic.local";
        const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

        if (
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword
        ) {
          return {
            id: "owner-1",
            name: "Owner",
            email: adminEmail,
            role: "owner",
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Add custom fields to JWT token.
     */
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "viewer";
      }
      return token;
    },
    /**
     * Expose custom fields in client-side session.
     */
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
