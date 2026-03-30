import { BaseTransformer } from "./base.ts";
import type { MappingConfig, TransformationResult } from "../types/index.ts";

export class FluxCDTransformer extends BaseTransformer {
  transform(payload: unknown, mapping: MappingConfig): TransformationResult {
    const brrrPayload = this.buildBrrrPayload(payload, mapping);

    return {
      payload: brrrPayload,
      mappingName: "fluxcd-generic",
    };
  }
}

export const fluxCDTransformer = new FluxCDTransformer();