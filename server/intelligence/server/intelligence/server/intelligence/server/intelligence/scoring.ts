// File: server/intelligence/scoring.ts

import { clamp, uniq } from "./utils";
import type { ConfidenceLevel, MindVote, ParliamentAggregate, RiskTag, SignalTag, VoteDirection } from "./types";

function bucketCounts(votes: MindVote[]): { approvals: number; revises: number; rejects: number; total: number } {
  let approvals = 0, revises = 0, rejects = 0;
  for (const v of votes) {
    if (v.direction === "APPROVE") approvals++;
    else if (v.direction === "REVISE") revises++;
    else rejects++;
  }
  return { approvals, revises, rejects, total: votes.length };
}

function computeAgreementPct(counts: { approvals: number; revises: number; rejects: number; total: number }): number {
  const top = Math.max(counts.approvals, counts.revises, counts.rejects);
  return counts.total === 0 ? 0 : Math.round((top / counts.total) * 100);
}

function computeMargin(counts: { approvals: number; revises: number; rejects: number }): number {
  const arr = [counts.approvals, counts.revises, counts.rejects].sort((a, b) => b - a);
  return arr[0] - arr[1];
}

function decideDirection(counts: { approvals: number; revises: number; rejects: number }): VoteDirection {
  const max = Math.max(counts.approvals, counts.revises, counts.rejects);
  const tied: VoteDirection[] = [];
  if (counts.revises === max) tied.push("REVISE");
  if (counts.rejects === max) tied.push("REJECT");
  if (counts.approvals === max) tied.push("APPROVE");
  return tied[0];
}

function confidenceFrom(votes: MindVote[], agreementPct: number, margin: number, finalRisk: number): ConfidenceLevel {
  if (votes.length < 3) return "LOW";
  if (agreementPct >= 80 && margin >= 2 && finalRisk <= 35) return "HIGH";
  if (agreementPct >= 60 && margin >= 1 && finalRisk <= 60) return "MEDIUM";
  return "LOW";
}

export function aggregateVotes(votes: MindVote[]): ParliamentAggregate {
  const counts = bucketCounts(votes);
  const agreementPct = computeAgreementPct(counts);
  const margin = computeMargin(counts);
  const finalDirection = decideDirection(counts);
  const meanScore = votes.length ? votes.reduce((a, v) => a + v.score, 0) / votes.length : 0;
  const meanRisk = votes.length ? votes.reduce((a, v) => a + v.risk, 0) / votes.length : 0;
  const dissentPct = 100 - agreementPct;
  const riskPenalty = meanRisk * 0.55;
  const dissentPenalty = dissentPct * 0.35;
  let finalScore = clamp(Math.round(meanScore - riskPenalty - dissentPenalty));
  let finalRisk = clamp(Math.round(meanRisk));
  if (finalDirection === "REJECT") finalScore = Math.min(finalScore, 25);
  if (finalDirection === "REVISE") finalScore = Math.min(finalScore, 65);
  const confidence = confidenceFrom(votes, agreementPct, margin, finalRisk);
  const topReasons = votes.flatMap((v) => v.reasons.map((r) => ({ mind: v.mind, r }))).slice(0, 40).map((x) => `${x.mind}: ${x.r}`);
  const requiredNextSteps = uniq(votes.flatMap((v) => v.requiredNextSteps)).slice(0, 20);
  const riskTags = uniq(votes.flatMap((v) => v.riskTags)) as RiskTag[];
  const signals = uniq(votes.flatMap((v) => v.signals)) as SignalTag[];
  return { finalDirection, finalScore, finalRisk, confidence, consensus: { approvals: counts.approvals, revises: counts.revises, rejects: counts.rejects, total: counts.total, agreementPct, margin }, topReasons: topReasons.slice(0, 12), requiredNextSteps, riskTags, signals };
}