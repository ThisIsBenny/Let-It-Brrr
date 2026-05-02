import { assertEquals } from "@std/assert";
import { baseTransformer } from "../../../src/transformers/base.ts";
import type { MappingConfig } from "../../../src/types/index.ts";

// =============================================================================
// US1: Single Conditional Rule Matching
// =============================================================================

Deno.test("Conditional - single rule matches and assigns value [US1]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "urgent" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "urgent: server down" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "urgent: server down");
  assertEquals(result.payload.interruption_level, "critical");
});

Deno.test("Conditional - case-insensitive matching [US1]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "URGENT" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "Urgent: deploy failed" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "critical");
});

Deno.test("Conditional - does NOT match when substring absent [US1]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "urgent" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "all systems normal" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

// =============================================================================
// US2: First-Match-Wins with Multiple Rules
// =============================================================================

Deno.test("Conditional - first match wins when both rules match [US2]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "critical" },
        value: "critical",
      },
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "error" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "critical error in pipeline" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "critical");
});

Deno.test("Conditional - second rule matches when first does not [US2]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "critical" },
        value: "critical",
      },
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "error" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "minor error in logs" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "time-sensitive");
});

Deno.test("Conditional - no rules match falls back to default [US2]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "critical" },
        value: "critical",
      },
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "error" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "all good" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

// =============================================================================
// US3: Conditional Rules on Nested Fields
// =============================================================================

Deno.test("Conditional - nested field path resolution [US3]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "involvedObject.kind", contains: "Kustomization" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { involvedObject: { kind: "Kustomization" } };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "time-sensitive");
});

Deno.test("Conditional - deeply nested path (3+ levels) [US3]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "metadata.labels.severity", contains: "high" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { metadata: { labels: { severity: "high" } } };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "critical");
});

Deno.test("Conditional - missing nested path treated as non-match [US3]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "involvedObject.kind", contains: "Kustomization" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = {};
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

// =============================================================================
// US4: Fallback to Default Value When No Rules Match
// =============================================================================

Deno.test("Conditional - default_values fallback when no rule matches [US4]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "urgent" },
        value: "critical",
      },
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "error" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "routine update" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

Deno.test("Conditional - default_values with no conditional rules at all [US4]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
    ],
    default_values: {
      interruption_level: "passive",
    },
  };

  const payload = { message: "hello" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "hello");
  assertEquals(result.payload.interruption_level, "passive");
});

// =============================================================================
// US6: Clear Warnings for Configuration Mistakes
// =============================================================================

Deno.test("Conditional - when without value is skipped gracefully [US6]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        // @ts-ignore testing invalid config
        when: { field: "message", contains: "urgent" },
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "urgent: server down" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

Deno.test("Conditional - value without when is skipped gracefully [US6]", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        // @ts-ignore testing invalid config
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "urgent: server down" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

// =============================================================================
// Additional Edge Cases
// =============================================================================

Deno.test("Conditional - works for target_field other than interruption_level", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      {
        target_field: "sound",
        when: { field: "severity", contains: "critical" },
        value: "alarm",
      },
    ],
  };

  const payload = { message: "disk full", severity: "critical" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "disk full");
  assertEquals(result.payload.sound, "alarm");
});

Deno.test("Conditional - first-match-wins across different target_fields independent", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "critical" },
        value: "critical",
      },
      {
        target_field: "sound",
        when: { field: "severity", contains: "high" },
        value: "alarm",
      },
    ],
  };

  const payload = { message: "critical: disk full", severity: "high" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "critical");
  assertEquals(result.payload.sound, "alarm");
});

Deno.test("Conditional - empty source field does not match non-empty contains", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "urgent" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

Deno.test("Conditional - number field coerced to string and matched", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "code", contains: "5" },
        value: "time-sensitive",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { code: 500 };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "time-sensitive");
});

Deno.test("Conditional - null field resolves as non-match", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      {
        target_field: "interruption_level",
        when: { field: "message", contains: "urgent" },
        value: "critical",
      },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: null };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.interruption_level, "active");
});

Deno.test("Conditional - entry with neither field_expression nor when is skipped", () => {
  const mapping: MappingConfig = {
    brrr_fields: [
      { field_expression: "message", target_field: "message" },
      // @ts-ignore testing degenerate entry
      { target_field: "interruption_level" },
    ],
    default_values: {
      interruption_level: "active",
    },
  };

  const payload = { message: "hello" };
  const result = baseTransformer.transform(payload, mapping);

  assertEquals(result.payload.message, "hello");
  assertEquals(result.payload.interruption_level, "active");
});
