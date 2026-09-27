import { apiReference } from "@scalar/express-api-reference";
import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import { appConfig, openApiConfig } from "@/config/index.js";

const swaggerSpec = swaggerJsdoc({
	definition: {
		openapi: openApiConfig.version,
		info: {
			title: openApiConfig.title,
			version: openApiConfig.apiVersion,
			description: openApiConfig.description,
		},
		servers: [
			{
				url: appConfig.url,
				description: "Local development",
			},
		],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	apis: ["./src/modules/**/controllers/*.ts"],
});

export function configureOpenApi(app: Express) {
	app.get("/doc", (_req, res) => {
		res.json(swaggerSpec);
	});

	app.use(
		openApiConfig.scalar.docsPath,
		apiReference({
			url: openApiConfig.scalar.specUrl,
			layout: openApiConfig.scalar.layout,
			theme: openApiConfig.scalar.theme,
			pageTitle: openApiConfig.scalar.pageTitle,
			defaultHttpClient: openApiConfig.scalar.defaultHttpClient,
			defaultOpenAllTags: openApiConfig.scalar.defaultOpenAllTags,
		}),
	);
}
