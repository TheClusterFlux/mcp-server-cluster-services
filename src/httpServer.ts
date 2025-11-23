/**
 * HTTP API Server for MCP Cluster Services
 * Provides HTTP REST API access to MCP tools for remote developers
 */

import express, { Request, Response, NextFunction } from "express";
import { listServices } from "./tools/listServices.js";
import { getServiceInfo } from "./tools/getServiceInfo.js";
import { getServiceHealth } from "./tools/getServiceHealth.js";
import { discoverEndpoints } from "./tools/discoverEndpoints.js";
import { getEndpointSchema } from "./tools/getEndpointSchema.js";
import { testEndpoint } from "./tools/testEndpoint.js";
import { getApiDocumentation } from "./tools/getApiDocumentation.js";
import { validateApiKey } from "./config/auth.js";
import { rateLimiter } from "./utils/rateLimiter.js";
import { RateLimitError } from "./utils/errors.js";
import { sanitizeError } from "./utils/errors.js";

const app = express();
const PORT = process.env.PORT || 8080;
const API_VERSION = "v1";

// Security middleware
// Request size limit (1MB)
app.use(express.json({ limit: "1mb" }));

// HTTPS enforcement - only allow HTTPS requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  
  // Allow localhost for development
  const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
  
  if (protocol !== "https" && !isLocalhost) {
    return res.status(403).json({
      error: "HTTPS required",
      message: "This API only accepts HTTPS requests for security"
    });
  }
  
  next();
});

// CORS - allow same domain and subdomains (for future website on same domain)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // Allow requests from same domain or subdomains
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const hostUrl = new URL(`https://${host}`);
      
      // Extract base domain (e.g., "theclusterflux.com" from "mcp-cluster-services.theclusterflux.com")
      const getBaseDomain = (hostname: string): string => {
        const parts = hostname.split('.');
        // Take last 2 parts (e.g., "theclusterflux.com")
        return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
      };
      
      const originBase = getBaseDomain(originUrl.hostname);
      const hostBase = getBaseDomain(hostUrl.hostname);
      
      // Same base domain (allows subdomains)
      if (originBase === hostBase) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
      }
    } catch (e) {
      // Invalid origin, don't set CORS
    }
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }
  
  next();
});

// Rate limiting middleware (per API key)
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace("Bearer ", "") || 
                 req.headers["x-api-key"] as string;
  
  // Use API key for rate limiting, fallback to IP
  const rateLimitKey = apiKey || req.ip || "unknown";
  
  try {
    rateLimiter.check(`http:${rateLimitKey}`);
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: error.message,
      });
    }
    next(error);
  }
}

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace("Bearer ", "") || 
                 req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({ 
      error: "Missing API key",
      message: "Provide via Authorization: Bearer <key> or X-API-Key header"
    });
  }

  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // Attach API key to request for potential logging/rate limiting per key
  (req as any).apiKey = apiKey;
  next();
}

// Apply rate limiting and authentication to API routes (not health check)
app.use("/api", rateLimitMiddleware);
app.use("/api", authenticate);

// Helper to convert MCP response to HTTP response
function mcpToHttp(mcpResponse: any): { error?: string; [key: string]: any } {
  if (mcpResponse.isError) {
    // Extract error from content and sanitize
    try {
      const errorContent = mcpResponse.content?.[0]?.text;
      if (errorContent) {
        const parsed = JSON.parse(errorContent);
        const errorMessage = parsed.error || "Unknown error";
        return { 
          error: sanitizeError(new Error(errorMessage))
        };
      }
    } catch (e) {
      // Fallback
    }
    return { error: "Tool execution failed" };
  }

  // Extract text content and parse JSON if possible
  const textContent = mcpResponse.content?.[0]?.text;
  if (textContent) {
    try {
      return JSON.parse(textContent);
    } catch (e) {
      return { result: textContent };
    }
  }

  return { result: mcpResponse.content };
}

// Health check endpoint (no auth required)
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "healthy", 
    service: "mcp-server-cluster-services",
    version: API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// API versioning - v1 routes
const v1Router = express.Router();

// List available tools
v1Router.get("/tools", (req: Request, res: Response) => {
  res.json({
    tools: [
      "list_services",
      "get_service_info",
      "get_service_health",
      "discover_endpoints",
      "get_endpoint_schema",
      "test_endpoint",
      "get_api_documentation",
    ],
    version: API_VERSION,
  });
});

// Generic tool execution endpoint
v1Router.post("/tools/:toolName", async (req: Request, res: Response) => {
  const { toolName } = req.params;
  const args = req.body || {};

  try {
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
        return res.status(404).json({ error: `Unknown tool: ${toolName}` });
    }

    const httpResponse = mcpToHttp(mcpResponse);
    
    if (mcpResponse.isError) {
      return res.status(500).json(httpResponse);
    }

    res.json(httpResponse);
  } catch (error) {
    // Sanitize error before sending to client
    const sanitizedError = sanitizeError(error);
    res.status(500).json({
      error: "Internal server error",
      message: sanitizedError,
    });
  }
});

// Mount v1 API router
app.use(`/api/${API_VERSION}`, v1Router);

// Legacy route support (redirect to v1)
app.use("/api/tools", (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" && req.path === "/tools") {
    return res.redirect(301, `/api/${API_VERSION}/tools`);
  }
  if (req.method === "POST" && req.path.startsWith("/tools/")) {
    const toolName = req.path.replace("/tools/", "");
    return res.redirect(307, `/api/${API_VERSION}/tools/${toolName}`);
  }
  next();
});

// Error handling middleware (must be last)
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof RateLimitError) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: error.message,
    });
  }
  
  const sanitizedError = sanitizeError(error);
  res.status(500).json({
    error: "Internal server error",
    message: sanitizedError,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      `GET /health`,
      `GET /api/${API_VERSION}/tools`,
      `POST /api/${API_VERSION}/tools/:toolName`,
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`HTTP API server running on port ${PORT}`);
  console.log(`API Version: ${API_VERSION}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Tools endpoint: http://localhost:${PORT}/api/${API_VERSION}/tools`);
});

