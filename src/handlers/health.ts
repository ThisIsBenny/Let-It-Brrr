import type { Context } from "@hono/hono";
import { getConfigLoader } from "../config/loader.ts";
import type { HealthResponse } from "../types/index.ts";

const VERSION = "0.1.0";

export async function handleHealth(c: Context): Promise<Response> {
  const configLoader = await getConfigLoader();
  const mappingsCount = configLoader.getMappingsCount();

  const response: HealthResponse = {
    status: "ok",
    mappings_count: mappingsCount,
    version: VERSION,
  };

  return c.json(response);
}