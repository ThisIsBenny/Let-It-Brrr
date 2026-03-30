import type { Context } from "@hono/hono";
import { getConfigLoader } from "../config/loader.ts";
import { getVersion } from "../config/config.ts";
import type { HealthResponse } from "../types/index.ts";

export async function handleHealth(c: Context): Promise<Response> {
  const configLoader = await getConfigLoader();
  const mappingsCount = configLoader.getMappingsCount();

  const response: HealthResponse = {
    status: "ok",
    mappings_count: mappingsCount,
    version: getVersion(),
  };

  return c.json(response);
}
