import { randomBytes } from "node:crypto";
import type { IdGenerator } from "../types.ts";

export function createCryptoIdGenerator(): IdGenerator {
  return {
    generate(prefix: string): string {
      const suffix = randomBytes(4).toString("hex").slice(0, 6);
      return `${prefix}-${suffix}`;
    },
  };
}
