import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
export default tseslint.config({ ignores: ["dist/**", "coverage/**"] }, js.configs.recommended, ...tseslint.configs.recommended, { files: ["src/**/*.ts"], languageOptions: { globals: globals.node }, rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["apps/web/**", "@cocktail-taste-test/web/**"], message: "API must not import Web implementation." }] }] } });
