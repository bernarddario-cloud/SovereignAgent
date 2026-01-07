// File: server/intelligence/minds/compliance.ts

import type { FallbackContext, MindVote } from "../types";
import { clamp, includesAny, normalizeText } from "../utils";

export function complianceMind(ctx: FallbackContext): MindVote {
  const t = normalizeText(ctx.userText).toLowerCase();
  const riskTags: MindVote["riskTags"] = [];
  const signals: MindVote["signals"] = [];
  const reasons: string[] = [];
  const evidence: string[] = [];
  const requiredNextSteps: string[] = [];
  let risk = 20;
  let score = 70;
  if (includesAny(t, ["api key", "secret", "token", "password"])) {
    riskTags.push("SECURITY", "PRIVACY");
    signals.push("USER_CONFIRMATION_REQUIRED");
    risk += 25; score -= 25;
    reasons.push("Sensitive credential handling detected; must avoid logging or echoing secrets.");
    requiredNextSteps.push("Ensure secrets are never returned in responses or logs; redact before persistence.");
  }
  if (includesAny(t, ["lawsuit", "sue", "criminal", "fraud", "tax evasion"])) {
    riskTags.push("LEGAL", "REPUTATION"); risk += 20; score -= 15;
    reasons.push("Potential legal-sensitive domain; ensure guidance stays informational and non-illicit.");
    requiredNextSteps.push("Add policy guardrails for legal/regulated requests; route to safe templates.");
  }
  if (includesAny(t, ["delete logs", "hide", "cover up"])) {
    riskTags.push("LEGAL", "REPUTATION"); signals.push("HIGH_IMPACT"); risk += 30; score -= 30;
    reasons.push("Request implies concealment; must not assist wrongdoing.");
    requiredNextSteps.push("Refuse concealment requests; provide compliant alternatives (retention policy, redaction).");
  }
  if (includesAny(t, ["production", "deploy", "render", "health"])) {
    evidence.push("Mentions production/deployment context; apply operational compliance (env vars, secrets, logs).");
    reasons.push("Operational deployment context detected; ensure safe defaults and auditability.");
    requiredNextSteps.push("Confirm health endpoints do not expose sensitive info; ensure rate limits.");
  }
  let direction: MindVote["direction"] = "APPROVE";
  if (risk >= 70) direction = "REJECT";
  else if (risk >= 40) direction = "REVISE";
  return { mind: "COMPLIANCE", direction, score: clamp(score), risk: clamp(risk), riskTags, signals, reasons, requiredNextSteps, evidence };
}