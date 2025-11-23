/**
 * Tool: get_endpoint_schema
 * Get request/response schema for a specific endpoint
 */

import { ServiceDiscovery } from "../services/serviceDiscovery.js";
import { validateServiceName, validateNamespace, validateEndpoint } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { SERVICE_REGISTRY } from "../config/services.js";
import { rateLimiter } from "../utils/rateLimiter.js";

export async function getEndpointSchema(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const endpoint = validateEndpoint(args.endpoint);
    const method = args.method?.toUpperCase() || "GET";
    const namespace = validateNamespace(args.namespace);

    // Rate limiting
    rateLimiter.check(`schema:${serviceName}:${endpoint}`);

    // Get registry config
    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    // Try to discover endpoints to get schema
    const discovery = new ServiceDiscovery();
    const discoveryResult = await discovery.discoverEndpoints(serviceName, namespace, "auto");

    // Find the specific endpoint
    const endpointInfo = discoveryResult.endpoints.find(
      (ep) => ep.path === endpoint && ep.method.toUpperCase() === method.toUpperCase()
    );

    if (!endpointInfo) {
      // Return basic schema if not found
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                endpoint,
                method,
                description: "Endpoint schema not available",
                request: {
                  headers: {},
                  queryParams: [],
                  pathParams: [],
                  authentication: {
                    type: "unknown",
                    required: false,
                  },
                },
                response: {
                  statusCodes: [
                    { code: 200, description: "Success" },
                    { code: 404, description: "Not found" },
                    { code: 500, description: "Server error" },
                  ],
                },
                note: "Endpoint not found in discovery. Schema may need to be manually configured.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Build schema from discovered endpoint
    const bodyParams = endpointInfo.parameters?.filter((p) => p.location === "body") || [];
    const hasBodyParams = bodyParams.length > 0;
    
    const result = {
      endpoint,
      method,
      description: endpointInfo.description,
      request: {
        headers: {},
        queryParams: endpointInfo.parameters?.filter((p) => p.location === "query") || [],
        pathParams: endpointInfo.parameters?.filter((p) => p.location === "path") || [],
        body: hasBodyParams
          ? {
              schema: {
                type: "object",
                properties: bodyParams.reduce((acc, p) => {
                  acc[p.name] = { type: p.type };
                  return acc;
                }, {} as Record<string, any>),
              },
            }
          : undefined,
        authentication: {
          type: endpointInfo.authentication || "unknown",
          required: endpointInfo.authentication !== "none",
        },
      },
      response: {
        statusCodes: [
          { code: 200, description: "Success" },
          { code: 400, description: "Bad request" },
          { code: 404, description: "Not found" },
          { code: 500, description: "Server error" },
        ],
        schema: endpointInfo.responseType
          ? {
              type: endpointInfo.responseType,
            }
          : undefined,
      },
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

