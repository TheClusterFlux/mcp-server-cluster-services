/**
 * MCP Protocol Handler
 * Handles MCP protocol messages (JSON-RPC 2.0 format) over HTTP
 */

import { listServices } from "./tools/listServices.js";
import { getServiceInfo } from "./tools/getServiceInfo.js";
import { getServiceHealth } from "./tools/getServiceHealth.js";
import { discoverEndpoints } from "./tools/discoverEndpoints.js";
import { getEndpointSchema } from "./tools/getEndpointSchema.js";
import { testEndpoint } from "./tools/testEndpoint.js";
import { getApiDocumentation } from "./tools/getApiDocumentation.js";

// Tool definitions matching src/index.ts
const TOOL_DEFINITIONS = [
  {
    name: "list_services",
    description: "List all services deployed in the Kubernetes cluster",
    inputSchema: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Kubernetes namespace (default: 'default')",
        },
        serviceType: {
          type: "string",
          description: "Filter by service type (e.g., 'Deployment', 'Service')",
        },
      },
    },
  },
  {
    name: "get_service_info",
    description: "Get detailed information about a specific service",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace (default: 'default')",
        },
        includeEndpoints: {
          type: "boolean",
          description: "Include endpoint details",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "get_service_health",
    description: "Check the health status of a service",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace",
        },
        checkEndpoint: {
          type: "string",
          description: "Specific health check endpoint to test",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "discover_endpoints",
    description: "Discover API endpoints for a service",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace",
        },
        method: {
          type: "string",
          enum: ["auto", "manual", "swagger"],
          description: "Method to discover endpoints",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "get_endpoint_schema",
    description: "Get request/response schema for a specific endpoint",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        endpoint: {
          type: "string",
          description: "API endpoint path (e.g., '/api/v1/orders')",
        },
        method: {
          type: "string",
          description: "HTTP method (GET, POST, etc.)",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace",
        },
      },
      required: ["serviceName", "endpoint", "method"],
    },
  },
  {
    name: "test_endpoint",
    description: "Make a safe, read-only test API call (GET, HEAD, OPTIONS only)",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        endpoint: {
          type: "string",
          description: "API endpoint path",
        },
        method: {
          type: "string",
          enum: ["GET", "HEAD", "OPTIONS"],
          description: "HTTP method (only safe methods allowed)",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace",
        },
        queryParams: {
          type: "object",
          description: "Query parameters",
        },
        headers: {
          type: "object",
          description: "HTTP headers",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 5000)",
        },
      },
      required: ["serviceName", "endpoint", "method"],
    },
  },
  {
    name: "get_api_documentation",
    description: "Retrieve API documentation if available",
    inputSchema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Name of the service",
        },
        namespace: {
          type: "string",
          description: "Kubernetes namespace",
        },
        format: {
          type: "string",
          enum: ["swagger", "openapi", "markdown", "auto"],
          description: "Documentation format",
        },
      },
      required: ["serviceName"],
    },
  },
];

/**
 * Handle MCP protocol request (JSON-RPC 2.0 format)
 */
export async function handleMcpRequest(method: string, params: any, id?: string | number): Promise<any> {
  try {
    let result: any;

    switch (method) {
      case "tools/list":
        result = {
          tools: TOOL_DEFINITIONS,
        };
        break;

      case "tools/call":
        const toolName = params.name;
        const args = params.arguments || {};

        let mcpResponse: any;
        switch (toolName) {
          case "list_services":
            mcpResponse = await listServices(args);
            break;
          case "get_service_info":
            mcpResponse = await getServiceInfo(args);
            break;
          case "get_service_health":
            mcpResponse = await getServiceHealth(args);
            break;
          case "discover_endpoints":
            mcpResponse = await discoverEndpoints(args);
            break;
          case "get_endpoint_schema":
            mcpResponse = await getEndpointSchema(args);
            break;
          case "test_endpoint":
            mcpResponse = await testEndpoint(args);
            break;
          case "get_api_documentation":
            mcpResponse = await getApiDocumentation(args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        // Convert MCP response to JSON-RPC result
        if (mcpResponse.isError) {
          const errorContent = mcpResponse.content?.[0]?.text;
          let errorMessage = "Tool execution failed";
          if (errorContent) {
            try {
              const parsed = JSON.parse(errorContent);
              errorMessage = parsed.error || errorMessage;
            } catch (e) {
              errorMessage = errorContent;
            }
          }
          throw new Error(errorMessage);
        }

        // Extract content from MCP response
        const textContent = mcpResponse.content?.[0]?.text;
        if (textContent) {
          try {
            result = JSON.parse(textContent);
          } catch (e) {
            result = { result: textContent };
          }
        } else {
          result = { result: mcpResponse.content };
        }
        break;

      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "cluster-services-clusterflux",
            version: "1.0.0",
          },
        };
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    // Return JSON-RPC 2.0 success response
    return {
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      result: result,
    };
  } catch (error) {
    // Return JSON-RPC 2.0 error response
    return {
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Get tool definitions for MCP protocol
 */
export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

