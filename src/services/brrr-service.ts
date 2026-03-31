import type { BrrrPayload } from "../types/index.ts";
import type { IBrrrApiClient } from "./brrr-api-client.ts";
import { BrrrApiClient } from "./brrr-api-client.ts";
import { BrrrApiError, SSRFError } from "../errors/index.ts";
import { validateBrrrPayload } from "../validators/brrr.ts";
import { logger } from "../utils/logger.ts";
import { config } from "../config/config.ts";

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

export class BrrrService {
  private static instance: BrrrService | null = null;

  private constructor(
    private apiClient: IBrrrApiClient,
  ) {}

  static reset(): void {
    BrrrService.instance = null;
  }

  static get(
    url: string,
    secret?: string,
    apiClient?: IBrrrApiClient,
  ): BrrrService {
    if (BrrrService.instance) {
      return BrrrService.instance;
    }

    BrrrService.validateUrl(url);

    let client: IBrrrApiClient;
    if (apiClient) {
      client = apiClient;
    } else {
      if (!secret) {
        throw new BrrrApiError("BRRR_SECRET environment variable is required");
      }
      client = new BrrrApiClient(secret, url);
    }

    const service = new BrrrService(client);
    BrrrService.instance = service;
    return service;
  }

  private static validateUrl(urlString: string): void {
    try {
      const parsedUrl = new URL(urlString);
      if (parsedUrl.protocol !== "https:") {
        throw new SSRFError("SSRF protection: Only HTTPS URLs are allowed");
      }
      if (isPrivateUrl(parsedUrl)) {
        throw new SSRFError(
          "SSRF protection: Private/internal URLs are not allowed",
        );
      }
    } catch (e) {
      if (e instanceof SSRFError) {
        throw e;
      }
      if (e instanceof TypeError) {
        throw new BrrrApiError(`Invalid URL: ${urlString}`);
      }
      throw e;
    }
  }

  async sendNotification(
    payload: BrrrPayload,
  ): Promise<void> {
    const validationResult = validateBrrrPayload(
      payload as Record<string, unknown>,
    );

    for (const warning of validationResult.warnings) {
      logger.warn(warning);
    }

    const startTime = Date.now();
    logger.debug("Sending to Brrr", {
      payload: validationResult.sanitizedPayload,
    });

    try {
      await this.apiClient.post(
        validationResult.sanitizedPayload as BrrrPayload,
      );

      const duration = Date.now() - startTime;
      logger.info("Notification sent successfully", {
        status: "success",
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Failed to send notification", {
        status: "error",
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BrrrApiError(
        `Failed to send notification: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
