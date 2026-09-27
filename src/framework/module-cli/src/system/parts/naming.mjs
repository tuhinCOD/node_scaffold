export function assertName(value, label) {
	if (!value) {
		throw new Error(`${label} is required.`);
	}

	return value.trim().toLowerCase();
}

export function pascal(input) {
	return input.replace(/(^\w|[-_]\w)/g, (part) =>
		part.replace(/[-_]/g, "").toUpperCase(),
	);
}
