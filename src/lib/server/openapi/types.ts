/** Minimal OpenAPI 3.1 types used by our static spec (no runtime dependency). */
export namespace OpenAPIV3_1 {
	export type Document = {
		openapi: string;
		info: { title: string; version: string; description?: string };
		servers?: { url: string; description?: string }[];
		tags?: { name: string; description?: string }[];
		paths: Record<string, PathItemObject>;
		components?: {
			securitySchemes?: Record<string, SecuritySchemeObject>;
			schemas?: Record<string, unknown>;
		};
	};

	export type PathItemObject = Record<string, OperationObject>;

	export type OperationObject = {
		tags?: string[];
		summary?: string;
		security?: Record<string, string[]>[];
		parameters?: { name: string; in: string; required?: boolean; schema: unknown }[];
		requestBody?: unknown;
		responses: Record<string, ResponseObject>;
	};

	export type ResponseObject = {
		description: string;
		content?: Record<string, { schema: unknown }>;
	};

	export type SecuritySchemeObject = {
		type: string;
		scheme?: string;
		bearerFormat?: string;
		description?: string;
	};
}
