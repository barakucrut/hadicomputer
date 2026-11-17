import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/hadicomputer";
  
  // Parse standard mysql connection URL: mysql://[user[:password]@]host[:port]/database
  let user = "root";
  let password = "";
  let host = "127.0.0.1";
  let port = 3306;
  let database = "hadicomputer";

  try {
    const parsed = new URL(dbUrl);
    user = parsed.username || user;
    password = parsed.password || password;
    host = parsed.hostname || host;
    port = parsed.port ? Number(parsed.port) : port;
    database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : database;
  } catch {
    // fallback to defaults
  }

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password: password || undefined,
    database,
    connectionLimit: 10,
    connectTimeout: 2000,
  });

  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (global.__prisma) {
    // If cached client is missing newer models (e.g. platformTransaction, tenant), recreate it
    if ("platformTransaction" in global.__prisma && "tenant" in global.__prisma) {
      return global.__prisma;
    }
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    global.__prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const val = Reflect.get(client, prop, receiver);
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});
