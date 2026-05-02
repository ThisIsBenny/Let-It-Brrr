import { parse } from "@std/yaml";
import type { MappingConfig, MappingsConfig } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

export class ConfigLoader {
  private mappings: Map<string, MappingConfig> = new Map();
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || Deno.env.get("MAPPINGS_FILE") ||
      "./config/mappings.yaml";
  }

  async load(): Promise<void> {
    try {
      const content = await Deno.readTextFile(this.configPath);
      const config = parse(content) as MappingsConfig;

      if (!config.mappings) {
        throw new Error("Invalid config: 'mappings' key not found");
      }

      for (const [id, mapping] of Object.entries(config.mappings)) {
        const typedMapping = mapping as MappingConfig;
        this.mappings.set(id, typedMapping);
        this.validateMapping(id, typedMapping);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }
      throw error;
    }
  }

  private validateMapping(id: string, mapping: MappingConfig): void {
    let entryIndex = 0;
    for (const entry of mapping.brrr_fields) {
      entryIndex++;
      const prefix = `[${id}].brrr_fields[${entryIndex - 1}]`;

      if (entry.when && !entry.value) {
        logger.warn(
          `Skipping incomplete conditional entry: ${prefix} has 'when' but missing 'value'`,
        );
      } else if (entry.value && !entry.when) {
        logger.warn(
          `Skipping incomplete conditional entry: ${prefix} has 'value' but missing 'when'`,
        );
      } else if (!entry.field_expression && !entry.when) {
        logger.warn(
          `Skipping incomplete entry: ${prefix} has neither 'field_expression' nor 'when'`,
        );
      }
    }

    if (mapping.default_values) {
      logger.info(
        `[${id}] default_values is deprecated; prefer conditional rules for field assignment`,
      );
    }
  }

  getMapping(mappingId: string): MappingConfig | undefined {
    return this.mappings.get(mappingId);
  }

  getAllMappings(): Map<string, MappingConfig> {
    return this.mappings;
  }

  getMappingsCount(): number {
    return this.mappings.size;
  }
}

let globalLoader: ConfigLoader | null = null;

export async function getConfigLoader(
  configPath?: string,
): Promise<ConfigLoader> {
  if (!globalLoader) {
    globalLoader = new ConfigLoader(configPath);
    await globalLoader.load();
  }
  return globalLoader;
}

export function resetConfigLoader(): void {
  globalLoader = null;
}
