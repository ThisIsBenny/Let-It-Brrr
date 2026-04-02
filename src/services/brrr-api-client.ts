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
    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.secret}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Brrr API error: ${response.status}`);
    }

    return await response.json();
  }
}
