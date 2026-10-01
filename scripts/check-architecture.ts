import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd();
const contracts = JSON.parse(readFileSync(resolve(root, "packages/contracts/package.json"), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
const dependencies = { ...contracts.dependencies, ...contracts.devDependencies };
const rules = [
  ["ARCH-REPO-001", existsSync(resolve(root, "apps/web/package.json")) && existsSync(resolve(root, "apps/api/package.json")), "apps/web and apps/api must remain independent applications."],
  ["ARCH-REPO-002", !existsSync(resolve(root, "packages/ui")), "packages/ui is deferred; keep UI primitives in apps/web/src/shared/ui."],
  ["ARCH-CONTRACT-001", ["typeorm", "@nestjs/common", "next", "react"].every((name) => !(name in dependencies)), "packages/contracts must remain transport-safe and framework-independent."],
] as const;
const violations = rules.filter(([, valid]) => !valid);
if (violations.length) { for (const [id,, message] of violations) console.error(`${id}: ${message}`); process.exitCode = 1; } else console.log("Architecture repository invariants passed.");
