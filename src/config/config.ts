const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^224\./,
  /^240\./,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
];

const BLOCKED_IPV6_HOSTNAMES = [
  "::1",
  "[::1]",
  "fc00::",
  "[fc00::]",
  "fd00::",
  "[fd00::]",
];

const ALLOWED_SOUNDS = [
  "default",
  "system",
  "brrr",
  "bell_ringing",
  "bubble_ding",
  "bubbly_success_ding",
  "cat_meow",
  "calm1",
  "calm2",
  "cha_ching",
  "dog_barking",
  "door_bell",
  "duck_quack",
  "short_triple_blink",
  "upbeat_bells",
  "warm_soft_error",
] as const;

const ALLOWED_INTERRUPTION_LEVELS = [
  "active",
  "passive",
  "time-sensitive",
] as const;

const ALLOWED_BRRR_FIELDS = [
  "title",
  "subtitle",
  "message",
  "thread_id",
  "sound",
  "open_url",
  "image_url",
  "expiration_date",
  "filter_criteria",
  "interruption_level",
] as const;

export const config = {
  port: 8080,
  logLevel: Deno.env.get("LOG_LEVEL") || "info",
  mappingsFile: Deno.env.get("MAPPINGS_FILE") || "./config/mappings.yaml",
  brrrSecret: Deno.env.get("BRRR_SECRET") || "",
  brrrWebhookUrl: Deno.env.get("BRRR_WEBHOOK_URL") ||
    "https://api.brrr.now/v1/send",
  privateIpPatterns: PRIVATE_IP_PATTERNS,
  blockedHostnames: BLOCKED_HOSTNAMES,
  blockedIpv6Hostnames: BLOCKED_IPV6_HOSTNAMES,
  allowedSounds: ALLOWED_SOUNDS,
  allowedInterruptionLevels: ALLOWED_INTERRUPTION_LEVELS,
  allowedBrrrFields: ALLOWED_BRRR_FIELDS,
};

export function getVersion(): string {
  try {
    const version = Deno.readTextFileSync("./VERSION");
    return version.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
