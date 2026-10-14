import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type ArchitectureRule = readonly [id: string, valid: boolean, message: string];

const forbiddenFrameworkPackages = [
  "typeorm", "@nestjs/common", "@nestjs/core", "@nestjs/typeorm",
  "next", "react", "react-dom", "pg", "@cocktail-taste-test/api",
] as const;

function packageDependencies(root: string, path: string): Set<string> {
  const manifest = JSON.parse(readFileSync(resolve(root, path), "utf8")) as PackageManifest;
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
}

/** Repository checks are pure with respect to process exit state, so they can be unit-tested. */
export function checkArchitecture(root: string): ArchitectureRule[] {
  const contracts = packageDependencies(root, "packages/contracts/package.json");
  const domain = packageDependencies(root, "packages/domain/package.json");
  return [
    ["ARCH-REPO-001", existsSync(resolve(root, "apps/web/package.json")) && existsSync(resolve(root, "apps/api/package.json")), "apps/web and apps/api must remain independent applications."],
    ["ARCH-REPO-002", !existsSync(resolve(root, "packages/ui")), "packages/ui is deferred; keep UI primitives in apps/web/src/shared/ui."],
    ["ARCH-CONTRACT-001", ["typeorm", "@nestjs/common", "next", "react"].every(name => !contracts.has(name)), "packages/contracts must remain transport-safe and framework-independent."],
    ["ARCH-DOMAIN-001", forbiddenFrameworkPackages.every(name => !domain.has(name)), "packages/domain must remain framework- and persistence-independent."],
  ];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = checkArchitecture(process.cwd()).filter(([, valid]) => !valid);
  if (violations.length > 0) {
    for (const [id, , message] of violations) console.error(`${id}: ${message}`);
    process.exitCode = 1;
  } else {
    console.log("Architecture repository invariants passed.");
  }
}
