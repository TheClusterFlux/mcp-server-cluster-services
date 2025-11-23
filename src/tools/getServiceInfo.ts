/**
 * Tool: get_service_info
 * Get detailed information about a specific service
 */

import { KubernetesClient } from "../services/kubernetes.js";
import { validateServiceName, validateNamespace } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";
import { SERVICE_REGISTRY } from "../config/services.js";

export async function getServiceInfo(args: any) {
  try {
    const serviceName = validateServiceName(args.serviceName);
    const namespace = validateNamespace(args.namespace);
    const includeEndpoints = args.includeEndpoints !== false; // Default true

    const k8sClient = new KubernetesClient();

    // Get service from Kubernetes
    const service = await k8sClient.getService(serviceName, namespace);
    const deployment = await k8sClient.getDeployment(serviceName, namespace).catch(() => null);

    // Get pods for this service
    const labelSelector = service.spec?.selector 
      ? Object.entries(service.spec.selector)
          .map(([k, v]) => `${k}=${v}`)
          .join(",")
      : undefined;
    
    const pods = labelSelector 
      ? await k8sClient.listPods(namespace, labelSelector)
      : [];

    // Get registry config if available
    const registryConfig = SERVICE_REGISTRY.find(
      (s) => s.name === serviceName && s.namespace === namespace
    );

    const ports = service.spec?.ports || [];
    const mainPort = ports[0]?.port || 8080;
    const baseUrl = registryConfig?.baseUrl || 
      `http://${serviceName}.${namespace}.svc.cluster.local:${mainPort}`;

    // Build endpoints list
    const endpoints = includeEndpoints && ports.length > 0
      ? ports.map((p) => ({
          url: `http://${serviceName}.${namespace}.svc.cluster.local:${p.port || mainPort}`,
          port: p.port || mainPort,
          protocol: p.protocol || "TCP",
          path: registryConfig?.healthEndpoint || "/",
        }))
      : [];

    // Get deployment status
    const readyReplicas = deployment?.status?.readyReplicas || 0;
    const replicas = deployment?.spec?.replicas || 0;
    const availableReplicas = deployment?.status?.availableReplicas || 0;

    const conditions = deployment?.status?.conditions || [];
    const conditionList = conditions.map((c: any) => ({
      type: c.type,
      status: c.status,
      message: c.message || "",
    }));

    const result = {
      name: serviceName,
      namespace,
      type: "Service",
      status: {
        ready: readyReplicas > 0 && readyReplicas === replicas,
        replicas,
        availableReplicas,
        conditions: conditionList,
      },
      endpoints: includeEndpoints ? endpoints : undefined,
      labels: service.metadata?.labels || {},
      annotations: service.metadata?.annotations || {},
      createdAt: service.metadata?.creationTimestamp || "",
      image: deployment?.spec?.template?.spec?.containers?.[0]?.image,
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

