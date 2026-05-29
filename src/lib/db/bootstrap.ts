import { getDb, initSchema } from "./index";

let booted = false;

export function ensureDb() {
  if (!booted) {
    initSchema();
    booted = true;
  }
  return getDb();
}
