import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  ...nextConfig,
  prettierConfig,
  {
    settings: {
      react: {
        version: "19.0",
      },
    },
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
