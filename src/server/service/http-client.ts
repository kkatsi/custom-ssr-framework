// ============================================
// src/server/api/http-client.ts
// Universal HTTP Client for All External APIs
// ============================================

// ============================================
// MARK: Types
// ============================================

export interface HttpClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
  onRequest?: (url: string, options: RequestInit) => void | Promise<void>;
  onResponse?: (response: Response, duration: number) => void | Promise<void>;
  onError?: (error: Error, url: string) => void | Promise<void>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  cache?: boolean | number; // false, true, or TTL in seconds
  query?: Record<string, string | number | boolean>; // Query params
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId: string;
  duration: number;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public requestId: string,
    public response?: any,
    public url?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// ============================================
// MARK: Universal HTTP Client
// ============================================

export class HttpClient {
  private config: Required<Omit<HttpClientConfig, 'onRequest' | 'onResponse' | 'onError'>> & {
    onRequest?: HttpClientConfig['onRequest'];
    onResponse?: HttpClientConfig['onResponse'];
    onError?: HttpClientConfig['onError'];
  };
  private cache = new Map<string, { data: any; expiresAt: number }>();

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      defaultHeaders: config.defaultHeaders || {},
      onRequest: config.onRequest,
      onResponse: config.onResponse,
      onError: config.onError,
    };

    console.log('[HttpClient] Initialized');
  }

  // ============================================
  // MARK: Main Request Method
  // ============================================

  async request<T = any>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const method = options.method || 'GET';

    // Build full URL with query params
    const fullUrl = this.buildUrl(url, options.query);

    // Check cache for GET requests
    if (options.cache && method === 'GET') {
      const cached = this.getFromCache(fullUrl);
      if (cached) {
        console.log(`[${requestId}] Cache HIT: ${method} ${fullUrl}`);
        return {
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: {},
          requestId,
          duration: Date.now() - startTime,
        };
      }
    }

    console.log(`[${requestId}] ${method} ${fullUrl}`);

    // Build headers
    const headers = await this.buildHeaders(options);

    // Build request config
    const requestConfig: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(options.timeout || this.config.timeout),
    };

    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      requestConfig.body = JSON.stringify(options.body);
    }

    // Call onRequest hook
    if (this.config.onRequest) {
      await this.config.onRequest(fullUrl, requestConfig);
    }

    // Retry logic
    let lastError: Error | null = null;
    const maxRetries = options.retries ?? this.config.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(fullUrl, requestConfig);
        const duration = Date.now() - startTime;

        // Call onResponse hook
        if (this.config.onResponse) {
          await this.config.onResponse(response, duration);
        }

        // Handle non-OK responses
        if (!response.ok) {
          const errorBody = await response.text();
          let errorData: any;
          try {
            errorData = JSON.parse(errorBody);
          } catch {
            errorData = errorBody;
          }

          const error = new HttpError(
            errorData.message || errorData.error || `HTTP ${response.status}`,
            response.status,
            response.statusText,
            requestId,
            errorData,
            fullUrl
          );

          // Don't retry client errors (4xx), only server errors (5xx)
          if (response.status < 500) {
            throw error;
          }

          // Retry on 5xx
          throw error;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          const text = await response.text();
          data = text ? JSON.parse(text) : null;
        } else {
          data = (await response.text()) as any;
        }

        // Extract headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        console.log(`[${requestId}] ${response.status} (${duration}ms)`);

        // Cache successful GET requests
        if (options.cache && method === 'GET') {
          const ttl = typeof options.cache === 'number' ? options.cache : 120;
          this.setInCache(fullUrl, data, ttl);
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          requestId,
          duration,
        };
      } catch (error: any) {
        lastError = error;

        // Call onError hook
        if (this.config.onError) {
          await this.config.onError(error, fullUrl);
        }

        // Don't retry on client errors
        if (error instanceof HttpError && error.status < 500) {
          throw error;
        }

        // Log retry
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * (attempt + 1);
          console.log(`[${requestId}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        } else {
          console.error(`[${requestId}] Failed after ${maxRetries} retries:`, error.message);
        }
      }
    }

    // All retries failed
    throw new HttpError(
      lastError?.message || 'Request failed',
      500,
      'Internal Server Error',
      requestId,
      lastError,
      fullUrl
    );
  }

  // ============================================
  // MARK: Helper Methods
  // ============================================

  private buildUrl(url: string, query?: Record<string, any>): string {
    if (!query || Object.keys(query).length === 0) {
      return url;
    }

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  private async buildHeaders(options: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    // Add auth headers (unless explicitly skipped)
    if (!options.skipAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    return headers;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Override this in subclass or via config
    // Default: no auth
    return {};
  }

  // ============================================
  // MARK: Cache Methods
  // ============================================

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setInCache(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('[HttpClient] Cache cleared');
  }

  public invalidateCache(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[HttpClient] Invalidated ${count} cache entries`);
  }

  // ============================================
  // MARK: Convenience Methods
  // ============================================

  async get<T = any>(
    url: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'GET',
    });
    return response.data;
  }

  async post<T = any>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
    return response.data;
  }

  async put<T = any>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'PUT',
      body,
    });
    return response.data;
  }

  async patch<T = any>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body,
    });
    return response.data;
  }

  async delete<T = any>(
    url: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
    return response.data;
  }

  // ============================================
  // MARK: Utility
  // ============================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
