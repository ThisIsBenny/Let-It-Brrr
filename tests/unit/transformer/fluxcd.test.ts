import { assertEquals } from "@std/assert";
import { baseTransformer } from "../../../src/transformers/base.ts";
import type { MappingConfig } from "../../../src/types/index.ts";

Deno.test("BaseTransformer - direct field mapping", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
  };

  const payload = { message: "Test message" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Test message");
});

Deno.test("BaseTransformer - nested field mapping", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = { involvedObject: { name: "my-app" } };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("BaseTransformer - template interpolation", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        field_expression: "FluxCD - {{involvedObject.kind}}",
        target_field: "title",
      },
    ],
  };

  const payload = { involvedObject: { kind: "Deployment" } };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - Deployment");
});

Deno.test("BaseTransformer - template with multiple fields", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        field_expression: "{{reportingController}} - {{involvedObject.kind}}",
        target_field: "title",
      },
    ],
  };

  const payload = {
    reportingController: "deployment-controller",
    involvedObject: { kind: "Deployment" },
  };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.title, "deployment-controller - Deployment");
});

Deno.test("BaseTransformer - default values when missing - template has static prefix", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      {
        field_expression: "FluxCD - {{involvedObject.kind}}",
        target_field: "title",
      },
    ],
    default_values: {
      title: "FluxCD - Unknown",
    },
  };

  const payload = { message: "Test" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Test");
  assertEquals(result.payload.title, "FluxCD - ");
});

Deno.test("BaseTransformer - default values NOT used when field exists", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        field_expression: "FluxCD - {{involvedObject.kind}}",
        target_field: "title",
      },
    ],
    default_values: {
      title: "FluxCD - Unknown",
    },
  };

  const payload = { involvedObject: { kind: "Kustomization" } };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - Kustomization");
});

Deno.test("BaseTransformer - multiple mappings", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      {
        field_expression: "FluxCD - {{involvedObject.kind}}",
        target_field: "title",
      },
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = {
    message: "Deployment failed",
    involvedObject: { kind: "Deployment", name: "my-app" },
  };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Deployment failed");
  assertEquals(result.payload.title, "FluxCD - Deployment");
  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("BaseTransformer - empty template value becomes empty string", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "FluxCD - {{missing.field}}", target_field: "title" },
    ],
  };

  const payload = {};
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - ");
});

Deno.test("BaseTransformer - missing nested field returns undefined", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = { involvedObject: {} };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.subtitle, undefined);
});

Deno.test("BaseTransformer - null value skipped, can use default", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      message: "Default message",
    },
  };

  const payload = { message: null };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Default message");
});

Deno.test("BaseTransformer - number converted to string", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "count", target_field: "message" },
    ],
  };

  const payload = { count: 42 };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "42");
});

Deno.test("BaseTransformer - boolean converted to string", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "active", target_field: "message" },
    ],
  };

  const payload = { active: true };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "true");
});

Deno.test("BaseTransformer - empty payload", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      message: "Default message",
    },
  };

  const payload = {};
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Default message");
});

Deno.test("BaseTransformer - deep nested path", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "metadata.labels.app", target_field: "message" },
    ],
  };

  const payload = {
    metadata: {
      labels: {
        app: "my-app",
      },
    },
  };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "my-app");
});

Deno.test("BaseTransformer - deep nested path with missing intermediate", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "metadata.labels.app", target_field: "message" },
    ],
  };

  const payload = { metadata: {} };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, undefined);
});

Deno.test("BaseTransformer - full real-world payload", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      {
        field_expression: "FluxCD - {{involvedObject.kind}}",
        target_field: "title",
      },
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
    default_values: {
      title: "FluxCD - Unknown",
    },
  };

  const payload = {
    message: "Deployment failed",
    reason: "HealthCheckFailed",
    severity: "error",
    involvedObject: {
      kind: "Kustomization",
      name: "my-app",
    },
    reportingController: "kustomize-controller",
  };

  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Deployment failed");
  assertEquals(result.payload.title, "FluxCD - Kustomization");
  assertEquals(result.payload.subtitle, "my-app");
});
