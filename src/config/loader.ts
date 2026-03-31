import { parse } from "@std/yaml";
import type { MappingConfig, MappingsConfig } from "../types/index.ts";

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
        this.mappings.set(id, mapping as MappingConfig);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }
      throw error;
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
