/**
 * Service registry configuration
 * 
 * TODO: Configure your services here
 * Add service configurations as needed
 */

export interface ServiceConfig {
  name: string;
  namespace: string;
  port: number;
  baseUrl: string;
  healthEndpoint?: string;
  endpoints?: Array<{
    path: string;
    method: string;
    description?: string;
  }>;
}

/**
 * Service registry - pre-configured services
 * 
 * Add your service configurations here following this format:
 * 
 * {
 *   name: "service-name",
 *   namespace: "default",
 *   port: 8080,
 *   baseUrl: "http://service-name.default.svc.cluster.local:8080",
 *   healthEndpoint: "/health",
 *   endpoints: [
 *     { path: "/health", method: "GET", description: "Health check" },
 *     { path: "/api/v1/endpoint", method: "GET", description: "Endpoint description" },
 *   ],
 * }
 */
export const SERVICE_REGISTRY: ServiceConfig[] = [
  // TODO: Add your service configurations here
  // Example (commented out):
  // {
  //   name: "example-service",
  //   namespace: "default",
  //   port: 8080,
  //   baseUrl: "http://example-service.default.svc.cluster.local:8080",
  //   healthEndpoint: "/health",
  //   endpoints: [
  //     { path: "/health", method: "GET", description: "Health check" },
  //   ],
  // },
];

