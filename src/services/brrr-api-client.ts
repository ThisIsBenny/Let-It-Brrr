import type { BrrrPayload } from "../types/index.ts";

export interface BrrrResponse {
  success: boolean;
  id?: string;
}

export interface IBrrrApiClient {
  post(payload: BrrrPayload): Promise<BrrrResponse>;
}

export class BrrrApiClient implements IBrrrApiClient {
  constructor(
    private secret: string,
    private webhookUrl: string,
  ) {}

  async post(payload: BrrrPayload): Promise<BrrrResponse> {
    const fullUrl = `${this.webhookUrl}${this.secret}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Brrr API error: ${response.status}`);
    }

    return await response.json();
  }
}
