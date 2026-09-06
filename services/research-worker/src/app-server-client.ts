import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

type JsonObject = Record<string, unknown>;
type RequestId = string | number;

type RpcResponse = {
  id: RequestId;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
};

export type AppServerMessage = {
  method: string;
  id?: RequestId;
  params?: JsonObject;
};

export type AppServerClientOptions = {
  command?: string;
  arguments?: string[];
  cwd: string;
  environment?: NodeJS.ProcessEnv;
  onNotification?: (message: AppServerMessage) => void | Promise<void>;
  onServerRequest?: (message: AppServerMessage & { id: RequestId }) => unknown | Promise<unknown>;
};

export class CodexAppServerError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CodexAppServerError";
    this.code = code;
  }
}

export class CodexAppServerClient {
  private nextId = 1;
  private readonly pending = new Map<
    RequestId,
    { resolve(value: unknown): void; reject(error: Error): void }
  >();
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly exited: Promise<void>;
  private messageQueue = Promise.resolve();
  private stderr = "";
  private closed = false;

  constructor(private readonly options: AppServerClientOptions) {
    this.process = spawn(options.command ?? "codex", options.arguments ?? ["app-server", "--stdio"], {
      cwd: options.cwd,
      env: options.environment ?? process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const lines = createInterface({ input: this.process.stdout });
    lines.on("line", (line) => {
      this.messageQueue = this.messageQueue.then(() => this.handleLine(line)).catch((error) => {
        this.rejectAll(this.asError(error));
      });
    });
    this.process.stderr.on("data", (chunk: Buffer) => {
      this.stderr = `${this.stderr}${chunk.toString("utf8")}`.slice(-4_096);
    });
    this.process.on("error", (error) => this.rejectAll(new CodexAppServerError("codex_unavailable", error.message)));
    this.exited = new Promise((resolve) => {
      this.process.once("close", (exitCode, signal) => {
        this.closed = true;
        if (this.pending.size > 0) {
          const detail = this.stderr.trim();
          const suffix = detail ? `: ${detail}` : "";
          this.rejectAll(
            new CodexAppServerError(
              "codex_unavailable",
              `Codex app-server exited (${signal ?? exitCode ?? "unknown"})${suffix}`,
            ),
          );
        }
        resolve();
      });
    });
  }

  async initialize(): Promise<void> {
    await this.request("initialize", {
      clientInfo: {
        name: "zeal_rsrch",
        title: "Zeal Research Worker",
        version: "0.1.0",
      },
    });
    this.notify("initialized", {});
  }

  request<T>(method: string, params: JsonObject): Promise<T> {
    if (this.closed) {
      return Promise.reject(new CodexAppServerError("codex_unavailable", "Codex app-server is closed"));
    }
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (value) => resolve(value as T), reject });
      try {
        this.write({ method, id, params });
      } catch (error) {
        this.pending.delete(id);
        reject(this.asError(error));
      }
    });
  }

  notify(method: string, params: JsonObject): void {
    this.write({ method, params });
  }

  async close(): Promise<void> {
    if (!this.closed) this.process.kill("SIGTERM");
    await this.exited;
  }

  async waitForUnexpectedExit(): Promise<never> {
    await this.exited;
    await this.messageQueue;
    throw new CodexAppServerError("codex_unavailable", "Codex app-server exited before the turn completed");
  }

  private async handleLine(line: string): Promise<void> {
    if (!line.trim()) return;
    let message: RpcResponse | AppServerMessage;
    try {
      message = JSON.parse(line) as RpcResponse | AppServerMessage;
    } catch {
      throw new CodexAppServerError("codex_protocol_mismatch", "Codex app-server emitted invalid JSON");
    }

    if ("id" in message && message.id !== undefined && !("method" in message)) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(
          new CodexAppServerError(
            "codex_protocol_mismatch",
            message.error.message ?? "Codex app-server request failed",
          ),
        );
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (!("method" in message) || typeof message.method !== "string") return;
    if (message.id !== undefined) {
      if (!this.options.onServerRequest) {
        this.write({ id: message.id, error: { code: -32601, message: "Unsupported server request" } });
        return;
      }
      void Promise.resolve(this.options.onServerRequest(message as AppServerMessage & { id: RequestId }))
        .then((result) => this.write({ id: message.id!, result }))
        .catch((error) => {
          this.write({
            id: message.id!,
            error: { code: -32000, message: this.asError(error).message },
          });
        });
      return;
    }
    await this.options.onNotification?.(message);
  }

  private write(message: JsonObject): void {
    if (this.closed || !this.process.stdin.writable) {
      throw new CodexAppServerError("codex_unavailable", "Codex app-server input is not writable");
    }
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  private asError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
