import { compare, hash } from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { createTenantOwner, findUserByEmail, getUserContext } from "@/lib/repository";

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/signin"
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const user = await findUserByEmail(credentials.email);
        if (!user) {
          return null;
        }
        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }
        const context = await getUserContext(user.id);
        const memberships = context?.memberships ?? [];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
          memberships
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.systemRole = user.systemRole;
        token.memberships = user.memberships;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.systemRole = (token.systemRole as string | undefined) ?? "STANDARD";
        session.user.memberships = (token.memberships as Array<{ tenantId: string; role: string }> | undefined) ?? [];
      }
      return session;
    }
  }
};

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}) {
  const passwordHash = await hashPassword(input.password);
  return createTenantOwner({
    email: input.email,
    name: input.name,
    passwordHash,
    tenantName: input.tenantName
  });
}
