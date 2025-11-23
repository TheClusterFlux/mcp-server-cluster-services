/**
 * Input validation utilities
 */

import { ValidationError } from "./errors.js";

/**
 * Validate service name
 */
export function validateServiceName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new ValidationError("Service name must be a non-empty string");
  }
  
  // Kubernetes name validation: lowercase alphanumeric and hyphens
  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
    throw new ValidationError(
      "Service name must be a valid Kubernetes name (lowercase alphanumeric and hyphens)"
    );
  }
  
  return name.trim();
}

/**
 * Validate namespace
 */
export function validateNamespace(namespace: unknown): string {
  if (namespace === undefined || namespace === null) {
    return "default";
  }
  
  if (typeof namespace !== "string") {
    throw new ValidationError("Namespace must be a string");
  }
  
  const ns = namespace.trim();
  if (ns.length === 0) {
    return "default";
  }
  
  // Kubernetes namespace validation
  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(ns)) {
    throw new ValidationError(
      "Namespace must be a valid Kubernetes name (lowercase alphanumeric and hyphens)"
    );
  }
  
  return ns;
}

/**
 * Validate HTTP method (only safe methods allowed)
 */
export function validateHttpMethod(method: unknown): "GET" | "HEAD" | "OPTIONS" {
  if (typeof method !== "string") {
    throw new ValidationError("HTTP method must be a string");
  }
  
  const upperMethod = method.toUpperCase();
  if (upperMethod !== "GET" && upperMethod !== "HEAD" && upperMethod !== "OPTIONS") {
    throw new ValidationError(
      "Only safe HTTP methods are allowed: GET, HEAD, OPTIONS"
    );
  }
  
  return upperMethod as "GET" | "HEAD" | "OPTIONS";
}

/**
 * Validate endpoint path
 */
export function validateEndpoint(endpoint: unknown): string {
  if (typeof endpoint !== "string" || endpoint.trim().length === 0) {
    throw new ValidationError("Endpoint must be a non-empty string");
  }
  
  const path = endpoint.trim();
  
  // Must start with /
  if (!path.startsWith("/")) {
    throw new ValidationError("Endpoint must start with '/'");
  }
  
  // Basic path validation
  if (!/^\/[a-zA-Z0-9\/\-_\.]*$/.test(path)) {
    throw new ValidationError("Endpoint contains invalid characters");
  }
  
  return path;
}

/**
 * Validate timeout value
 */
export function validateTimeout(timeout: unknown): number {
  if (timeout === undefined || timeout === null) {
    return 5000; // Default 5 seconds
  }
  
  if (typeof timeout !== "number") {
    throw new ValidationError("Timeout must be a number");
  }
  
  if (timeout < 100 || timeout > 30000) {
    throw new ValidationError("Timeout must be between 100 and 30000 milliseconds");
  }
  
  return timeout;
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: unknown): Record<string, string> {
  if (params === undefined || params === null) {
    return {};
  }
  
  if (typeof params !== "object" || Array.isArray(params)) {
    throw new ValidationError("Query parameters must be an object");
  }
  
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof key !== "string") {
      throw new ValidationError("Query parameter keys must be strings");
    }
    result[key] = String(value);
  }
  
  return result;
}

/**
 * Validate headers
 */
export function validateHeaders(headers: unknown): Record<string, string> {
  if (headers === undefined || headers === null) {
    return {};
  }
  
  if (typeof headers !== "object" || Array.isArray(headers)) {
    throw new ValidationError("Headers must be an object");
  }
  
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== "string") {
      throw new ValidationError("Header keys must be strings");
    }
    result[key] = String(value);
  }
  
  return result;
}

