import { assertEquals, assertExists } from "@std/assert";
import { parse } from "@std/yaml";
import type { MappingsConfig, MappingConfig } from "../../../src/types/index.ts";

Deno.test("Contract - YAML mapping schema is valid", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
    default_values:
      title: "Default Title"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  
  assertExists(config.mappings);
  assertExists(config.mappings["test-mapping-1"]);
});

Deno.test("Contract - brrr_fields must be array", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "a"
        target_field: "b"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(Array.isArray(mapping.brrr_fields), true);
});

Deno.test("Contract - each field mapping requires field_expression and target_field", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "{{prefix}} - {{kind}}"
        target_field: "title"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields[0].field_expression, "message");
  assertEquals(mapping.brrr_fields[0].target_field, "message");
  assertEquals(mapping.brrr_fields[1].field_expression, "{{prefix}} - {{kind}}");
  assertEquals(mapping.brrr_fields[1].target_field, "title");
});

Deno.test("Contract - default_values is optional", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(mapping.default_values, undefined);
});

Deno.test("Contract - default_values can be defined", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
    default_values:
      title: "Default Title"
      message: "Default Message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(mapping.default_values?.title, "Default Title");
  assertEquals(mapping.default_values?.message, "Default Message");
});

Deno.test("Contract - multiple mappings supported", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
  test-mapping-2:
    brrr_fields:
      - field_expression: "body"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  
  assertExists(config.mappings["test-mapping-1"]);
  assertExists(config.mappings["test-mapping-2"]);
});

Deno.test("Contract - template syntax in field_expression", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "{{prefix}} - {{kind}}"
        target_field: "title"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  const field = mapping.brrr_fields[0];
  assertEquals(field.field_expression.includes("{{prefix}}"), true);
  assertEquals(field.field_expression.includes("{{kind}}"), true);
});

Deno.test("Contract - nested path in field_expression", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "metadata.labels.app"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields[0].field_expression, "metadata.labels.app");
});

Deno.test("Contract - Brrr fields are mapped to valid targets", () => {
  const validBrrrFields = [
    "title", "subtitle", "message", "thread_id", "sound", 
    "open_url", "image_url", "expiration_date", "filter_criteria", "interruption_level"
  ];
  
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields:
      - field_expression: "a"
        target_field: "title"
      - field_expression: "b"
        target_field: "message"
      - field_expression: "c"
        target_field: "subtitle"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  for (const field of mapping.brrr_fields) {
    assertEquals(validBrrrFields.includes(field.target_field), true, `Invalid field: ${field.target_field}`);
  }
});

Deno.test("Contract - empty mappings list is valid", () => {
  const yamlContent = `
mappings:
  test-mapping-1:
    brrr_fields: []
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test-mapping-1"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 0);
});

Deno.test("Contract - fluxcd-generic mapping structure", () => {
  const yamlContent = `
mappings:
  fluxcd-generic:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "FluxCD - {{involvedObject.kind}}"
        target_field: "title"
      - field_expression: "involvedObject.name"
        target_field: "subtitle"
    default_values:
      title: "FluxCD"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["fluxcd-generic"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 3);
  assertEquals(mapping.default_values?.title, "FluxCD");
});

Deno.test("Contract - beszel mapping structure", () => {
  const yamlContent = `
mappings:
  beszel:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "Beszel - {{title}}"
        target_field: "title"
    default_values:
      title: "Beszel"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["beszel"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 2);
  assertEquals(mapping.default_values?.title, "Beszel");
});

Deno.test("Contract - uptimekuma mapping structure", () => {
  const yamlContent = `
mappings:
  uptimekuma:
    brrr_fields:
      - field_expression: "heartbeat.msg"
        target_field: "message"
      - field_expression: "monitor.name"
        target_field: "subtitle"
    default_values:
      title: "Uptime Kuma"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["uptimekuma"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 2);
  assertEquals(mapping.default_values?.title, "Uptime Kuma");
});

Deno.test("Contract - proxmox mapping structure", () => {
  const yamlContent = `
mappings:
  proxmox:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "title"
        target_field: "subtitle"
    default_values:
      title: "Proxmox"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["proxmox"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 2);
  assertEquals(mapping.default_values?.title, "Proxmox");
});
