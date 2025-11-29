import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["test/integration/**/*.test.ts"],
		testTimeout: 120000,
		hookTimeout: 120000,
		pool: "forks",
		maxWorkers: 1,
		maxConcurrency: 1,
	},
});
