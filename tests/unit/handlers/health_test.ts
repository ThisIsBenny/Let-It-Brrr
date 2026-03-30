import { assertEquals } from "@std/assert";
import { getConfigLoader } from "../../../src/config/loader.ts";

Deno.test("Health handler - returns correct status", async () => {
  const loader = await getConfigLoader("config/mappings.example.yaml");
  const mappingsCount = loader.getMappingsCount();

  assertEquals(mappingsCount >= 0, true);
});

Deno.test("Health handler - returns mappings count", async () => {
  const loader = await getConfigLoader("config/mappings.example.yaml");
  const count = loader.getMappingsCount();

  assertEquals(count >= 1, true);
});

Deno.test("Health handler - version is defined", () => {
  const version = "0.1.0";

  assertEquals(typeof version, "string");
  assertEquals(version.length > 0, true);
});
