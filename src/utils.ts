export const toArray = <T>(value: T | T[] | undefined) => {
	return Array.isArray(value) ? value : value !== undefined ? [value] : [];
};
