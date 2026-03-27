const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

  return response.json() as Promise<T>;
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
