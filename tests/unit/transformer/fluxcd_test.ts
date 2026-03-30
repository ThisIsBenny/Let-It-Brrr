import { assertEquals } from "@std/assert";
import { FluxCDTransformer } from "../../../src/transformers/fluxcd.ts";
import type { MappingConfig } from "../../../src/types/index.ts";

Deno.test("FluxCDTransformer - direct field mapping", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
  };

  const payload = { message: "Test message" };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Test message");
});

Deno.test("FluxCDTransformer - nested field mapping", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = { involvedObject: { name: "my-app" } };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("FluxCDTransformer - template interpolation", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "FluxCD - {{involvedObject.kind}}", target_field: "title" },
    ],
  };

  const payload = { involvedObject: { kind: "Deployment" } };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - Deployment");
});

Deno.test("FluxCDTransformer - template with multiple fields", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "{{reportingController}} - {{involvedObject.kind}}", target_field: "title" },
    ],
  };

  const payload = { 
    reportingController: "deployment-controller",
    involvedObject: { kind: "Deployment" }
  };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.title, "deployment-controller - Deployment");
});

Deno.test("FluxCDTransformer - default values when missing - template has static prefix", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      { field_expression: "FluxCD - {{involvedObject.kind}}", target_field: "title" },
    ],
    default_values: {
      title: "FluxCD - Unknown",
    },
  };

  const payload = { message: "Test" };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Test");
  // Template with static prefix "FluxCD - " keeps that even if interpolated part is empty
  assertEquals(result.payload.title, "FluxCD - ");
});

Deno.test("FluxCDTransformer - default values NOT used when field exists", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "FluxCD - {{involvedObject.kind}}", target_field: "title" },
    ],
    default_values: {
      title: "FluxCD - Unknown",
    },
  };

  const payload = { involvedObject: { kind: "Kustomization" } };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - Kustomization");
});

Deno.test("FluxCDTransformer - multiple mappings", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      { field_expression: "FluxCD - {{involvedObject.kind}}", target_field: "title" },
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = { 
    message: "Deployment failed",
    involvedObject: { kind: "Deployment", name: "my-app" }
  };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Deployment failed");
  assertEquals(result.payload.title, "FluxCD - Deployment");
  assertEquals(result.payload.subtitle, "my-app");
});

Deno.test("FluxCDTransformer - empty template value becomes empty string", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "FluxCD - {{missing.field}}", target_field: "title" },
    ],
  };

  const payload = {};
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.title, "FluxCD - ");
});

Deno.test("FluxCDTransformer - missing nested field returns undefined", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "involvedObject.name", target_field: "subtitle" },
    ],
  };

  const payload = { involvedObject: {} };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.subtitle, undefined);
});

Deno.test("FluxCDTransformer - null value skipped, can use default", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      message: "Default message",
    },
  };

  const payload = { message: null };
  const result = transformer.transform(payload, mapping);

  // Null is skipped, so default should be used
  assertEquals(result.payload.message, "Default message");
});

Deno.test("FluxCDTransformer - number converted to string", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "count", target_field: "message" },
    ],
  };

  const payload = { count: 42 };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "42");
});

Deno.test("FluxCDTransformer - boolean converted to string", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "active", target_field: "message" },
    ],
  };

  const payload = { active: true };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "true");
});

Deno.test("FluxCDTransformer - empty payload", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      message: "Default message",
    },
  };

  const payload = {};
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Default message");
});

Deno.test("FluxCDTransformer - deep nested path", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "metadata.labels.app", target_field: "message" },
    ],
  };

  const payload = { 
    metadata: { 
      labels: { 
        app: "my-app" 
      } 
    } 
  };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "my-app");
});

Deno.test("FluxCDTransformer - deep nested path with missing intermediate", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "metadata.labels.app", target_field: "message" },
    ],
  };

  const payload = { metadata: {} };
  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, undefined);
});

Deno.test("FluxCDTransformer - result includes mappingName", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [],
  };

  const payload = {};
  const result = transformer.transform(payload, mapping);

  assertEquals(result.mappingName, "fluxcd-generic");
});

Deno.test("FluxCDTransformer - full real-world payload", () => {
  const transformer = new FluxCDTransformer();
  
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      { field_expression: "FluxCD - {{involvedObject.kind}}", target_field: "title" },
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
      name: "my-app"
    },
    reportingController: "kustomize-controller"
  };

  const result = transformer.transform(payload, mapping);

  assertEquals(result.payload.message, "Deployment failed");
  assertEquals(result.payload.title, "FluxCD - Kustomization");
  assertEquals(result.payload.subtitle, "my-app");
});