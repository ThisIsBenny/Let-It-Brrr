import type { Context } from "@hono/hono";
import { getConfigLoader } from "../config/loader.ts";
import { baseTransformer } from "../transformers/base.ts";
import { BrrrClient } from "../services/brrr.ts";
import { logger } from "../utils/logger.ts";
import { BrrrApiError } from "../errors/index.ts";

export async function handleWebhook(c: Context, mappingId: string) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  if (c.req.method !== "POST") {
    throw new BrrrApiError("Method not allowed", 405);
  }

  const contentType = c.req.header("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    throw new BrrrApiError("Content-Type must be application/json", 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new BrrrApiError("Invalid JSON payload", 400);
  }

  const configLoader = await getConfigLoader();
  const mapping = configLoader.getMapping(mappingId);

  if (!mapping) {
    throw new BrrrApiError("Mapping not found", 404);
  }

  const brrrClient = new BrrrClient();
  const transformation = baseTransformer.transform(body, mapping);

  await brrrClient.sendNotification(mapping, transformation.payload);

  const duration = Date.now() - startTime;
  logger.logRequest(requestId, mappingId, body, "success", duration);

  return c.json({ status: "forwarded", mapping_id: mappingId });
}
