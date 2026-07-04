import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Adopting lint on an existing codebase: keep it green so CI can enforce
    // *new* errors, while these pervasive / opinionated rules stay visible as
    // warnings to be cleaned up over time rather than blocking every build.
    // - no-explicit-any: the app types external API payloads as `any` for now.
    // - react-hooks/* (static-components, purity, set-state-in-effect): the new
    //   React-Compiler-era rules; the data-fetch-on-mount and inline-render
    //   patterns here trip them but aren't bugs.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
