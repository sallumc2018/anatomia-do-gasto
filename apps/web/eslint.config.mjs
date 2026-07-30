import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Arquivos .cjs sao CommonJS por definicao: `require()` e o idioma correto
  // deles, nao um erro. A regra vem do preset TypeScript do Next e estava
  // sendo aplicada aos testes em lib/*.test.cjs, deixando o "Quality Gates"
  // vermelho desde 20/07/2026 -- 8 execucoes seguidas.
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
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
