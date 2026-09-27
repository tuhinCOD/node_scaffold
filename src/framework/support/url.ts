import { appConfig } from "@/config/index.js";

export const urls = {
	appUrl() {
		return appConfig.frontendUrl.replace(/\/$/, "");
	},

	url(path = "") {
		const base = urls.appUrl();
		if (!path) return base;
		return `${base}${path.startsWith("/") ? path : `/${path}`}`;
	},
};
