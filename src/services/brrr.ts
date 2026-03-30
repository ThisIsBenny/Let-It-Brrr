import type { BrrrPayload, MappingConfig } from "../types/index.ts";
import { logger } from "../utils/logger.ts";
import { config } from "../config/config.ts";
import { BrrrApiError, SSRFError } from "../errors/index.ts";
import { validateBrrrPayload } from "../validators/brrr.ts";

function isPrivateUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (config.blockedHostnames.includes(hostname)) {
    return true;
  }
  for (const pattern of config.privateIpPatterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  if (config.blockedIpv6Hostnames.includes(hostname)) {
    return true;
  }
  return false;
}

export class BrrrClient {
  private secret: string;
  private baseUrl: string;

  constructor(secret?: string, baseUrl?: string) {
    this.secret = secret || config.brrrSecret;
    this.baseUrl = baseUrl || config.brrrWebhookUrl;
    if (!this.secret) {
      throw new BrrrApiError("BRRR_SECRET environment variable is required");
    }
  }

  private buildUrl(): string {
    return `${this.baseUrl}${this.secret}`;
  }

  private validateUrl(url: URL): void {
    if (url.protocol !== "https:") {
      throw new SSRFError("SSRF protection: Only HTTPS URLs are allowed");
    }
    if (isPrivateUrl(url)) {
      throw new SSRFError("SSRF protection: Private/internal URLs are not allowed");
    }
  }

  async sendNotification(_mapping: MappingConfig, payload: BrrrPayload): Promise<void> {
    const validationResult = validateBrrrPayload(payload as Record<string, unknown>);

    for (const warning of validationResult.warnings) {
      logger.warn(warning);
    }

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

    logger.debug("Sending to Brrr", { payload: validationResult.sanitizedPayload });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.sanitizedPayload),
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
