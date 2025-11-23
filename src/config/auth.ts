/**
 * Authentication configuration
 */

/**
 * Check if dev mode is enabled (allows bypassing auth)
 */
function isDevModeEnabled(): boolean {
  return process.env.DEV_MODE === "true" || process.env.DISABLE_AUTH === "true";
}

/**
 * Validate API key
 * Fail-safe by default: requires valid API key unless dev mode is explicitly enabled
 */
export function validateApiKey(apiKey: string | undefined): boolean {
  // Get valid API keys from environment variable (comma-separated)
  const validApiKeys = process.env.API_KEYS?.split(",").map(k => k.trim()).filter(k => k.length > 0) || [];
  
  // If dev mode is enabled, allow all requests (with warning)
  if (isDevModeEnabled()) {
    if (validApiKeys.length === 0) {
      console.warn("WARNING: DEV_MODE enabled and no API_KEYS configured. Allowing all requests.");
    }
    // In dev mode, still validate if key is provided, but don't require it
    if (!apiKey) {
      return true; // Allow requests without key in dev mode
    }
    // If key is provided, validate it
    return validApiKeys.length === 0 || validApiKeys.includes(apiKey);
  }
  
  // Production/default: fail-safe - require API key
  if (!apiKey) {
    return false;
  }
  
  if (validApiKeys.length === 0) {
    console.error("ERROR: No API_KEYS configured. Rejecting all requests (fail-safe).");
    return false;
  }

  return validApiKeys.includes(apiKey);
}

