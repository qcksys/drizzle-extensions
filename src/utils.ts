import type { Column } from "drizzle-orm";

export const toArray = <T extends Column>(value: T | T[] | undefined): T[] => {
	return Array.isArray(value) ? value : value !== undefined ? [value] : [];
};
