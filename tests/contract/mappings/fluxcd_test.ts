import { assertEquals, assertExists } from "@std/assert";
import { parse } from "@std/yaml";
import type { MappingsConfig, MappingConfig } from "../../../src/types/index.ts";

Deno.test("Contract - YAML mapping schema is valid", () => {
  const yamlContent = `
mappings:
  fluxcd-generic:
    brrr_fields:
      - source_path: "message"
        target_field: "message"
    default_values:
      title: "FluxCD - Unknown"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  
  assertExists(config.mappings);
  assertExists(config.mappings["fluxcd-generic"]);
});

Deno.test("Contract - brrr_fields must be array", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "a"
        target_field: "b"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(Array.isArray(mapping.brrr_fields), true);
});

Deno.test("Contract - each field mapping requires source_path and target_field", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "message"
        target_field: "message"
      - source_path: "FluxCD - {{involvedObject.kind}}"
        target_field: "title"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields[0].source_path, "message");
  assertEquals(mapping.brrr_fields[0].target_field, "message");
  assertEquals(mapping.brrr_fields[1].source_path, "FluxCD - {{involvedObject.kind}}");
  assertEquals(mapping.brrr_fields[1].target_field, "title");
});

Deno.test("Contract - default_values is optional", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "message"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(mapping.default_values, undefined);
});

Deno.test("Contract - default_values can be defined", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "message"
        target_field: "message"
    default_values:
      title: "Default Title"
      message: "Default Message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(mapping.default_values?.title, "Default Title");
  assertEquals(mapping.default_values?.message, "Default Message");
});

Deno.test("Contract - multiple mappings supported", () => {
  const yamlContent = `
mappings:
  fluxcd-generic:
    brrr_fields:
      - source_path: "message"
        target_field: "message"
  github:
    brrr_fields:
      - source_path: "body"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  
  assertExists(config.mappings["fluxcd-generic"]);
  assertExists(config.mappings["github"]);
});

Deno.test("Contract - template syntax in source_path", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "{{prefix}} - {{kind}}"
        target_field: "title"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  const field = mapping.brrr_fields[0];
  assertEquals(field.source_path.includes("{{prefix}}"), true);
  assertEquals(field.source_path.includes("{{kind}}"), true);
});

Deno.test("Contract - nested path in source_path", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "metadata.labels.app"
        target_field: "message"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields[0].source_path, "metadata.labels.app");
});

Deno.test("Contract - Brrr fields are mapped to valid targets", () => {
  const validBrrrFields = [
    "title", "subtitle", "message", "thread_id", "sound", 
    "open_url", "image_url", "expiration_date", "filter_criteria", "interruption_level"
  ];
  
  const yamlContent = `
mappings:
  test:
    brrr_fields:
      - source_path: "a"
        target_field: "title"
      - source_path: "b"
        target_field: "message"
      - source_path: "c"
        target_field: "subtitle"
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  for (const field of mapping.brrr_fields) {
    assertEquals(validBrrrFields.includes(field.target_field), true, `Invalid field: ${field.target_field}`);
  }
});

Deno.test("Contract - empty mappings list is valid", () => {
  const yamlContent = `
mappings:
  test:
    brrr_fields: []
`;
  
  const config = parse(yamlContent) as MappingsConfig;
  const mapping = config.mappings["test"] as MappingConfig;
  
  assertEquals(mapping.brrr_fields.length, 0);
});