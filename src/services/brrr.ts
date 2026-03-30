import type { BrrrPayload, MappingConfig } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

export class BrrrApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "BrrrApiError";
  }
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

  async sendNotification(_mapping: MappingConfig, payload: BrrrPayload): Promise<void> {
    const url = this.buildUrl();
    
    const startTime = Date.now();
    
    logger.debug("Sending to Brrr", { url, payload });
    
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