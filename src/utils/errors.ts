/**
 * Custom error classes for the MCP server
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class KubernetesError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = "KubernetesError";
  }
}

export class ServiceNotFoundError extends Error {
  constructor(serviceName: string, namespace?: string) {
    const ns = namespace ? ` in namespace '${namespace}'` : "";
    super(`Service '${serviceName}' not found${ns}`);
    this.name = "ServiceNotFoundError";
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Sanitize error messages to avoid exposing sensitive information
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose stack traces or internal details
    const message = error.message;
    
    // Filter out potentially sensitive patterns
    if (message.includes("kubeconfig") || message.includes("secret")) {
      return "Configuration error: Unable to access cluster resources";
    }
    
    return message;
  }
  
  return "An unknown error occurred";
}

