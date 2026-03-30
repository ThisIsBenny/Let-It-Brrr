import type { BrrrPayload, MappingConfig } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

export class BrrrApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "BrrrApiError";
  }
}

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^224\./,
  /^240\./,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
];

function isPrivateUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return true;
  }
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  if (hostname === "::1" || hostname === "[::1]" || hostname === "fc00::" || hostname === "[fc00::]" || hostname === "fd00::" || hostname === "[fd00::]") {
    return true;
  }
  return false;
}

export class BrrrClient {
  private secret: string;
  private baseUrl: string;

  constructor(secret?: string, baseUrl?: string) {
    this.secret = secret || Deno.env.get("BRRR_SECRET") || "";
    this.baseUrl = baseUrl || Deno.env.get("BRRR_WEBHOOK_URL") || "https://api.brrr.now/v1/";
    if (!this.secret) {
      throw new Error("BRRR_SECRET environment variable is required");
    }
  }

  private buildUrl(): string {
    return `${this.baseUrl}${this.secret}`;
  }

  private validateUrl(url: URL): void {
    if (url.protocol !== "https:") {
      throw new BrrrApiError("SSRF protection: Only HTTPS URLs are allowed");
    }
    if (isPrivateUrl(url)) {
      throw new BrrrApiError("SSRF protection: Private/internal URLs are not allowed");
    }
  }

  async sendNotification(_mapping: MappingConfig, payload: BrrrPayload): Promise<void> {
    const url = this.buildUrl();

    try {
      const parsedUrl = new URL(url);
      this.validateUrl(parsedUrl);
    } catch (e) {
      if (e instanceof BrrrApiError) {
        throw e;
      }
      throw new BrrrApiError(`Invalid URL: ${url}`);
    }

    const startTime = Date.now();

    logger.debug("Sending to Brrr", { payload });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Brrr API error", {
          status: response.status.toString(),
          duration_ms: duration,
          error: errorText,
        });
        throw new BrrrApiError(`Brrr API error: ${response.status}`, response.status);
      }

      logger.info("Notification sent successfully", {
        status: "success",
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof BrrrApiError) {
        throw error;
      }
      logger.error("Failed to send notification", {
        status: "error",
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BrrrApiError(`Failed to send notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}