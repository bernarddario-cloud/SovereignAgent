import { MindVote, FailureContext } from '../types';
import { clamp } from '../utils';

export function riskMind(ctx: FailureContext): MindVote {
  const { intent, votes, reasons } = ctx;
  let score = 50;
  const riskTags: string[] = [];
  const signals: string[] = [];

  if (intent === 'REVISE') {
    riskTags.push('BLOCKED', 'CRITICAL');
    signals.push('HIGH_RISK: Re-attempting same failed request');
    reasons.push('Risk detected: repeating failure; may cause loop');
    score = Math.min(score, 10);
  }

  if (reasons.some(r => r.includes('timeout') || r.includes('network'))) {
    riskTags.push('TRANSIENT', 'RETRY');
    signals.push('MODERATE_RISK: Network issues are transient');
    score = Math.max(score, 40);
  }

  const direction = score >= 70 ? 'APPROVE' : score >= 40 ? 'REJECT' : 'REVISE';
  return { mind: 'RISK', direction, score: clamp(score), riskTags, signals };
}