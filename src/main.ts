import "jsr:@std/dotenv@^0.225.6";
import { Hono } from "@hono/hono";
import type { Context } from "@hono/hono";
import { handleWebhook } from "./handlers/webhook.ts";
import { handleHealth } from "./handlers/health.ts";
import { logger } from "./utils/logger.ts";

const app = new Hono();

app.get("/health", handleHealth);

app.post("/webhook/:mappingId", (c: Context) => {
  const mappingId = c.req.param("mappingId") ?? "";
  return handleWebhook(c, mappingId);
});

app.notFound((c: Context) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});

const port = parseInt(Deno.env.get("PORT") || "8080");

logger.info("Starting webhook middleware", { status: "starting", port: port });

Deno.serve(app.fetch);