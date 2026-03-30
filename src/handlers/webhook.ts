import type { Context } from "@hono/hono";
import { getConfigLoader } from "../config/loader.ts";
import { fluxCDTransformer } from "../transformers/fluxcd.ts";
import { BrrrClient, BrrrApiError } from "../services/brrr.ts";
import { logger } from "../utils/logger.ts";
import type { ErrorResponse } from "../types/index.ts";

export async function handleWebhook(c: Context, mappingId: string) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  if (c.req.method !== "POST") {
    return c.json({ error: "Method not allowed", allowed_methods: ["POST"] } as ErrorResponse, 405);
  }

  const contentType = c.req.header("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return c.json({ error: "Content-Type must be application/json" } as ErrorResponse, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload", detail: "Malformed JSON body" } as ErrorResponse, 400);
  }

  const configLoader = await getConfigLoader();
  const mapping = configLoader.getMapping(mappingId);

  if (!mapping) {
    return c.json({ error: "Mapping not found", mapping_id: mappingId } as ErrorResponse, 404);
  }

  const brrrClient = new BrrrClient();
  const transformation = fluxCDTransformer.transform(body, mapping);
  
  try {
    await brrrClient.sendNotification(mapping, transformation.payload);
    
    const duration = Date.now() - startTime;
    logger.logRequest(requestId, mappingId, body, "success", duration);
    
    return c.json({ status: "forwarded", mapping_id: mappingId });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof BrrrApiError) {
      logger.logRequest(requestId, mappingId, body, "error", duration, error.message);
      return c.json({ error: "Brrr API error", detail: error.message } as ErrorResponse, 502);
    }
    
    logger.logRequest(requestId, mappingId, body, "error", duration, String(error));
    return c.json({ error: "Internal server error" } as ErrorResponse, 500);
  }
}