import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: true
});

const nextConfig = compat.extends("next/core-web-vitals")[0];
const typescriptConfig = compat.config({
  extends: ["plugin:@typescript-eslint/recommended"]
})[0];

export default [
  {
    ignores: [".next/*", "node_modules/*"]
  },
  {
    ...nextConfig,
    files: ["**/*.{js,jsx,ts,tsx}"]
  },
  {
    ...typescriptConfig,
    files: ["**/*.{ts,tsx}"]
  }
];
