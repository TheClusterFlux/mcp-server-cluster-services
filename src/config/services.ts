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
  {
    name: "homepage",
    namespace: "default",
    port: 8080,
    baseUrl: "http://homepage.default.svc.cluster.local:8080",
    healthEndpoint: "/",
    endpoints: [
      { path: "/", method: "GET", description: "Main homepage" },
      { path: "/about.html", method: "GET", description: "About page" },
      { path: "/api/fetch-data", method: "GET", description: "Fetch and save homepage data from MongoDB" },
      { path: "/api/cluster-metrics", method: "GET", description: "Get cluster metrics (nodes, pods, CPU, memory)" },
      // NOTE: The following POST endpoints require admin authentication (to be implemented)
      { path: "/api/add-project", method: "POST", description: "Add project with image upload (requires admin)" },
      { path: "/api/add-creator", method: "POST", description: "Add creator to database (requires admin)" },
      { path: "/api/add-technology", method: "POST", description: "Add technology to database (requires admin)" },
    ],
  },
];

