import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      systemRole: string;
      memberships: Array<{ tenantId: string; role: string }>;
    } & DefaultSession["user"];
  }

  interface User {
    systemRole: string;
    memberships: Array<{ tenantId: string; role: string }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    systemRole?: string;
    memberships?: Array<{ tenantId: string; role: string }>;
  }
}
