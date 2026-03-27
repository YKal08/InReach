// API base URL from environment variable (injected at build time via VITE_API_URL)
// Defaults to localhost:8080 if not set
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || response.statusText || "Request failed");
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  
  // Handle plain text responses
  const text = await response.text();
  return (text ? { message: text } : {}) as unknown as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) => 
    request<T>(endpoint, { method: "GET", headers }),
    
  post: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
    request<T>(endpoint, { method: "POST", body, headers }),
    
  put: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
    request<T>(endpoint, { method: "PUT", body, headers }),
    
  delete: <T>(endpoint: string, headers?: Record<string, string>) => 
    request<T>(endpoint, { method: "DELETE", headers }),
};
