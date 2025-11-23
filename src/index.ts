/**
 * MCP Server - Cluster Services
 * Main entry point for the Model Context Protocol server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listServices } from "./tools/listServices.js";
import { getServiceInfo } from "./tools/getServiceInfo.js";
import { getServiceHealth } from "./tools/getServiceHealth.js";
import { discoverEndpoints } from "./tools/discoverEndpoints.js";
import { getEndpointSchema } from "./tools/getEndpointSchema.js";
import { testEndpoint } from "./tools/testEndpoint.js";
import { getApiDocumentation } from "./tools/getApiDocumentation.js";

const server = new Server(
  {
    name: "cluster-services-clusterflux",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
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
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_services":
        return await listServices(args || {});
      case "get_service_info":
        return await getServiceInfo(args || {});
      case "get_service_health":
        return await getServiceHealth(args || {});
      case "discover_endpoints":
        return await discoverEndpoints(args || {});
      case "get_endpoint_schema":
        return await getEndpointSchema(args || {});
      case "test_endpoint":
        return await testEndpoint(args || {});
      case "get_api_documentation":
        return await getApiDocumentation(args || {});
      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: `Unknown tool: ${name}` },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cluster Services MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

