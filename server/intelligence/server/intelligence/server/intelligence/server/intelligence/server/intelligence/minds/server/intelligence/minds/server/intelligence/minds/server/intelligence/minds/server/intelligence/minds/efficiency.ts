import { MindVote, FailureContext } from '../types';
import { clamp } from '../utils';

export function efficiencyMind(ctx: FailureContext): MindVote {
  const { intent, votes, reasons } = ctx;
  let score = 50;
  const signals: string[] = [];

  if (intent === 'APPROVE' && votes.flatMap(v => v.riskTags || []).includes('RETRY')) {
    signals.push('EFFICIENCY: Quick retry acceptable');
    score = Math.max(score, 60);
  }

  if (reasons.length > 3) {
    signals.push('INEFFICIENT: Too many accumulated failures');
    score = Math.min(score, 30);
  }

  const direction = score >= 70 ? 'APPROVE' : score >= 40 ? 'REJECT' : 'REVISE';
  return { mind: 'EFFICIENCY', direction, score: clamp(score), signals };
}