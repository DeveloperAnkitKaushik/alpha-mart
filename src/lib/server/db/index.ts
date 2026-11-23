import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { serverEnv } from "@/lib/server/env";
import * as schema from "./schema";

export type Db = MySql2Database<typeof schema>;
let cached: Db | undefined;

// One pool per Node process; created on first use so builds without DATABASE_URL still compile.
export function db(): Db {
  cached ??= drizzle(createPool({ uri: serverEnv().DATABASE_URL, connectionLimit: 10, timezone: "Z" }), { schema, mode: "default" });
  return cached;
}

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
