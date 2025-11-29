import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/integration/**/*.test.ts"],
		testTimeout: 120000,
		hookTimeout: 120000,
		pool: "forks",
	},
});
