import type { BrrrPayload, MappingConfig, TransformationResult } from "../types/index.ts";

export interface Transformer {
  transform(payload: unknown, mapping: MappingConfig): TransformationResult;
}

export abstract class BaseTransformer implements Transformer {
  abstract transform(payload: unknown, mapping: MappingConfig): TransformationResult;

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
      // Treat null/undefined/empty as no value
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
      const { source_path, target_field } = fieldMapping;
      
      // Check if it's a template (contains {{...}})
      if (source_path.includes("{{") && source_path.includes("}}")) {
        const value = this.interpolateTemplate(source_path, sourcePayload);
        // Only use template if it has actual substituted content
        // "FluxCD - " (static text only) is treated as empty
        const hasContent = value.replace(/^[\s-]+/, "").length > 0;
        if (hasContent) {
          (result as Record<string, unknown>)[target_field] = value;
        }
      } else {
        // Direct field mapping
        const value = this.getValueByPath(sourcePayload, source_path);
        // Handle null, undefined, and empty string
        if (value === null || value === undefined) {
          continue; // Skip, let default_values handle it
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