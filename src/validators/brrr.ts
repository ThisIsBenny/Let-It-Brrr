import { config } from "../config/config.ts";

export type BrrrValidationResult = {
  valid: boolean;
  warnings: string[];
  sanitizedPayload: Record<string, unknown>;
};

function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.includes("T");
}

function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date < new Date();
}

export function validateBrrrPayload(
  payload: Record<string, unknown>,
): BrrrValidationResult {
  const warnings: string[] = [];
  const sanitizedPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!config.allowedBrrrFields.includes(key as typeof config.allowedBrrrFields[number])) {
      warnings.push(`Invalid field: ${key}`);
      continue;
    }

    if (key === "sound") {
      if (!config.allowedSounds.includes(value as typeof config.allowedSounds[number])) {
        warnings.push(`Invalid field: sound`);
        continue;
      }
    }

    if (key === "interruption_level") {
      if (!config.allowedInterruptionLevels.includes(value as typeof config.allowedInterruptionLevels[number])) {
        warnings.push(`Invalid field: interruption_level`);
        continue;
      }
    }

    if (key === "expiration_date") {
      if (typeof value !== "string" || !isValidISODate(value)) {
        warnings.push(`Invalid field: expiration_date`);
        continue;
      }
      if (isPastDate(value)) {
        warnings.push(`Invalid field: expiration_date`);
        continue;
      }
    }

    sanitizedPayload[key] = value;
  }

  return {
    valid: warnings.length === 0,
    warnings,
    sanitizedPayload,
  };
}
