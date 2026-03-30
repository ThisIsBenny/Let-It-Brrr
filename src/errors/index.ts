import { HTTPException } from "@hono/hono/http-exception";

export type ErrorResponse = {
  message: string;
  statusCode?: number;
  correlationId?: string;
};

export class BrrrApiError extends HTTPException {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(500, { message });
    this.statusCode = statusCode;
  }
}

export class SSRFError extends BrrrApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ValidationError extends BrrrApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

export function isHTTPException(error: unknown): error is HTTPException {
  return error instanceof HTTPException;
}
