import { MindVote, FailureContext } from '../types';
import { clamp } from '../utils';

export function evidenceMind(ctx: FailureContext): MindVote {
  const { intent, votes, reasons } = ctx;
  let score = 50;
  const signals: string[] = [];

  if (reasons.some(r => r.includes('400') || r.includes('invalid'))) {
    signals.push('CLIENT_ERROR: Bad request format');
    score = Math.min(score, 20);
  }

  if (reasons.some(r => r.includes('401') || r.includes('403'))) {
    signals.push('AUTH_ERROR: Credential issue');
    score = Math.min(score, 10);
  }

  const direction = score >= 70 ? 'APPROVE' : score >= 40 ? 'REJECT' : 'REVISE';
  return { mind: 'EVIDENCE', direction, score: clamp(score), signals };
}