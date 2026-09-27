const NPM_ENV_FLAGS = {
	"--yes": "npm_config_yes",
	"--force": "npm_config_force",
	"--dry-run": "npm_config_dry_run",
};

export function hasFlag(flags, name) {
	if (flags.includes(name)) return true;
	const envKey = NPM_ENV_FLAGS[name];
	if (!envKey) return false;
	const value = process.env[envKey];
	return value === "true" || value === "1";
}

export function getOption(flags = [], name, fallback = "") {
	const item = flags.find((flag) => flag.startsWith(`${name}=`));
	return item ? item.slice(name.length + 1) : fallback;
}
