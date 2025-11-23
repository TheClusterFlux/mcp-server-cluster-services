/**
 * Tool: list_services
 * List all services deployed in the Kubernetes cluster
 */

import { KubernetesClient } from "../services/kubernetes.js";
import { validateNamespace } from "../utils/validation.js";
import { sanitizeError } from "../utils/errors.js";

export async function listServices(args: any) {
  try {
    const namespace = validateNamespace(args.namespace);
    const serviceType = args.serviceType;

    const k8sClient = new KubernetesClient();
    
    const services = await k8sClient.listServices(namespace);
    const deployments = await k8sClient.listDeployments(namespace);

    const serviceList = services.map((svc) => {
      const svcName = svc.metadata?.name || "unknown";
      const svcNamespace = svc.metadata?.namespace || namespace;
      const ports = svc.spec?.ports || [];
      const mainPort = ports[0]?.port || 8080;

      return {
        name: svcName,
        namespace: svcNamespace,
        type: "Service",
        status: "running", // Simplified - could check pod status
        endpoints: [
          `http://${svcName}.${svcNamespace}.svc.cluster.local:${mainPort}`,
        ],
        ports: ports.map((p) => ({
          port: p.port || 0,
          protocol: p.protocol || "TCP",
        })),
        labels: svc.metadata?.labels || {},
      };
    });

    // Also include deployments that might not have services
    const deploymentList = deployments.map((deploy) => {
      const deployName = deploy.metadata?.name || "unknown";
      const deployNamespace = deploy.metadata?.namespace || namespace;
      
      return {
        name: deployName,
        namespace: deployNamespace,
        type: "Deployment",
        status: deploy.status?.readyReplicas === deploy.status?.replicas 
          ? "running" 
          : deploy.status?.replicas === 0 
          ? "stopped" 
          : "pending",
        endpoints: [], // Deployments don't have direct endpoints
        ports: [],
        labels: deploy.metadata?.labels || {},
      };
    });

    // Filter by type if specified
    let allItems = [...serviceList, ...deploymentList];
    if (serviceType) {
      allItems = allItems.filter((item) => item.type === serviceType);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ services: allItems }, null, 2),
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

