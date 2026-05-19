type PrismaLikeClient = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(input: Promise<T>[]) => Promise<T[]>;
  [key: string]: any;
};

declare global {
  var __securityPrismaClient: PrismaLikeClient | null | undefined;
  var __securityPrismaError: string | null | undefined;
}

let prismaPromise: Promise<PrismaLikeClient | null> | null = null;

async function createPrismaClient(): Promise<PrismaLikeClient | null> {
  if (process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL) {
    return null;
  }

  try {
    const clientModule = (await import("@prisma/client")) as unknown as { PrismaClient: new () => PrismaLikeClient };

    if (!globalThis.__securityPrismaClient) {
      globalThis.__securityPrismaClient = new clientModule.PrismaClient();
      await globalThis.__securityPrismaClient.$connect();
      globalThis.__securityPrismaError = null;
    }

    return globalThis.__securityPrismaClient;
  } catch (error) {
    globalThis.__securityPrismaError = error instanceof Error ? error.message : "Unable to initialize Prisma";
    return null;
  }
}

export async function getPrismaClient() {
  if (!prismaPromise) {
    prismaPromise = createPrismaClient();
  }
  return prismaPromise;
}

export async function getPrismaStatus() {
  const client = await getPrismaClient();
  return {
    enabled: Boolean(client),
    error: globalThis.__securityPrismaError ?? null
  };
}
