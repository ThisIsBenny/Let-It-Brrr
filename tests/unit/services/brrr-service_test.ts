import { assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";
import { BrrrService } from "../../../src/services/brrr-service.ts";
import { MockBrrrApiClient } from "../../mocks/mock-brrr-api-client.ts";
import { baseTransformer } from "../../../src/transformers/base.ts";
import type { MappingConfig } from "../../../src/types/index.ts";
import { BrrrApiError } from "../../../src/errors/index.ts";

Deno.test.beforeEach(() => {
  BrrrService.reset();
});

const mockMapping: MappingConfig = {
  brrr_fields: [
    { field_expression: "message", target_field: "message" },
    { field_expression: "involvedObject.kind", target_field: "title" },
    { field_expression: "involvedObject.name", target_field: "subtitle" },
  ],
};

Deno.test("sendNotification - success with valid payload", async () => {
  const mockClient = MockBrrrApiClient.success();
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  const payload = {
    title: "Test",
    message: "Hello world",
  };

  await service.sendNotification(mockMapping, payload);

  const sentPayload = mockClient.getLastPayload();
  assertExists(sentPayload);
  assertEquals(sentPayload.title, "Test");
  assertEquals(sentPayload.message, "Hello world");
});

Deno.test("sendNotification - failure when API returns error", async () => {
  const mockClient = MockBrrrApiClient.failure("API is down");
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  const payload = {
    title: "Test",
    message: "Hello world",
  };

  await assertRejects(
    () => service.sendNotification(mockMapping, payload),
    Error,
    "Failed to send notification: API is down"
  );
});

Deno.test("sendNotification - strips unknown fields", async () => {
  const mockClient = MockBrrrApiClient.success();
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  const payload = {
    title: "Test",
    message: "Hello world",
    unknownField: "should be stripped",
  } as unknown as Parameters<typeof service.sendNotification>[1];

  await service.sendNotification(mockMapping, payload);

  const sentPayload = mockClient.getLastPayload();
  assertExists(sentPayload);
  assertEquals((sentPayload as Record<string, unknown>).unknownField, undefined);
});

Deno.test("sendNotification - uses transformed payload with defaults", async () => {
  const mappingWithDefaults: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      title: "Default Title",
    },
  };

  const mockClient = MockBrrrApiClient.success();
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  const rawPayload = {
    message: "Hello",
  };

  const transformed = baseTransformer.transform(rawPayload, mappingWithDefaults);

  await service.sendNotification(mappingWithDefaults, transformed.payload);

  const sentPayload = mockClient.getLastPayload();
  assertExists(sentPayload);
  assertEquals(sentPayload.title, "Default Title");
});

Deno.test("sendNotification - unmapped fields use default values", async () => {
  const mappingWithDefaults: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      title: "Default Title",
    },
  };

  const mockClient = MockBrrrApiClient.success();
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  const rawPayload = {
    message: "Hello",
  };

  const transformed = baseTransformer.transform(rawPayload, mappingWithDefaults);

  await service.sendNotification(mappingWithDefaults, transformed.payload);

  const sentPayload = mockClient.getLastPayload();
  assertExists(sentPayload);
  assertEquals(sentPayload.title, "Default Title");
});

Deno.test("get - returns singleton instance", () => {
  const mockClient = MockBrrrApiClient.success();
  const service1 = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);
  const service2 = BrrrService.get("https://api.brrr.now/v1/", "secret", mockClient);

  assertEquals(service1, service2);
});

Deno.test("get - without secret and without apiClient throws", () => {
  assertThrows(
    () => BrrrService.get("https://api.brrr.now/v1/"),
    BrrrApiError,
    "BRRR_SECRET environment variable is required"
  );
});