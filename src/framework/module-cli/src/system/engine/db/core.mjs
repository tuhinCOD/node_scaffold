import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

import { packageScript, runNodeScript } from "../../parts/process.mjs";

export async function generateSchema(options = {}) {
	const backendSrc = path.resolve(process.cwd(), "src");
	const files = await glob("modules/**/database/models/*.{ts,js}", {
		cwd: backendSrc,
		nodir: true,
		windowsPathsNoEscape: true,
	});
	const exports = [];
	for (const file of files.sort()) {
		const parts = file.replace(/\\/g, "/").split("/");
		const moduleName = parts[0] === "modules" ? parts[1] : parts[0];
		const base = path.basename(file).replace(/\.(ts|js)$/, "");
		exports.push(
			`export * from "../../modules/${moduleName}/database/models/${base}.js";`,
		);
	}
	const output = path.join(backendSrc, "database/schema/index.ts");
	await fs.mkdir(path.dirname(output), { recursive: true });
	await fs.writeFile(output, exports.length ? `${exports.join("\n")}\n` : "");
	if (!options.silent)
		console.log(
			`Generated src/database/schema/index.ts with ${files.length} model file(s)`,
		);
}

async function runDrizzle(args) {
	const bin = packageScript("drizzle-kit", "bin.cjs");
	await runNodeScript(bin, args);
}

export async function dbGenerate() {
	await generateSchema();
	await runDrizzle(["generate"]);
}

export async function dbMigrate() {
	await generateSchema();
	await runDrizzle(["migrate"]);
}

export async function dbPush() {
	await generateSchema();
	await runDrizzle(["push"]);
}

export async function dbCheck() {
	await generateSchema();
	await runDrizzle(["check"]);
}

export async function dbStudio() {
	await generateSchema({ silent: true });
	try {
		await runDrizzle(["studio"], { silent: true });
	} catch (_error) {
		throw new Error("db:studio unavailable");
	}
}

export async function listMigrations() {
	const files = await glob("src/database/migrations/**/*.sql", {
		cwd: process.cwd(),
		nodir: true,
		windowsPathsNoEscape: true,
	});
	const sorted = files.sort();
	if (!sorted.length) {
		console.log("No generated migration files found.");
		return;
	}
	console.log("Generated migrations:");
	for (const file of sorted) console.log(`  - ${file}`);
}

export async function runSeeder(moduleName = "") {
	const script = path.resolve(
		import.meta.dirname,
		"../../../../../database/seed.ts",
	);
	const args = ["--tsconfig=tsconfig.backend.json", script];
	if (moduleName) args.push(`--module=${moduleName}`);
	await runNodeScript(packageScript("tsx", "dist/cli.mjs"), args);
}
