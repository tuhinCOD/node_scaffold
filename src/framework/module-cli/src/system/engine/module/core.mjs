import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

import { hasFlag } from "../../parts/flags.mjs";
import { assertName, pascal } from "../../parts/naming.mjs";

const stubsRoot = path.resolve(import.meta.dirname, "../../../../stubs");

const STUBS = {
	controller: "controller/plain.ts.stub",
	route: "route/plain.ts.stub",
	model: "model/name.postgresql.ts.stub",
	seeder: "seeder/name.ts.stub",
	job: "job/name.ts.stub",
	console: "console/name.ts.stub",
	moduleIndex: "modules/index.ts.stub",
};

async function readStubRaw(name) {
	const file = path.join(stubsRoot, name);
	return fs.readFile(file, "utf8");
}

async function stub(name, values = {}) {
	let content = await readStubRaw(name);
	for (const [key, value] of Object.entries(values)) {
		content = content.replaceAll(`{{${key}}}`, String(value));
	}
	return content.replace(/\{\{[A-Z0-9_]+\}\}/g, "");
}

function moduleRoot(moduleName) {
	return path.resolve(process.cwd(), "src/modules", moduleName);
}

async function assertModuleExists(moduleName) {
	const root = moduleRoot(moduleName);
	let stats;
	try {
		stats = await fs.stat(root);
	} catch {
		throw new Error(
			`Module does not exist: ${moduleName}. Create it first with: npm run module -- module:make ${moduleName}`,
		);
	}
	if (!stats.isDirectory()) {
		throw new Error(
			`Module path is not a directory: src/modules/${moduleName}`,
		);
	}
	return root;
}

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function writeFileSafe(filePath, content, flags = [], label = "File") {
	const dryRun = hasFlag(flags, "--dry-run");
	const force = hasFlag(flags, "--force") || hasFlag(flags, "--yes");
	if (dryRun) return;
	const exists = await pathExists(filePath);
	if (exists && !force) {
		throw new Error(
			`${label} already exists: ${path.relative(process.cwd(), filePath)}. Re-run with --force to overwrite.`,
		);
	}
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, content);
}

/**
 * Register a model file in the existing schema barrel (src/database/schema/index.ts)
 * so the generated table is discovered by drizzle without recreating the setup.
 * Reuses the current barrel file, appending a single export line if missing.
 * @param {string} moduleName module folder name
 * @param {string} modelBase base model name (e.g. "user") used for both the file and table variable
 */
export async function registerModelInSchema(moduleName, modelBase) {
	const schemaPath = path.resolve(
		process.cwd(),
		"src/database/schema/index.ts",
	);
	const tableVariable = `${modelBase}s`;
	const exportLine = `export * from "../../modules/${moduleName}/database/models/${modelBase}.js";`;
	let content = "";
	try {
		content = await fs.readFile(schemaPath, "utf8");
	} catch {
		content = "";
	}
	if (content.includes(exportLine)) return;
	const updated = content
		? `${content.trimEnd()}\n${exportLine}\n`
		: `${exportLine}\n`;
	await fs.mkdir(path.dirname(schemaPath), { recursive: true });
	await fs.writeFile(schemaPath, updated);
	console.log(`Registered ${tableVariable} in src/database/schema/index.ts`);
}

async function controllerTemplate(moduleName, controllerName) {
	return await stub(STUBS.controller, {
		module: moduleName,
		controller: controllerName,
	});
}

async function routeTemplate(moduleName, controllerName) {
	return await stub(STUBS.route, {
		module: moduleName,
		controller: controllerName,
	});
}

async function namedModelTemplate(moduleName, name) {
	return await stub(STUBS.model, {
		module: moduleName,
		name,
		ClassName: pascal(name),
		tableName: `${name}s`,
		tableVariable: `${name}s`,
	});
}

async function namedSeederTemplate(moduleName, modelName, className) {
	return await stub(STUBS.seeder, {
		module: moduleName,
		name: modelName,
		ClassName: pascal(className),
		tableName: `${modelName}s`,
		tableVariable: `${modelName}s`,
	});
}

export async function makeModule(rawName) {
	const name = assertName(rawName, "Module name");
	const root = moduleRoot(name);
	const controller = await controllerTemplate(name, name);
	const route = await routeTemplate(name, name);
	const model = await namedModelTemplate(name, name);
	const seeder = await namedSeederTemplate(name, name, name);
	const job = await stub(STUBS.job, { module: name, name, queue: "default" });
	const consoleFile = await stub(STUBS.console, {
		module: name,
		name,
		queue: "default",
	});

	await fs.mkdir(path.join(root, "controllers"), { recursive: true });
	await fs.mkdir(path.join(root, "routes"), { recursive: true });
	await fs.mkdir(path.join(root, "database/models"), { recursive: true });
	await fs.mkdir(path.join(root, "database/seeders"), { recursive: true });
	await fs.mkdir(path.join(root, "jobs"), { recursive: true });
	await fs.mkdir(path.join(root, "console"), { recursive: true });

	await fs.writeFile(
		path.join(root, "controllers", `${name}.controller.ts`),
		controller,
	);
	await fs.writeFile(path.join(root, "routes", "api.ts"), route);
	await fs.writeFile(path.join(root, "database/models", `${name}.ts`), model);
	await fs.writeFile(path.join(root, "database/seeders", `${name}.ts`), seeder);
	await fs.writeFile(path.join(root, "jobs", `${name}.ts`), job);
	await fs.writeFile(path.join(root, "console", `${name}.ts`), consoleFile);
	await registerModelInSchema(name, name);

	console.log(`Module ready: ${name}`);
	console.log(
		`Mount its route in src/framework/app.ts with: app.use('/api/${name}', ${name}Route)`,
	);
}

export async function makeRoute(
	rawModule,
	rawControllerOrFlag,
	extraFlags = [],
) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let routeName = moduleName;
	let controllerExplicit = false;
	if (rawControllerOrFlag) {
		if (rawControllerOrFlag.startsWith("--")) flags.push(rawControllerOrFlag);
		else {
			routeName = assertName(rawControllerOrFlag, "Route name");
			controllerExplicit = true;
		}
	}
	flags.push(...extraFlags);
	const route = await routeTemplate(moduleName, routeName);
	const routeFile = controllerExplicit ? `${routeName}.ts` : "api.ts";
	await writeFileSafe(
		path.join(root, `routes/${routeFile}`),
		route,
		flags,
		"Route file",
	);
	console.log(`Route ready: ${routeFile}`);
}

export async function makeController(
	rawModule,
	rawNameOrFlag,
	extraFlags = [],
) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let controllerName = moduleName;
	if (rawNameOrFlag) {
		if (rawNameOrFlag.startsWith("--")) flags.push(rawNameOrFlag);
		else controllerName = assertName(rawNameOrFlag, "Controller name");
	}
	flags.push(...extraFlags);
	await writeFileSafe(
		path.join(root, `controllers/${controllerName}.controller.ts`),
		await controllerTemplate(moduleName, controllerName),
		flags,
		"Controller file",
	);
}

export async function makeModel(rawModule, rawNameOrFlag, extraFlags = []) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let name = moduleName;
	if (rawNameOrFlag) {
		if (rawNameOrFlag.startsWith("--")) flags.push(rawNameOrFlag);
		else name = assertName(rawNameOrFlag, "Model name");
	}
	flags.push(...extraFlags);
	await writeFileSafe(
		path.join(root, `database/models/${name}.ts`),
		await namedModelTemplate(moduleName, name),
		flags,
		"Model file",
	);
	if (!hasFlag(flags, "--dry-run"))
		await registerModelInSchema(moduleName, name);
}

export async function makeSeeder(rawModule, rawNameOrFlag, extraFlags = []) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let name = moduleName;
	if (rawNameOrFlag) {
		if (rawNameOrFlag.startsWith("--")) flags.push(rawNameOrFlag);
		else name = assertName(rawNameOrFlag, "Seeder name");
	}
	flags.push(...extraFlags);
	let modelName = name;
	const modelPath = path.join(root, "database/models", `${modelName}.ts`);
	const exists = await pathExists(modelPath);
	if (!exists) {
		modelName = moduleName;
		const fallback = path.join(root, "database/models", `${modelName}.ts`);
		if (!(await pathExists(fallback))) {
			throw new Error(
				`Model not found for seeder: src/modules/${moduleName}/database/models/${name}.ts. Create it first with: npm run module -- module:make-model ${moduleName} ${name}`,
			);
		}
	}
	await writeFileSafe(
		path.join(root, `database/seeders/${name}.ts`),
		await namedSeederTemplate(moduleName, modelName, name),
		flags,
		"Seeder file",
	);
	console.log(`Seeder ready: ${moduleName}/${name}`);
}

export async function makeJob(rawModule, rawNameOrFlag, extraFlags = []) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let name = moduleName;
	if (rawNameOrFlag) {
		if (rawNameOrFlag.startsWith("--")) flags.push(rawNameOrFlag);
		else name = assertName(rawNameOrFlag, "Job name");
	}
	flags.push(...extraFlags);
	await writeFileSafe(
		path.join(root, `jobs/${name}.ts`),
		await stub(STUBS.job, { module: moduleName, name, queue: "default" }),
		flags,
		"Job file",
	);
}

export async function makeConsole(rawModule, rawNameOrFlag, extraFlags = []) {
	const moduleName = assertName(rawModule, "Module name");
	const root = await assertModuleExists(moduleName);
	const flags = [];
	let name = moduleName;
	if (rawNameOrFlag) {
		if (rawNameOrFlag.startsWith("--")) flags.push(rawNameOrFlag);
		else name = assertName(rawNameOrFlag, "Console name");
	}
	flags.push(...extraFlags);
	await writeFileSafe(
		path.join(root, `console/${name}.ts`),
		await stub(STUBS.console, { module: moduleName, name, queue: "default" }),
		flags,
		"Console file",
	);
}

export async function listModules() {
	const modulesRoot = path.resolve(process.cwd(), "src/modules");
	try {
		const entries = await fs.readdir(modulesRoot, { withFileTypes: true });
		const modules = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();
		if (!modules.length) {
			console.log("No modules found.");
			return;
		}
		console.log("Modules:");
		for (const module of modules) console.log(`  - ${module}`);
	} catch {
		console.log("No modules found.");
	}
}

async function unregisterModuleModelsFromSchema(moduleName) {
	const modelsRoot = path.join(moduleRoot(moduleName), "database/models");
	let files;
	try {
		files = (await fs.readdir(modelsRoot)).filter(
			(f) => f.endsWith(".ts") || f.endsWith(".js"),
		);
	} catch {
		return;
	}
	if (!files.length) return;
	const bases = files.map((f) => path.basename(f).replace(/\.(ts|js)$/, ""));
	const schemaPath = path.resolve(
		process.cwd(),
		"src/database/schema/index.ts",
	);
	let content;
	try {
		content = await fs.readFile(schemaPath, "utf8");
	} catch {
		return;
	}
	const kept = content
		.split("\n")
		.filter((line) => {
			const match = line.match(
				/modules\/([^/]+)\/database\/models\/([^/]+)\.js/,
			);
			if (!match) return true;
			return match[1] !== moduleName || !bases.includes(match[2]);
		})
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trimEnd();
	const updated = kept ? `${kept}\n` : "";
	if (updated === content) return;
	await fs.writeFile(schemaPath, updated);
	console.log(
		`Removed ${bases.length} model export(s) of '${moduleName}' from src/database/schema/index.ts`,
	);
}

export async function deleteModule(rawName, flags = []) {
	const name = assertName(rawName, "Module name");
	const modulesRoot = path.resolve(process.cwd(), "src/modules");
	const modulePath = path.resolve(modulesRoot, name);
	const relative = path.relative(modulesRoot, modulePath);
	if (relative.startsWith("..") || path.isAbsolute(relative))
		throw new Error("Unsafe module path.");
	let stats;
	try {
		stats = await fs.stat(modulePath);
	} catch {
		throw new Error(`Module not found: ${name}`);
	}
	if (!stats.isDirectory())
		throw new Error(`Module path is not a directory: src/modules/${name}`);
	const dryRun = hasFlag(flags, "--dry-run");
	const confirmed = hasFlag(flags, "--yes") || hasFlag(flags, "--force");
	if (dryRun) return;
	if (!confirmed)
		throw new Error(
			`Refusing to delete module without confirmation. Re-run with: npm run module -- module:delete ${name} --yes`,
		);
	await unregisterModuleModelsFromSchema(name);
	await fs.rm(modulePath, { recursive: true, force: true });
	console.log(`Deleted module: src/modules/${name}`);
}

export async function assertModuleHasSeeders(moduleName) {
	await assertModuleExists(moduleName);
	const files = await glob(`${moduleName}/database/seeders/*.{ts,js}`, {
		cwd: path.resolve(process.cwd(), "src/modules"),
		nodir: true,
		windowsPathsNoEscape: true,
	});
	if (!files.length)
		throw new Error(`No seeders found for module '${moduleName}'.`);
}
