/**
 * Tool: get_api_documentation
 * Retrieve API documentation if available
 */

import { ServiceDiscovery } from "../services/serviceDiscovery.js";
import { HttpClient } from "../services/httpClient.js";
import { validateServiceName, validateNamespace } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { SERVICE_REGISTRY } from "../config/services.js";
import { rateLimiter } from "../utils/rateLimiter.js";

export async function getApiDocumentation(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const namespace = validateNamespace(args.namespace);
    const format = args.format || "auto";

    if (!["swagger", "openapi", "markdown", "auto"].includes(format)) {
      throw new Error("Format must be 'swagger', 'openapi', 'markdown', or 'auto'");
    }

    // Rate limiting
    rateLimiter.check(`docs:${serviceName}`);

    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${registryConfig?.port || 8080}`;

    const httpClient = new HttpClient();

    // Try to fetch documentation
    const docPaths = [
      { path: "/swagger.json", format: "swagger" },
      { path: "/swagger.yaml", format: "swagger" },
      { path: "/openapi.json", format: "openapi" },
      { path: "/openapi.yaml", format: "openapi" },
      { path: "/api-docs", format: "swagger" },
      { path: "/v3/api-docs", format: "openapi" },
      { path: "/api/swagger.json", format: "swagger" },
      { path: "/docs", format: "markdown" },
      { path: "/README.md", format: "markdown" },
    ];

    let foundDoc: any = null;
    let foundFormat = "";

    for (const docPath of docPaths) {
      // Skip if format is specified and doesn't match
      if (format !== "auto" && format !== docPath.format) {
        continue;
      }

      try {
        const response = await httpClient.get(`${baseUrl}${docPath.path}`, { timeout: 3000 });
        if (response.statusCode === 200 && response.body) {
          foundDoc = response.body;
          foundFormat = docPath.format;
          break;
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    // If not found via HTTP, try discovery
    if (!foundDoc) {
      try {
        const discovery = new ServiceDiscovery();
        const discoveryResult = await discovery.discoverEndpoints(serviceName, namespace, "swagger");
        if (discoveryResult.documentation) {
          foundDoc = discoveryResult.documentation;
          foundFormat = "swagger";
        }
      } catch (error) {
        // Discovery failed, continue
      }
    }

    if (!foundDoc) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                serviceName,
                documentation: null,
                availableFormats: [],
                message: "No API documentation found for this service",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Parse and format the documentation
    let content: string | object = foundDoc;
    if (typeof foundDoc === "string" && foundFormat === "swagger") {
      try {
        content = JSON.parse(foundDoc);
      } catch (error) {
        // Keep as string if not valid JSON
      }
    }

    const result = {
      serviceName,
      documentation: {
        format: foundFormat,
        content,
        version: typeof content === "object" && "info" in content 
          ? (content as any).info?.version 
          : undefined,
        lastUpdated: new Date().toISOString(),
      },
      availableFormats: [foundFormat],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { error: sanitizeError(error) },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

