import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";

import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDirForFileUrl(url: string) {
  if (!url.startsWith("file:")) return;

  const rawPath = url.slice("file:".length);
  const dbPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.join(process.cwd(), rawPath);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR) && dir === DATA_DIR) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getTursoDatabaseUrl(): string {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required");
  }
  return url;
}

let client: Client | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const url = getTursoDatabaseUrl();
    ensureDataDirForFileUrl(url);
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export { schema };
