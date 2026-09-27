import path from "node:path";
import { pathToFileURL } from "node:url";

import { glob } from "glob";

import { db } from "../../database/index.js";

function moduleOption() {
	const flags = process.argv.slice(2);
	const item = flags.find((flag) => flag.startsWith("--module="));
	return item ? item.slice("--module=".length) : "";
}

async function discoverSeeders(moduleName = "") {
	const pattern = moduleName
		? `${moduleName}/database/seeders/*.{ts,js}`
		: "**/database/seeders/*.{ts,js}";
	const files = await glob(pattern, {
		cwd: path.resolve(process.cwd(), "src/modules"),
		nodir: true,
		windowsPathsNoEscape: true,
	});
	return files.sort();
}

async function runSeeder(file: string) {
	const seederPath = path.resolve(process.cwd(), "src/modules", file);
	const imported = await import(pathToFileURL(seederPath).href);
	const seeder = imported.default;
	if (typeof seeder !== "function") {
		console.warn(`Skipped ${file}: no default seeder function exported`);
		return;
	}
	console.log(`  - ${file}`);
	await seeder();
}

async function main() {
	const moduleName = moduleOption();
	const files = await discoverSeeders(moduleName);
	if (!files.length) {
		console.log(
			moduleName
				? `No seeders found for module '${moduleName}'.`
				: "No seeders found.",
		);
		return;
	}
	console.log(
		moduleName
			? `Seeding module '${moduleName}' (${files.length} seeder file(s))`
			: `Seeding ${files.length} seeder file(s)`,
	);
	for (const file of files) await runSeeder(file);
	await db.$client.end();
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
