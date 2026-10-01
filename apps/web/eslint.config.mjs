import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([...nextVitals, ...nextTs, { plugins: { boundaries }, settings: { "boundaries/elements": [{ type: "features", pattern: "src/features/*" }, { type: "entities", pattern: "src/entities/*" }, { type: "shared", pattern: "src/shared/*" }] }, rules: { "boundaries/element-types": ["error", { default: "allow", rules: [{ from: "shared", disallow: ["entities", "features"] }, { from: "entities", disallow: ["features"] }] }], "no-restricted-imports": ["error", { patterns: [{ group: ["typeorm", "pg", "apps/api/**", "@cocktail-taste-test/api/**"], message: "Web must use HTTP contracts rather than API or persistence implementation." }] }] } }, globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])]);
