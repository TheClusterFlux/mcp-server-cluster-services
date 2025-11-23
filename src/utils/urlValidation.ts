/**
 * URL validation utilities to prevent SSRF attacks
 */

import { ValidationError } from "./errors.js";

/**
 * Allowed URL patterns for security
 */
const ALLOWED_HOST_PATTERNS = [
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?\.default\.svc\.cluster\.local$/,
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?\.kube-system\.svc\.cluster\.local$/,
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?\.monitoring\.svc\.cluster\.local$/,
];

const ALLOWED_PORTS = [80, 443, 8080, 3000, 3001, 9090];

/**
 * Validate URL to prevent SSRF attacks
 * Only allows cluster-internal services
 */
export function validateUrl(url: string, baseUrl?: string): URL {
  let parsedUrl: URL;
  
  try {
    if (baseUrl) {
      parsedUrl = new URL(url, baseUrl);
    } else {
      parsedUrl = new URL(url);
    }
  } catch (error) {
    throw new ValidationError(`Invalid URL: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Only allow HTTP/HTTPS protocols
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ValidationError("Only HTTP and HTTPS protocols are allowed");
  }

  // Validate hostname - must be cluster-internal
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowed = ALLOWED_HOST_PATTERNS.some(pattern => pattern.test(hostname));
  
  if (!isAllowed) {
    throw new ValidationError(
      "Only cluster-internal services are allowed (must match *.svc.cluster.local pattern)"
    );
  }

  // Validate port if specified
  if (parsedUrl.port) {
    const port = parseInt(parsedUrl.port, 10);
    if (!ALLOWED_PORTS.includes(port)) {
      throw new ValidationError(
        `Port ${port} is not allowed. Allowed ports: ${ALLOWED_PORTS.join(", ")}`
      );
    }
  }

  return parsedUrl;
}

/**
 * Check if hostname is cluster-internal
 */
export function isClusterInternal(hostname: string): boolean {
  return ALLOWED_HOST_PATTERNS.some(pattern => pattern.test(hostname.toLowerCase()));
}

