export interface ConnectorHealth {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  message: string;
}

export interface ConnectorRequest {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
}

export class BaseConnector {
  protected queue: ConnectorRequest[] = [];
  protected cache = new Map<string, unknown>();

  constructor(
    public readonly name: string,
    protected readonly baseUrl: string,
    protected readonly token = ""
  ) {}

  async request<T>(request: ConnectorRequest): Promise<T> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), request.timeoutMs ?? 8000);
    try {
      const response = await fetch(`${this.baseUrl}${request.path}`, {
        method: request.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`${this.name} returned ${response.status}`);
      }
      const data = (await response.json()) as T;
      this.cache.set(request.path, data);
      return data;
    } catch (error) {
      const cached = this.cache.get(request.path);
      if (cached !== undefined) {
        return cached as T;
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  enqueue(request: ConnectorRequest): void {
    this.queue.push(request);
  }

  async health(): Promise<ConnectorHealth> {
    const started = performance.now();
    try {
      await this.request({ path: "/health", timeoutMs: 4000 });
      return { status: "healthy", latencyMs: performance.now() - started, message: `${this.name} reachable.` };
    } catch {
      return { status: "degraded", latencyMs: performance.now() - started, message: `${this.name} unreachable. Using cached data.` };
    }
  }
}
