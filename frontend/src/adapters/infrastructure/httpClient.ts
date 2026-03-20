interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while calling API";
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: typeof body === "undefined" ? undefined : JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });

      const json = (await response.json()) as ApiEnvelope<T>;

      if (!response.ok || !json.success) {
        throw new Error(json.message ?? `Request failed with status ${response.status}`);
      }

      return json.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  }
}
