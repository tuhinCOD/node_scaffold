import { spawn } from "node:child_process";
import path from "node:path";

export async function runNodeScript(script, args = [], options = {}) {
	await new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [script, ...args], {
			stdio: options.silent ? "ignore" : "inherit",
		});
		child.on("exit", (code) =>
			code === 0
				? resolve()
				: reject(
						new Error(`${script} ${args.join(" ")} failed with code ${code}`),
					),
		);
		child.on("error", reject);
	});
}

export async function runCommand(commandName, commandArgs = [], options = {}) {
	await new Promise((resolve, reject) => {
		const isWindowsScript =
			process.platform === "win32" && /\.(cmd|ps1)$/i.test(commandName);
		const child = isWindowsScript
			? spawn(
					[commandName, ...commandArgs]
						.map((p) => (/\s/.test(p) ? `"${p.replace(/"/g, '\\"')}"` : p))
						.join(" "),
					{
						shell: true,
						stdio: options.silent ? "ignore" : "inherit",
					},
				)
			: spawn(commandName, commandArgs, {
					shell: false,
					stdio: options.silent ? "ignore" : "inherit",
				});

		child.on("exit", (code) =>
			code === 0
				? resolve()
				: reject(
						new Error(
							`${commandName} ${commandArgs.join(" ")} failed with code ${code}`,
						),
					),
		);
		child.on("error", reject);
	});
}

export function packageScript(packageName, scriptPath) {
	return path.resolve(process.cwd(), "node_modules", packageName, scriptPath);
}
