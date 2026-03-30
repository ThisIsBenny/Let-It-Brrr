import "jsr:@std/dotenv@^0.225.6";
import { Hono } from "@hono/hono";
import type { Context } from "@hono/hono";
import { handleWebhook } from "./handlers/webhook.ts";
import { handleHealth } from "./handlers/health.ts";
import { logger } from "./utils/logger.ts";
import { config, getVersion } from "./config/config.ts";
import { HTTPException } from "@hono/hono/http-exception";

const app = new Hono();

app.get("/health", handleHealth);

app.post("/webhook/:mappingId", (c: Context) => {
  const mappingId = c.req.param("mappingId") ?? "";
  return handleWebhook(c, mappingId);
});

app.notFound((c: Context) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  const correlationId = crypto.randomUUID();
  logger.error("Unexpected error", {
    correlationId,
    error: err.message,
  });

  return c.json(
    {
      message: "An internal error occurred",
      correlationId,
    },
    500,
  );
});

logger.info("Starting webhook middleware", {
  status: "starting",
  port: config.port,
  version: getVersion(),
});

Deno.serve({ port: config.port }, app.fetch);
