/**
 * Tool: get_service_health
 * Check the health status of a service
 */

import { KubernetesClient } from "../services/kubernetes.js";
import { HttpClient } from "../services/httpClient.js";
import { validateServiceName, validateNamespace, validateEndpoint } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { SERVICE_REGISTRY } from "../config/services.js";
import { rateLimiter } from "../utils/rateLimiter.js";

export async function getServiceHealth(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const namespace = validateNamespace(args.namespace);
    const checkEndpoint = args.checkEndpoint;

    // Rate limiting
    rateLimiter.check(`health:${serviceName}`);

    const k8sClient = new KubernetesClient();
    const httpClient = new HttpClient();

    // Get service info
    const service = await k8sClient.getService(serviceName, namespace);
    const deployment = await k8sClient.getDeployment(serviceName, namespace).catch(() => null);

    // Get pods
    const labelSelector = service.spec?.selector 
      ? Object.entries(service.spec.selector)
          .map(([k, v]) => `${k}=${v}`)
          .join(",")
      : undefined;
    
    const pods = labelSelector 
      ? await k8sClient.listPods(namespace, labelSelector)
      : [];

    const runningPods = pods.filter((p) => {
      const phase = p.status?.phase;
      const ready = p.status?.conditions?.some(
        (c: any) => c.type === "Ready" && c.status === "True"
      );
      return phase === "Running" && ready;
    });

    // Kubernetes health check
    const k8sStatus = runningPods.length > 0 ? "ok" : 
                     pods.length === 0 ? "down" : "degraded";

    // Get registry config
    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    const ports = service.spec?.ports || [];
    const mainPort = ports[0]?.port || 8080;
    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${mainPort}`;

    // HTTP health check
    let httpCheck: any = undefined;
    const healthEndpoint = checkEndpoint || registryConfig?.healthEndpoint || "/health";
    
    try {
      const validatedEndpoint = validateEndpoint(healthEndpoint);
      const healthUrl = `${baseUrl}${validatedEndpoint}`;
      const response = await httpClient.get(healthUrl, { timeout: 3000 });
      
      httpCheck = {
        endpoint: validatedEndpoint,
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        status: response.statusCode >= 200 && response.statusCode < 400 ? "ok" : "error",
      };
    } catch (error) {
      // HTTP check failed, but that's okay - service might not have HTTP endpoint
      httpCheck = {
        endpoint: healthEndpoint,
        statusCode: 0,
        responseTime: 0,
        status: "error",
      };
    }

    // Determine overall status
    let overallStatus: "healthy" | "unhealthy" | "unknown";
    if (k8sStatus === "ok" && (!httpCheck || httpCheck.status === "ok")) {
      overallStatus = "healthy";
    } else if (k8sStatus === "down") {
      overallStatus = "unhealthy";
    } else {
      overallStatus = "unhealthy";
    }

    const result = {
      serviceName,
      status: overallStatus,
      checks: {
        kubernetes: {
          podsRunning: runningPods.length,
          podsTotal: pods.length,
          status: k8sStatus,
        },
        http: httpCheck,
      },
      lastChecked: new Date().toISOString(),
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

