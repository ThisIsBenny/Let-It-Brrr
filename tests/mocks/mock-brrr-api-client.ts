import type { BrrrPayload } from "../../src/types/index.ts";
import type {
  BrrrResponse,
  IBrrrApiClient,
} from "../../src/services/brrr-api-client.ts";

export class MockBrrrApiClient implements IBrrrApiClient {
  private shouldFail = false;
  private failureMessage = "Mock error";
  private lastPayload: BrrrPayload | null = null;

  static success(): MockBrrrApiClient {
    return new MockBrrrApiClient();
  }

  static failure(message = "Mock error"): MockBrrrApiClient {
    return new MockBrrrApiClient(true, message);
  }

  private constructor(shouldFail = false, failureMessage = "Mock error") {
    this.shouldFail = shouldFail;
    this.failureMessage = failureMessage;
  }

  post(payload: BrrrPayload): Promise<BrrrResponse> {
    this.lastPayload = payload;

    if (this.shouldFail) {
      return Promise.reject(new Error(this.failureMessage));
    }

    return Promise.resolve({
      success: true,
      id: `mock-${Date.now()}`,
    });
  }

  getLastPayload(): BrrrPayload | null {
    return this.lastPayload;
  }

  reset(): void {
    this.lastPayload = null;
  }
}
