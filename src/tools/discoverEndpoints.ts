/**
 * Tool: discover_endpoints
 * Discover API endpoints for a service
 */

import { ServiceDiscovery } from "../services/serviceDiscovery.js";
import { validateServiceName, validateNamespace } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { rateLimiter } from "../utils/rateLimiter.js";

export async function discoverEndpoints(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const namespace = validateNamespace(args.namespace);
    const method = args.method || "auto";

    if (!["auto", "manual", "swagger"].includes(method)) {
      throw new Error("Method must be 'auto', 'manual', or 'swagger'");
    }

    // Rate limiting
    rateLimiter.check(`discover:${serviceName}`);

    const discovery = new ServiceDiscovery();
    const result = await discovery.discoverEndpoints(serviceName, namespace, method as any);

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

