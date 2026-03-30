import type { BrrrPayload, MappingConfig, TransformationResult } from "../types/index.ts";

export interface Transformer {
  transform(payload: unknown, mapping: MappingConfig): TransformationResult;
}

export class BaseTransformer implements Transformer {
  transform(payload: unknown, mapping: MappingConfig): TransformationResult {
    const brrrPayload = this.buildBrrrPayload(payload, mapping);

    return {
      payload: brrrPayload,
    };
  }

  protected getValueByPath(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== "object") return undefined;

    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  protected interpolateTemplate(template: string, payload: unknown): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = this.getValueByPath(payload, path.trim());
      if (value === null || value === undefined || value === "") {
        return "";
      }
      return String(value);
    });
  }

  protected buildBrrrPayload(
    sourcePayload: unknown,
    mapping: MappingConfig
  ): BrrrPayload {
    const result: BrrrPayload = {};

    for (const fieldMapping of mapping.brrr_fields) {
      const { field_expression, target_field } = fieldMapping;

      if (field_expression.includes("{{") && field_expression.includes("}}")) {
        const value = this.interpolateTemplate(field_expression, sourcePayload);
        const hasContent = value.replace(/^[\s-]+/, "").length > 0;
        if (hasContent) {
          (result as Record<string, unknown>)[target_field] = value;
        }
      } else {
        const value = this.getValueByPath(sourcePayload, field_expression);
        if (value === null || value === undefined) {
          continue;
        }
        const processedValue = typeof value === "string" ? value : String(value);

        if (processedValue) {
          (result as Record<string, unknown>)[target_field] = processedValue;
        }
      }
    }

    if (mapping.default_values) {
      for (const [field, defaultValue] of Object.entries(mapping.default_values)) {
        if (!(result as Record<string, unknown>)[field]) {
          (result as Record<string, unknown>)[field] = defaultValue;
        }
      }
    }

    return result;
  }
}

export const baseTransformer = new BaseTransformer();
