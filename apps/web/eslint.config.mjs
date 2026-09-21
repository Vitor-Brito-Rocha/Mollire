import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  // Pre-existing useEffect+setState fetching. Goes away as each module moves to
  // useQuery (see the per-module pass); warn until then instead of blocking lint.
  { files: ["src/app/**", "src/modules/**"], rules: { "react-hooks/set-state-in-effect": "warn" } },
  // shadcn primitives export variants next to components — expected there.
  {
    files: ["src/shared/ui/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  // Module boundaries: a module talks to another only through its index.ts,
  // and shared/* never reaches into modules/*.
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*", "@/modules/*/*/**"],
              message: "Import from the module's index (@/modules/<name>) — its internals are private.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/modules/**"], message: "shared/* must not depend on modules/*." }] },
      ],
    },
  },
]);
