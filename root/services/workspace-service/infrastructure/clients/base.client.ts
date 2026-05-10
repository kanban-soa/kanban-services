import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { logger } from "@workspace-service/utils/logger";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    __retryCount?: number;
  }
}

/**
 * BaseClient
 * Abstract base class for inter-service HTTP clients.
 * Provides shared axios instance, retry logic, and typed request methods.
 */
export abstract class BaseClient {
  protected client: AxiosInstance;
  protected serviceName: string;

  constructor(baseURL: string, serviceName: string, timeout: number = 5000) {
    this.serviceName = serviceName;
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
        "x-service-name": "workspace-service",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request logging
    this.client.interceptors.request.use((config) => {
      logger.debug(
        `[Client→${this.serviceName}] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
      );
      return config;
    });

    // Response: retry on 5xx, log errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;

        if (!config) {
          return Promise.reject(error);
        }

        // Retry on 5xx or network errors (up to 2 attempts)
        if (!response || response.status >= 500) {
          config.__retryCount = config.__retryCount || 0;
          if (config.__retryCount < 2) {
            config.__retryCount += 1;
            logger.warn(
              `Retrying ${config.method?.toUpperCase()} ${config.url} (attempt ${config.__retryCount}) for ${this.serviceName}`
            );
            await new Promise((r) => setTimeout(r, 1000));
            return this.client(config);
          }
        }

        // Log final error
        const status = response?.status || "NETWORK_ERROR";
        const message = response?.data?.error || error.message;
        logger.error(
          `[Client→${this.serviceName}] ${config.method?.toUpperCase()} ${config.url} failed: ${status} - ${message}`
        );

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request — unwraps response.data.data
   */
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ success: boolean; data: T }>(url, config);
    return response.data.data;
  }

  /**
   * POST request — unwraps response.data.data
   */
  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<{ success: boolean; data: T }>(url, data, config);
    return response.data.data;
  }

  /**
   * PUT request — unwraps response.data.data
   */
  protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<{ success: boolean; data: T }>(url, data, config);
    return response.data.data;
  }

  /**
   * PATCH request — unwraps response.data.data
   */
  protected async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<{ success: boolean; data: T }>(url, data, config);
    return response.data.data;
  }

  /**
   * DELETE request — unwraps response.data.data
   */
  protected async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<{ success: boolean; data: T }>(url, config);
    return response.data.data;
  }
}
