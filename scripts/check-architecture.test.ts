import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
it("keeps the repository-level architecture checker available", () => expect(existsSync(resolve(process.cwd(), "scripts/check-architecture.ts"))).toBe(true));
