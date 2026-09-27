import { appConfig } from "./app.js";

export const openApiConfig = {
	version: "3.0.0",
	title: `${appConfig.name} API`,
	apiVersion: "1.0.0",
	description: "",
	scalar: {
		specUrl: "/doc",
		docsPath: "/api-docs",
		layout: "classic" as const,
		theme: "moon" as const,
		pageTitle: `${appConfig.name} API`,
		defaultHttpClient: {
			targetKey: "js" as const,
			clientKey: "fetch" as const,
		},
		defaultOpenAllTags: true,
	},
} as const;

export type OpenApiConfig = typeof openApiConfig;
