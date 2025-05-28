import type { BuildConfig } from "bun";
import dts from "bun-plugin-dts";

const defaultBuildConfig: BuildConfig = {
  entrypoints: [
    "./src/mysql.ts",
    "./src/pgsql.ts",
    "./src/sqlite.ts",
    "./src/sqlite-expo.ts",
  ],
  outdir: "./dist",
  packages: "external",
};

await Promise.all([
  Bun.build({
    ...defaultBuildConfig,
    plugins: [dts()],
    format: "esm",
    naming: "[dir]/[name].js",
  }),
  Bun.build({
    ...defaultBuildConfig,
    format: "cjs",
    naming: "[dir]/[name].cjs",
  }),
]);
