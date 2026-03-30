import { assertEquals, assertArrayIncludes } from "@std/assert";
import { validateBrrrPayload } from "../../../src/validators/brrr.ts";

Deno.test("Validator - accepts valid payload", () => {
  const payload = {
    message: "Test message",
    title: "Test title",
    sound: "bell_ringing",
    interruption_level: "active",
    expiration_date: "2027-01-01T00:00:00.000Z",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, true);
  assertEquals(result.warnings.length, 0);
  assertEquals(result.sanitizedPayload.message, "Test message");
});

Deno.test("Validator - rejects unknown fields", () => {
  const payload = {
    message: "Test",
    unknown_field: "should be rejected",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertArrayIncludes(result.warnings, ["Invalid field: unknown_field"]);
  assertEquals(result.sanitizedPayload.unknown_field, undefined);
});

Deno.test("Validator - rejects invalid sound values", () => {
  const payload = {
    message: "Test",
    sound: "invalid_sound",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertArrayIncludes(result.warnings, ["Invalid field: sound"]);
  assertEquals(result.sanitizedPayload.sound, undefined);
});

Deno.test("Validator - accepts all valid sound values", () => {
  const validSounds = [
    "default",
    "system",
    "brrr",
    "bell_ringing",
    "bubble_ding",
    "bubbly_success_ding",
    "cat_meow",
    "calm1",
    "calm2",
    "cha_ching",
    "dog_barking",
    "door_bell",
    "duck_quack",
    "short_triple_blink",
    "upbeat_bells",
    "warm_soft_error",
  ];

  for (const sound of validSounds) {
    const result = validateBrrrPayload({ message: "Test", sound });
    assertEquals(result.valid, true, `Sound "${sound}" should be valid`);
  }
});

Deno.test("Validator - rejects invalid interruption_level values", () => {
  const payload = {
    message: "Test",
    interruption_level: "urgent",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertArrayIncludes(result.warnings, ["Invalid field: interruption_level"]);
  assertEquals(result.sanitizedPayload.interruption_level, undefined);
});

Deno.test("Validator - accepts all valid interruption_level values", () => {
  const validLevels = ["active", "passive", "time-sensitive"];

  for (const level of validLevels) {
    const result = validateBrrrPayload({ message: "Test", interruption_level: level });
    assertEquals(result.valid, true, `Interruption level "${level}" should be valid`);
  }
});

Deno.test("Validator - rejects invalid ISO 8601 date formats", () => {
  const invalidDates = [
    "not-a-date",
    "2025-13-45",
    "2025/01/01",
    "01-01-2025",
  ];

  for (const date of invalidDates) {
    const result = validateBrrrPayload({ message: "Test", expiration_date: date });
    assertEquals(result.valid, false, `Date "${date}" should be invalid`);
    assertArrayIncludes(result.warnings, ["Invalid field: expiration_date"]);
  }
});

Deno.test("Validator - rejects past expiration dates", () => {
  const payload = {
    message: "Test",
    expiration_date: "2020-01-01T00:00:00.000Z",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertArrayIncludes(result.warnings, ["Invalid field: expiration_date"]);
});

Deno.test("Validator - accepts future expiration dates", () => {
  const payload = {
    message: "Test",
    expiration_date: "2030-12-31T23:59:59.000Z",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, true);
  assertEquals(result.sanitizedPayload.expiration_date, "2030-12-31T23:59:59.000Z");
});

Deno.test("Validator - handles multiple invalid fields", () => {
  const payload = {
    message: "Test",
    unknown1: "bad",
    unknown2: "also bad",
    sound: "invalid",
    interruption_level: "invalid",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertEquals(result.warnings.length, 4);
  assertEquals(result.sanitizedPayload.unknown1, undefined);
  assertEquals(result.sanitizedPayload.sound, undefined);
  assertEquals(result.sanitizedPayload.interruption_level, undefined);
});

Deno.test("Validator - strips invalid fields but keeps valid ones", () => {
  const payload = {
    message: "Test",
    title: "Valid title",
    sound: "invalid",
    unknown_field: "rejected",
  };

  const result = validateBrrrPayload(payload);

  assertEquals(result.valid, false);
  assertEquals(result.sanitizedPayload.message, "Test");
  assertEquals(result.sanitizedPayload.title, "Valid title");
  assertEquals(result.sanitizedPayload.sound, undefined);
  assertEquals(result.sanitizedPayload.unknown_field, undefined);
});
