import globals from "globals";
import pluginJs from "@eslint/js";
import pluginVitest from "eslint-plugin-vitest";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
  pluginJs.configs.recommended,
  pluginVitest.configs.recommended,
];
