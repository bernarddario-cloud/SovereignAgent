// File: server/intelligence/intent.ts

import { includesAny, normalizeText, uniq } from "./utils";
import type { IntentType } from "./types";

export function classifyIntent(userTextRaw: string): IntentType {
  const t = normalizeText(userTextRaw).toLowerCase();
  if (includesAny(t, ["vote", "parliament", "governance", "consensus", "multi-mind"])) {
    return "GOVERNANCE_REQUEST";
  }
  if (includesAny(t, ["error", "stack", "bug", "500", "debug", "fix", "broken"])) {
    return "DEBUG_REQUEST";
  }
  if (includesAny(t, ["status", "health", "live", "deployment", "render", "is it up"])) {
    return "STATUS_REQUEST";
  }
  if (includesAny(t, ["should i", "what should", "decide", "best course", "recommend"])) {
    return "DECISION_REQUEST";
  }
  if (includesAny(t, ["plan", "roadmap", "steps", "workflow", "sequence"])) {
    return "PLAN_REQUEST";
  }
  if (includesAny(t, ["do this", "execute", "implement", "build", "ship"])) {
    return "EXECUTION_REQUEST";
  }
  if (t.length > 0) return "INFO_REQUEST";
  return "UNKNOWN";
}

export function extractSignals(userTextRaw: string): {
  entities: string[];
  constraints: string[];
  questions: string[];
} {
  const t = normalizeText(userTextRaw);
  const questions = (t.match(/[^.?!]*\?/g) || []).map((q) => q.trim());
  const constraintWords = ["must", "only", "exact", "no", "without", "include", "exclude", "never", "always"];
  const constraints: string[] = [];
  for (const w of constraintWords) {
    const re = new RegExp(`\\b${w}\\b[^.?!]{0,120}`, "gi");
    const matches = t.match(re) || [];
    for (const m of matches) constraints.push(m.trim());
  }
  const urls = t.match(/https?:\/\/[^\s)]+/g) || [];
  const caps = t.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) || [];
  const entities = uniq([...urls, ...caps]).slice(0, 25);
  return {
    entities,
    constraints: uniq(constraints).slice(0, 25),
    questions: uniq(questions).slice(0, 10),
  };
}