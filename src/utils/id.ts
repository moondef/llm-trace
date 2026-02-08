import type { IdGenerator } from "../types.ts";

export function createCryptoIdGenerator(): IdGenerator {
  return {
    generate(prefix: string): string {
      const bytes = new Uint8Array(3);
      crypto.getRandomValues(bytes);
      let suffix = "";
      for (const b of bytes) suffix += b.toString(16).padStart(2, "0");
      return `${prefix}-${suffix}`;
    },
  };
}
