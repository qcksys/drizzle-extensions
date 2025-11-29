import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/unit/**/*.test.ts"],
		server: {
			deps: {
				external: ["react-native", "expo-sqlite"],
			},
		},
	},
});
