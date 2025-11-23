/**
 * HTTP client for making API calls to cluster services
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { HttpError } from "../utils/errors.js";

export class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Make a GET request
   */
  async get(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{ statusCode: number; headers: Record<string, string>; body: any; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response: AxiosResponse = await this.client.get(url, {
        ...config,
        timeout: config?.timeout || 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        statusCode: response.status,
        headers: this.sanitizeHeaders(response.headers),
        body: response.data,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.response) {
        // Server responded with error status
        return {
          statusCode: error.response.status,
          headers: this.sanitizeHeaders(error.response.headers),
          body: error.response.data,
          responseTime,
        };
      }
      
      if (error.code === "ECONNREFUSED") {
        throw new HttpError("Connection refused - service may be down", 0);
      }
      
      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        throw new HttpError("Request timeout", 0);
      }
      
      throw new HttpError(
        `HTTP request failed: ${error.message}`,
        0
      );
    }
  }

  /**
   * Make a HEAD request
   */
  async head(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{ statusCode: number; headers: Record<string, string>; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response: AxiosResponse = await this.client.head(url, {
        ...config,
        timeout: config?.timeout || 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        statusCode: response.status,
        headers: this.sanitizeHeaders(response.headers),
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.response) {
        return {
          statusCode: error.response.status,
          headers: this.sanitizeHeaders(error.response.headers),
          responseTime,
        };
      }
      
      if (error.code === "ECONNREFUSED") {
        throw new HttpError("Connection refused - service may be down", 0);
      }
      
      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        throw new HttpError("Request timeout", 0);
      }
      
      throw new HttpError(
        `HTTP request failed: ${error.message}`,
        0
      );
    }
  }

  /**
   * Make an OPTIONS request
   */
  async options(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{ statusCode: number; headers: Record<string, string>; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response: AxiosResponse = await this.client.options(url, {
        ...config,
        timeout: config?.timeout || 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        statusCode: response.status,
        headers: this.sanitizeHeaders(response.headers),
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.response) {
        return {
          statusCode: error.response.status,
          headers: this.sanitizeHeaders(error.response.headers),
          responseTime,
        };
      }
      
      if (error.code === "ECONNREFUSED") {
        throw new HttpError("Connection refused - service may be down", 0);
      }
      
      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        throw new HttpError("Request timeout", 0);
      }
      
      throw new HttpError(
        `HTTP request failed: ${error.message}`,
        0
      );
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveKeys = ["authorization", "cookie", "set-cookie", "x-api-key"];
    
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = Array.isArray(value) ? value.join(", ") : String(value);
      } else {
        sanitized[key] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }
}

