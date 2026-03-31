import { assertEquals, assertExists } from "@std/assert";
import { ConfigLoader } from "../../src/config/loader.ts";
import { baseTransformer } from "../../src/transformers/base.ts";
import type { MappingConfig } from "../../src/types/index.ts";

Deno.test("Integration - Load config and transform payload", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const mapping = loader.getMapping("fluxcd-generic");
  assertExists(mapping);

  const payload = {
    message: "Deployment failed",
    involvedObject: { kind: "Deployment", name: "my-app" },
  };

  const result = baseTransformer.transform(payload, mapping as MappingConfig);

  assertEquals(result.payload.message, "Deployment failed");
  assertEquals(result.payload.title, "FluxCD - Deployment");
  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("Integration - Config loader returns correct count", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  assertEquals(loader.getMappingsCount(), 4);
});

Deno.test("Integration - Unknown mapping returns undefined", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const mapping = loader.getMapping("unknown-mapping");
  assertEquals(mapping, undefined);
});

Deno.test("Integration - Real FluxCD webhook payload transformation", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const mapping = loader.getMapping("fluxcd-generic") as MappingConfig;

  const realFluxCDPayload = {
    "message": "Deployment 'my-app' is ready",
    "reason": "Progressing",
    "severity": "info",
    "involvedObject": {
      "kind": "Deployment",
      "name": "my-app",
      "namespace": "default",
    },
    "reportingController": "deployment-controller",
    "reportingInstance": "deployment-controller-abc123",
  };

  const result = baseTransformer.transform(realFluxCDPayload, mapping);

  assertEquals(result.payload.message, "Deployment 'my-app' is ready");
  assertEquals(result.payload.title, "FluxCD - Deployment");
  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("Integration - Multiple mappings in config", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const allMappings = loader.getAllMappings();

  assertEquals(allMappings.size >= 1, true);

  for (const [_id, mapping] of allMappings) {
    assertExists(mapping.brrr_fields);
    assertEquals(Array.isArray(mapping.brrr_fields), true);
  }
});

Deno.test("Integration - Default values applied when source missing", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const mapping = loader.getMapping("fluxcd-generic") as MappingConfig;

  const minimalPayload = {
    message: "Test",
  };

  const result = baseTransformer.transform(minimalPayload, mapping);

  assertExists(result.payload.title);
});

Deno.test("Integration - Empty message field skipped", async () => {
  const loader = new ConfigLoader("config/mappings.example.yaml");
  await loader.load();

  const mapping = loader.getMapping("fluxcd-generic") as MappingConfig;

  const payloadWithEmptyMessage = {
    message: "",
    involvedObject: { kind: "Deployment" },
  };

  const result = baseTransformer.transform(payloadWithEmptyMessage, mapping);

  assertEquals(result.payload.message, undefined);
});
