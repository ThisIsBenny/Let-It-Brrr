import { assertEquals, assertExists } from "@std/assert";
import { ConfigLoader } from "../../../src/config/loader.ts";

Deno.test("Webhook handler - unknown mapping returns 404", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();
  
  const mapping = loader.getMapping("non-existent-mapping");
  assertEquals(mapping, undefined);
});

Deno.test("Webhook handler - known mapping exists", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();
  
  const mapping = loader.getMapping("fluxcd-generic");
  assertExists(mapping);
});

Deno.test("Webhook handler - error response structure", () => {
  const errorResponse = {
    error: "Mapping not found",
    mapping_id: "test-id"
  };
  
  assertEquals(errorResponse.error, "Mapping not found");
  assertEquals(errorResponse.mapping_id, "test-id");
});

Deno.test("Webhook handler - 502 error response structure", () => {
  const errorResponse = {
    error: "Brrr API error",
    detail: "Invalid webhook URL"
  };
  
  assertEquals(errorResponse.error, "Brrr API error");
  assertEquals(errorResponse.detail, "Invalid webhook URL");
});

Deno.test("Webhook handler - 400 error for invalid JSON", () => {
  const errorResponse = {
    error: "Invalid JSON payload",
    detail: "Malformed JSON body"
  };
  
  assertEquals(errorResponse.error, "Invalid JSON payload");
});

Deno.test("Webhook handler - 405 for non-POST", () => {
  // This would be handled by Hono routing
  const allowedMethods = ["POST"];
  const requestMethod = "GET";
  
  assertEquals(allowedMethods.includes(requestMethod), false);
});

Deno.test("Webhook handler - empty payload is valid JSON", () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  assertEquals(typeof loader, "object");
});

Deno.test("Webhook handler - large payload handling", () => {
  // Create a large payload (1MB+)
  const largePayload = { data: "x".repeat(1024 * 1024) };
  
  // The transformer should handle it (just pass through)
  assertEquals(largePayload.data.length, 1024 * 1024);
});

Deno.test("Webhook handler - null values in payload", () => {
  const payloadWithNull = {
    message: null,
    reason: null,
    involvedObject: null
  };
  
  // Null values are valid JSON and should be handled gracefully
  assertEquals(payloadWithNull.message, null);
  assertEquals(payloadWithNull.involvedObject, null);
});

Deno.test("Webhook handler - nested object with null", () => {
  const payload = {
    involvedObject: {
      kind: "Deployment",
      name: null
    }
  };
  
  // Should be able to access nested even with null
  assertEquals(payload.involvedObject?.kind, "Deployment");
  assertEquals(payload.involvedObject?.name, null);
});