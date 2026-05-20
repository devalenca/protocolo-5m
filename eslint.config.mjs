import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Código vendido do animate-ui — não modificar regras do app
    files: ["components/animate-ui/**", "hooks/use-is-in-view.tsx", "lib/get-strict-context.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/component-hook-factories": "off",
      "react-hooks/static-components": "off",
      "react/display-name": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "legacy/**",
    "node_modules/**",
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
