import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"./src/onConflictDoUpdate.ts",
		"./src/onDuplicateKeyUpdate.ts",
		"./src/useLiveTablesQuery.ts",
	],
	outDir: "./dist",
	platform: "neutral",
	dts: true,
	format: ["cjs", "esm"],
	sourcemap: true,
	skipNodeModulesBundle: true,
	exports: true,
	external: ["react-native", "expo-sqlite", "react", "drizzle-orm"],
});
