import { assertEquals, assertInstanceOf } from "@std/assert";
import { BrrrClient, BrrrApiError } from "../../../src/services/brrr.ts";
import type { MappingConfig } from "../../../src/types/index.ts";

const createMapping = (): MappingConfig => ({ brrr_fields: [] });

Deno.test("SSRF protection - blocks localhost", async () => {
  const client = new BrrrClient("test-secret", "https://localhost:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks 127.x (loopback)", async () => {
  const client = new BrrrClient("test-secret", "https://127.0.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks 10.x (Class A private)", async () => {
  const client = new BrrrClient("test-secret", "https://10.0.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks 172.16-31.x (Class B private)", async () => {
  const client = new BrrrClient("test-secret", "https://172.16.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks 192.168.x (Class C private)", async () => {
  const client = new BrrrClient("test-secret", "https://192.168.1.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks 169.254.x (link-local/AWS metadata)", async () => {
  const client = new BrrrClient("test-secret", "https://169.254.169.254/latest/meta-data/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks metadata.google.internal", async () => {
  const client = new BrrrClient("test-secret", "https://metadata.google.internal/computeMetadata/v1/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks metadata.internal", async () => {
  const client = new BrrrClient("test-secret", "https://metadata.internal/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks IPv6 loopback (::1)", async () => {
  const client = new BrrrClient("test-secret", "https://[::1]:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks IPv6 unique local (fc00::)", async () => {
  const client = new BrrrClient("test-secret", "https://[fc00::]:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks non-HTTPS URLs", async () => {
  const client = new BrrrClient("test-secret", "http://api.example.com/v1/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Only HTTPS URLs are allowed");
  }
});

Deno.test("SSRF protection - allows valid HTTPS URLs", async () => {
  const client = new BrrrClient("test-secret", "https://api.brrr.now/v1/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message.includes("SSRF protection"), false);
  }
});

Deno.test("SSRF protection - blocks multicast (224.x)", async () => {
  const client = new BrrrClient("test-secret", "https://224.0.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks reserved (240.x)", async () => {
  const client = new BrrrClient("test-secret", "https://240.0.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});

Deno.test("SSRF protection - blocks current network (0.x)", async () => {
  const client = new BrrrClient("test-secret", "https://0.0.0.1:8080/");
  
  try {
    await client.sendNotification(createMapping(), { message: "test" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertInstanceOf(error, BrrrApiError);
    assertEquals((error as BrrrApiError).message, "SSRF protection: Private/internal URLs are not allowed");
  }
});