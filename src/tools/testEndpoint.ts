/**
 * Tool: test_endpoint
 * Make a safe, read-only test API call
 */

import { HttpClient } from "../services/httpClient.js";
import { validateServiceName, validateNamespace, validateEndpoint, validateHttpMethod, validateTimeout, validateQueryParams, validateHeaders } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { SERVICE_REGISTRY } from "../config/services.js";
import { rateLimiter } from "../utils/rateLimiter.js";

export async function testEndpoint(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const endpoint = validateEndpoint(args.endpoint);
    const method = validateHttpMethod(args.method || "GET");
    const namespace = validateNamespace(args.namespace);
    const queryParams = validateQueryParams(args.queryParams);
    const headers = validateHeaders(args.headers);
    const timeout = validateTimeout(args.timeout);

    // Rate limiting
    rateLimiter.check(`test:${serviceName}:${endpoint}`);

    // Get registry config
    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    const ports = registryConfig?.port 
      ? [registryConfig.port]
      : [8080, 3000, 3001]; // Common ports

    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${ports[0]}`;

    // Build URL with query params
    const url = new URL(endpoint, baseUrl);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.append(key, value);
    }

    const httpClient = new HttpClient();

    // Make the request based on method
    let response: any;
    try {
      switch (method) {
        case "GET":
          response = await httpClient.get(url.toString(), { headers, timeout });
          break;
        case "HEAD":
          response = await httpClient.head(url.toString(), { headers, timeout });
          break;
        case "OPTIONS":
          response = await httpClient.options(url.toString(), { headers, timeout });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const result = {
        success: response.statusCode >= 200 && response.statusCode < 400,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body !== undefined ? response.body : undefined,
        responseTime: response.responseTime,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      // If first port fails, try other common ports (only for GET requests)
      if (method === "GET" && !registryConfig && ports.length > 1) {
        for (const port of ports.slice(1)) {
          try {
            const altBaseUrl = `http://${serviceName}.${namespace}.svc.cluster.local:${port}`;
            const altUrl = new URL(endpoint, altBaseUrl);
            for (const [key, value] of Object.entries(queryParams)) {
              altUrl.searchParams.append(key, value);
            }
            
            response = await httpClient.get(altUrl.toString(), { headers, timeout });
            
            const result = {
              success: response.statusCode >= 200 && response.statusCode < 400,
              statusCode: response.statusCode,
              headers: response.headers,
              body: response.body !== undefined ? response.body : undefined,
              responseTime: response.responseTime,
            };

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (altError) {
            // Try next port
            continue;
          }
        }
      }

      throw error;
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: sanitizeError(error),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

