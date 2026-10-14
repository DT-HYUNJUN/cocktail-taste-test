import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { checkArchitecture } from "./check-architecture.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(domainDependencies: Record<string, string> = {}, contractsDependencies: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "cocktail-architecture-"));
  roots.push(root);
  for (const path of ["apps/web/package.json", "apps/api/package.json", "packages/contracts/package.json", "packages/domain/package.json"]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify({
      dependencies: path.includes("/domain/") ? domainDependencies : path.includes("/contracts/") ? contractsDependencies : {},
    }));
  }
  return root;
}

it("keeps the repository-level architecture checker available", () => {
  expect(existsSync(resolve(process.cwd(), "scripts/check-architecture.ts"))).toBe(true);
});

it("accepts a framework-independent domain package", () => {
  const rules = checkArchitecture(fixture({ typescript: "^5.9.2" }));
  expect(rules.every(([, valid]) => valid)).toBe(true);
});

it.each(["typeorm", "@nestjs/common", "next", "react", "pg", "@cocktail-taste-test/api"])(
  "rejects forbidden domain dependency %s",
  dependency => {
    const root = fixture({ [dependency]: "1.0.0" });
    expect(checkArchitecture(root)).toContainEqual([
      "ARCH-DOMAIN-001", false, "packages/domain must remain framework- and persistence-independent.",
    ]);
  },
);

it("checks domain dev, peer and optional dependencies too", () => {
  const root = fixture();
  writeFileSync(join(root, "packages/domain/package.json"), JSON.stringify({
    devDependencies: { react: "1" }, peerDependencies: { next: "1" }, optionalDependencies: { typeorm: "1" },
  }));
  expect(checkArchitecture(root).find(([id]) => id === "ARCH-DOMAIN-001")?.[1]).toBe(false);
});

it("preserves the existing contracts restriction", () => {
  const root = fixture({}, { typeorm: "1" });
  expect(checkArchitecture(root).find(([id]) => id === "ARCH-CONTRACT-001")?.[1]).toBe(false);
});
