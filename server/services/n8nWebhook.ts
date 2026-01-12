// server/services/n8nWebhook.ts
import crypto from "crypto";

export type N8NWebhookEvent = {
  eventType: "action.executed";
  requestId: string;
  timestamp: string;
  // core execution context
  actionName: string;
  sessionId?: string;
  actor?: {
    userId?: string;
    ip?: string;
    userAgent?: string;
  };
  // input/output
  input?: unknown;
  output?: unknown;
  // optional metadata that helps orchestration
  success: boolean;
  durationMs?: number;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  // extra labels for filtering / routing inside n8n
  tags?: string[];
};

// ──────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

/**
 * Actions that are ALLOWED to trigger the n8n webhook.
 * Add new action names here as you enable them.
 */
const ALLOWED_ACTIONS: ReadonlySet<string> = new Set([
  "createSession",
  "runTool",
  "orchestrate",
  "executePlan",
    "processTextInput",
    "processVoiceInput",
]);

/**
 * Checks whether a given action is whitelisted.
 */
export function shouldTriggerN8N(actionName: string): boolean {
  return ALLOWED_ACTIONS.has(actionName);
}

/**
 * Default allow-list check (exported for use in routes).
 */
export function isActionAllowed(actionName: string): boolean {
  const defaultAllow = new Set([
    "createSession",
    "runTool",
    "orchestrate",
    "executePlan",
  ]);
  return defaultAllow.has(actionName);
}

/**
 * Creates a stable requestId for tracing.
 */
export function makeRequestId(prefix = "req"): string {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

// ──────────────────────────────────────────────────────────────────
// Posting to n8n
// ──────────────────────────────────────────────────────────────────

/**
 * Posts an event to the n8n webhook.
 * Fire-and-forget by default; logs errors but doesn't throw.
 */
export async function postToN8N(
  event: N8NWebhookEvent
): Promise<{ ok: boolean; status?: number; requestId: string }> {
  if (!N8N_WEBHOOK_URL) {
    console.warn("[n8n] N8N_WEBHOOK_URL not configured; skipping webhook.");
    return { ok: false, requestId: event.requestId };
  }

  if (!shouldTriggerN8N(event.actionName)) {
    console.log(
      `[n8n] Action "${event.actionName}" is not in the allow-list; skipping.`
    );
    return { ok: false, requestId: event.requestId };
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error(
        `[n8n] Webhook returned ${response.status}: ${await response.text()}`
      );
    }
    return { ok: response.ok, status: response.status, requestId: event.requestId };
  } catch (err) {
    console.error("[n8n] Webhook call failed:", err);
    return { ok: false, requestId: event.requestId };
  }
}
