const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

class ApiClientService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token") || localStorage.getItem("hbtm_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("hbtm_token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("token") || localStorage.getItem("hbtm_token");
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("hbtm_token");
    }
  }

  private getHeaders(customHeaders: HeadersInit = {}): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((customHeaders as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private formatUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${cleanEndpoint}`;
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(this.formatUrl(endpoint), {
      method: "GET",
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await fetch(this.formatUrl(endpoint), {
      method: "POST",
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await fetch(this.formatUrl(endpoint), {
      method: "PUT",
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(this.formatUrl(endpoint), {
      method: "DELETE",
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }
}

export const ApiClient = new ApiClientService();
