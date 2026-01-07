// File: server/intelligence/utils.ts

import crypto from "node:crypto";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function stableHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function shortId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[""]/g, '"').replace(/['']/g, "'").trim();
}

export function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}