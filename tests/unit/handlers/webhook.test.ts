import { assertEquals, assertExists } from "@std/assert";
import type { Context } from "@hono/hono";
import { BrrrService } from "../../../src/services/brrr-service.ts";
import { MockBrrrApiClient } from "../../mocks/mock-brrr-api-client.ts";
import { handleWebhook } from "../../../src/handlers/webhook.ts";
import type { BrrrPayload } from "../../../src/types/index.ts";

let mockClient: MockBrrrApiClient;

Deno.test.beforeAll(() => {
  mockClient = MockBrrrApiClient.success();
  BrrrService.get(
    "https://api.brrr.now/v1/",
    "test-secret",
    mockClient,
  );
});

Deno.test.beforeEach(() => {
  mockClient.reset();
});

function createMockContext(body: unknown, method = "POST"): Context {
  return {
    req: {
      method,
      header: (name: string) =>
        name === "Content-Type" ? "application/json" : null,
      // deno-lint-ignore require-await
      json: async () => body,
    },
    json: (data: unknown) => new Response(JSON.stringify(data)),
  } as unknown as Context;
}

Deno.test("handleWebhook - sends transformed payload to Brrr API", async () => {
  const fluxcdPayload = {
    type: "Alert",
    metadata: { name: "flux-system" },
    level: "error",
    reason: "TestReason",
    message: "TestMessage",
    involvedObject: {
      kind: "Deployment",
      name: "my-deployment",
    },
  };

  const mockContext = createMockContext(fluxcdPayload);
  await handleWebhook(mockContext, "fluxcd-generic");

  const sentPayload = mockClient.getLastPayload();
  assertExists(sentPayload, "Payload should have been sent");
  const payload = sentPayload as BrrrPayload;

  assertEquals(payload.title, "FluxCD - Deployment");
  assertEquals(payload.message, "TestMessage");
  assertEquals(payload.subtitle, "my-deployment");
});

Deno.test(
  "handleWebhook - transformation applies default values",
  async () => {
    const fluxcdPayload = {
      type: "Alert",
      metadata: { name: "my-app" },
      level: "warning",
      message: "Deployment completed",
    };

    const mockContext = createMockContext(fluxcdPayload);
    await handleWebhook(mockContext, "fluxcd-generic");

    const sentPayload = mockClient.getLastPayload();
    assertExists(sentPayload);
    const payload = sentPayload as BrrrPayload;
    assertEquals(payload.title, "FluxCD - ");
    assertEquals(payload.message, "Deployment completed");
  },
);

Deno.test("handleWebhook - rejects non-POST methods", async () => {
  const mockContext = createMockContext({}, "GET");

  try {
    await handleWebhook(mockContext, "fluxcd-generic");
    assertEquals(true, false, "Should have thrown for non-POST");
  } catch (error) {
    assertEquals(
      (error as Error).message,
      "Method not allowed",
      "Should reject non-POST methods",
    );
  }

  assertEquals(mockClient.getLastPayload(), null);
});

Deno.test("handleWebhook - rejects non-JSON content type", async () => {
  const mockContext = {
    req: {
      method: "POST",
      header: () => null,
      // deno-lint-ignore require-await
      json: async () => {
        throw new Error("Should not be called");
      },
    },
    json: (data: unknown) => new Response(JSON.stringify(data)),
  } as unknown as Context;

  try {
    await handleWebhook(mockContext, "fluxcd-generic");
    assertEquals(true, false, "Should have thrown for non-JSON");
  } catch (error) {
    assertEquals(
      (error as Error).message,
      "Content-Type must be application/json",
      "Should reject non-JSON content type",
    );
  }

  assertEquals(mockClient.getLastPayload(), null);
});

Deno.test("handleWebhook - returns 404 for unknown mapping", async () => {
  const mockContext = createMockContext({ test: "data" });

  try {
    await handleWebhook(mockContext, "non-existent-mapping");
    assertEquals(true, false, "Should have thrown for unknown mapping");
  } catch (error) {
    assertEquals(
      (error as Error).message.includes("Mapping not found"),
      true,
      "Error should mention Mapping not found",
    );
  }

  // No API call should have been made
  assertEquals(mockClient.getLastPayload(), null);
});
