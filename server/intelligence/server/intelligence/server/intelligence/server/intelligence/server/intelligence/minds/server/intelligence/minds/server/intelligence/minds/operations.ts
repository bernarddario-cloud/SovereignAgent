import { MindVote, FailureContext } from '../types';
import { clamp } from '../utils';

export function operationsMind(ctx: FailureContext): MindVote {
  const { intent, votes, reasons } = ctx;
  let score = 50;
  const evidence: string[] = [];

  if (reasons.some(r => r.includes('Rate limit') || r.includes('quota'))) {
    evidence.push('API throttling detected; operational constraint');
    score = Math.min(score, 30);
  }

  if (reasons.some(r => r.includes('maintenance') || r.includes('unavailable'))) {
    evidence.push('Service maintenance window');
    score = Math.min(score, 20);
  }

  const direction = score >= 70 ? 'APPROVE' : score >= 40 ? 'REJECT' : 'REVISE';
  return { mind: 'OPERATIONS', direction, score: clamp(score), evidence };
}