/**
 * Kubernetes configuration
 */

export interface KubernetesConfig {
  namespace: string;
  inCluster: boolean;
  kubeconfigPath?: string;
}

/**
 * Get Kubernetes configuration from environment variables
 */
export function getKubernetesConfig(): KubernetesConfig {
  return {
    namespace: process.env.KUBERNETES_NAMESPACE || "default",
    inCluster: process.env.KUBERNETES_SERVICE_HOST !== undefined,
    kubeconfigPath: process.env.KUBECONFIG,
  };
}

