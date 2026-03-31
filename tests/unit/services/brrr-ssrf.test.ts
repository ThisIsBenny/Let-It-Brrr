import { assertEquals, assertThrows } from "@std/assert";
import { BrrrService } from "../../../src/services/brrr-service.ts";
import { SSRFError } from "../../../src/errors/index.ts";

Deno.test.beforeEach(() => {
  BrrrService.reset();
});

Deno.test("SSRF protection - blocks localhost", () => {
  assertThrows(
    () => BrrrService.get("https://localhost:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks 127.x (loopback)", () => {
  assertThrows(
    () => BrrrService.get("https://127.0.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks 10.x (Class A private)", () => {
  assertThrows(
    () => BrrrService.get("https://10.0.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks 172.16-31.x (Class B private)", () => {
  assertThrows(
    () => BrrrService.get("https://172.16.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks 192.168.x (Class C private)", () => {
  assertThrows(
    () => BrrrService.get("https://192.168.1.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks 169.254.x (link-local/AWS metadata)", () => {
  assertThrows(
    () =>
      BrrrService.get("https://169.254.169.254/latest/meta-data/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks metadata.google.internal", () => {
  assertThrows(
    () =>
      BrrrService.get(
        "https://metadata.google.internal/computeMetadata/v1/",
        "secret",
      ),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks metadata.internal", () => {
  assertThrows(
    () => BrrrService.get("https://metadata.internal/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks IPv6 loopback (::1)", () => {
  assertThrows(
    () => BrrrService.get("https://[::1]:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks IPv6 unique local (fc00::)", () => {
  assertThrows(
    () => BrrrService.get("https://[fc00::]:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks non-HTTPS URLs", () => {
  assertThrows(
    () => BrrrService.get("http://api.example.com/v1/", "secret"),
    SSRFError,
    "SSRF protection: Only HTTPS URLs are allowed",
  );
});

Deno.test("SSRF protection - blocks multicast (224.x)", () => {
  assertThrows(
    () => BrrrService.get("https://224.0.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks reserved (240.x)", () => {
  assertThrows(
    () => BrrrService.get("https://240.0.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - blocks current network (0.x)", () => {
  assertThrows(
    () => BrrrService.get("https://0.0.0.1:8080/", "secret"),
    SSRFError,
    "SSRF protection: Private/internal URLs are not allowed",
  );
});

Deno.test("SSRF protection - allows valid HTTPS URLs", () => {
  const service = BrrrService.get("https://api.brrr.now/v1/", "secret");
  assertEquals(service !== null, true);
});
