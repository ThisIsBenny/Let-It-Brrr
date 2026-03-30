export interface BrrrFieldMapping {
  field_expression: string;
  target_field: string;
}

export interface DefaultValues {
  [targetField: string]: string;
}

export interface MappingConfig {
  brrr_fields: BrrrFieldMapping[];
  default_values?: DefaultValues;
}

export interface MappingsConfig {
  mappings: {
    [mappingId: string]: MappingConfig;
  };
}

export interface WebhookRequest {
  mappingId: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface BrrrPayload {
  title?: string;
  subtitle?: string;
  message?: string;
  thread_id?: string;
  sound?: string;
  open_url?: string;
  image_url?: string;
  expiration_date?: string;
  filter_criteria?: string;
  interruption_level?: string;
}

export interface FluxCDEvent {
  message?: string;
  reason?: string;
  severity?: string;
  involvedObject?: {
    kind?: string;
    name?: string;
  };
  reportingController?: string;
}

export interface HealthResponse {
  status: string;
  mappings_count: number;
  version: string;
}

export interface ErrorResponse {
  error: string;
  mapping_id?: string;
  detail?: string;
}

export interface TransformationResult {
  payload: BrrrPayload;
  mappingName: string;
}