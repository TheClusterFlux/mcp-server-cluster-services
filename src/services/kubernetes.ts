/**
 * Kubernetes API client for service discovery
 */

import * as k8s from "@kubernetes/client-node";
import { KubeConfig } from "@kubernetes/client-node";
import { KubernetesError } from "../utils/errors.js";

export class KubernetesClient {
  private k8sApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;

  constructor() {
    const kc = new KubeConfig();
    
    try {
      // Try to load from default locations (kubeconfig file, env vars)
      kc.loadFromDefault();
    } catch (error) {
      try {
        // Fallback to in-cluster config (when running in a pod)
        kc.loadFromCluster();
      } catch (clusterError) {
        throw new KubernetesError(
          "Failed to load Kubernetes configuration. Ensure kubeconfig is available or running in-cluster."
        );
      }
    }
    
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
  }

  /**
   * List all services in a namespace
   */
  async listServices(namespace: string = "default"): Promise<k8s.V1Service[]> {
    try {
      const response = await this.k8sApi.listNamespacedService(namespace);
      return response.body.items;
    } catch (error: any) {
      if (error.response) {
        throw new KubernetesError(
          `Failed to list services: ${error.response.body?.message || error.message}`,
          error.response.statusCode
        );
      }
      throw new KubernetesError(
        `Failed to list services: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a specific service
   */
  async getService(name: string, namespace: string = "default"): Promise<k8s.V1Service> {
    try {
      const response = await this.k8sApi.readNamespacedService(name, namespace);
      return response.body;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        throw new KubernetesError(`Service '${name}' not found in namespace '${namespace}'`, 404);
      }
      if (error.response) {
        throw new KubernetesError(
          `Failed to get service: ${error.response.body?.message || error.message}`,
          error.response.statusCode
        );
      }
      throw new KubernetesError(
        `Failed to get service: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all deployments in a namespace
   */
  async listDeployments(namespace: string = "default"): Promise<k8s.V1Deployment[]> {
    try {
      const response = await this.appsApi.listNamespacedDeployment(namespace);
      return response.body.items;
    } catch (error: any) {
      if (error.response) {
        throw new KubernetesError(
          `Failed to list deployments: ${error.response.body?.message || error.message}`,
          error.response.statusCode
        );
      }
      throw new KubernetesError(
        `Failed to list deployments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(name: string, namespace: string = "default"): Promise<k8s.V1Deployment> {
    try {
      const response = await this.appsApi.readNamespacedDeployment(name, namespace);
      return response.body;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        throw new KubernetesError(`Deployment '${name}' not found in namespace '${namespace}'`, 404);
      }
      if (error.response) {
        throw new KubernetesError(
          `Failed to get deployment: ${error.response.body?.message || error.message}`,
          error.response.statusCode
        );
      }
      throw new KubernetesError(
        `Failed to get deployment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List pods for a service/deployment
   */
  async listPods(
    namespace: string = "default",
    labelSelector?: string
  ): Promise<k8s.V1Pod[]> {
    try {
      const response = await this.k8sApi.listNamespacedPod(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        labelSelector
      );
      return response.body.items;
    } catch (error: any) {
      if (error.response) {
        throw new KubernetesError(
          `Failed to list pods: ${error.response.body?.message || error.message}`,
          error.response.statusCode
        );
      }
      throw new KubernetesError(
        `Failed to list pods: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

