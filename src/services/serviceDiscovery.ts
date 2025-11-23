/**
 * Service discovery logic for finding and understanding services
 */

import { KubernetesClient } from "./kubernetes.js";
import { HttpClient } from "./httpClient.js";
import { ServiceConfig } from "../config/services.js";
import { SERVICE_REGISTRY } from "../config/services.js";

export interface DiscoveredEndpoint {
  path: string;
  method: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    location: "query" | "path" | "body";
  }>;
  responseType?: string;
  authentication?: "none" | "jwt" | "basic" | "unknown";
}

export interface ServiceDiscoveryResult {
  serviceName: string;
  baseUrl: string;
  endpoints: DiscoveredEndpoint[];
  discoveryMethod: string;
  documentation?: string;
}

export class ServiceDiscovery {
  private k8sClient: KubernetesClient;
  private httpClient: HttpClient;

  constructor() {
    this.k8sClient = new KubernetesClient();
    this.httpClient = new HttpClient();
  }

  /**
   * Discover endpoints for a service
   */
  async discoverEndpoints(
    serviceName: string,
    namespace: string = "default",
    method: "auto" | "manual" | "swagger" = "auto"
  ): Promise<ServiceDiscoveryResult> {
    // Check service registry first
    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    if (registryConfig && registryConfig.endpoints && registryConfig.endpoints.length > 0) {
      return {
        serviceName,
        baseUrl: registryConfig.baseUrl,
        endpoints: registryConfig.endpoints.map((ep) => ({
          path: ep.path,
          method: ep.method,
          description: ep.description,
        })),
        discoveryMethod: "registry",
      };
    }

    // Try to discover from Swagger/OpenAPI
    if (method === "auto" || method === "swagger") {
      try {
        const swaggerEndpoints = await this.discoverFromSwagger(
          serviceName,
          namespace,
          registryConfig
        );
        if (swaggerEndpoints.endpoints.length > 0) {
          return swaggerEndpoints;
        }
      } catch (error) {
        // Fall through to manual discovery
      }
    }

    // Fallback to manual/Kubernetes-based discovery
    return this.discoverFromKubernetes(serviceName, namespace, registryConfig);
  }

  /**
   * Try to discover endpoints from Swagger/OpenAPI spec
   */
  private async discoverFromSwagger(
    serviceName: string,
    namespace: string,
    registryConfig?: ServiceConfig
  ): Promise<ServiceDiscoveryResult> {
    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${registryConfig?.port || 8080}`;

    const swaggerPaths = [
      "/swagger.json",
      "/swagger.yaml",
      "/api-docs",
      "/openapi.json",
      "/v3/api-docs",
      "/api/swagger.json",
    ];

    for (const path of swaggerPaths) {
      try {
        const response = await this.httpClient.get(`${baseUrl}${path}`, { timeout: 3000 });
        if (response.statusCode === 200 && response.body) {
          return this.parseSwaggerSpec(response.body, baseUrl);
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    throw new Error("Swagger/OpenAPI spec not found");
  }

  /**
   * Parse Swagger/OpenAPI spec
   */
  private parseSwaggerSpec(spec: any, baseUrl: string): ServiceDiscoveryResult {
    const endpoints: DiscoveredEndpoint[] = [];
    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      const pathMethods = methods as Record<string, any>;
      for (const [method, details] of Object.entries(pathMethods)) {
        if (["get", "post", "put", "delete", "patch", "head", "options"].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: details.summary || details.description,
            parameters: this.extractParameters(details.parameters),
            responseType: this.extractResponseType(details.responses),
            authentication: this.detectAuthentication(details.security),
          });
        }
      }
    }

    return {
      serviceName: spec.info?.title || "unknown",
      baseUrl,
      endpoints,
      discoveryMethod: "swagger",
      documentation: spec.info?.description,
    };
  }

  /**
   * Extract parameters from Swagger spec
   */
  private extractParameters(params?: any[]): DiscoveredEndpoint["parameters"] {
    if (!params || !Array.isArray(params)) {
      return undefined;
    }

    return params.map((param) => ({
      name: param.name,
      type: param.schema?.type || param.type || "string",
      required: param.required || false,
      location: param.in || "query",
    }));
  }

  /**
   * Extract response type from Swagger spec
   */
  private extractResponseType(responses?: any): string | undefined {
    if (!responses) {
      return undefined;
    }

    const successResponse = responses["200"] || responses["201"] || responses["204"];
    if (successResponse?.content?.["application/json"]?.schema) {
      return "application/json";
    }

    return undefined;
  }

  /**
   * Detect authentication type
   */
  private detectAuthentication(security?: any[]): DiscoveredEndpoint["authentication"] {
    if (!security || security.length === 0) {
      return "none";
    }

    // Simple detection - can be enhanced
    return "unknown";
  }

  /**
   * Discover from Kubernetes metadata and annotations
   */
  private async discoverFromKubernetes(
    serviceName: string,
    namespace: string,
    registryConfig?: ServiceConfig
  ): Promise<ServiceDiscoveryResult> {
    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${registryConfig?.port || 8080}`;

    // Try to get service annotations
    try {
      const service = await this.k8sClient.getService(serviceName, namespace);
      const annotations = service.metadata?.annotations || {};

      // Check for documented endpoints in annotations
      if (annotations["mcp.clusterflux.io/endpoints"]) {
        try {
          const endpoints = JSON.parse(annotations["mcp.clusterflux.io/endpoints"]);
          return {
            serviceName,
            baseUrl,
            endpoints: Array.isArray(endpoints) ? endpoints : [],
            discoveryMethod: "annotations",
          };
        } catch (error) {
          // Invalid JSON, continue
        }
      }
    } catch (error) {
      // Service not found or error, continue with defaults
    }

    // Default endpoints (health check, etc.)
    const defaultEndpoints: DiscoveredEndpoint[] = [
      {
        path: "/health",
        method: "GET",
        description: "Health check endpoint",
      },
      {
        path: "/api/health",
        method: "GET",
        description: "API health check endpoint",
      },
    ];

    return {
      serviceName,
      baseUrl,
      endpoints: defaultEndpoints,
      discoveryMethod: "default",
    };
  }
}

