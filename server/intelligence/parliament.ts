import { riskMind, operationsMind, evidenceMind, efficiencyMind } from './minds';
import { ParliamentContext, ParliamentDecision, MindVote } from './types';

export function runParliament(ctx: ParliamentContext): ParliamentDecision {
  const votes: MindVote[] = [
    riskMind(ctx),
    operationsMind(ctx),
    evidenceMind(ctx),
    efficiencyMind(ctx)
  ];

  ctx.votes = votes;

  const avgScore = votes.reduce((sum, v) => sum + v.score, 0) / votes.length;
  const approves = votes.filter(v => v.direction === 'APPROVE').length;
  const rejects = votes.filter(v => v.direction === 'REJECT').length;

  let finalDirection: 'APPROVE' | 'REJECT' | 'REVISE' = 'REJECT';
  if (approves > rejects) finalDirection = 'APPROVE';
  else if (rejects > approves) finalDirection = 'REJECT';
  else finalDirection = 'REVISE';

  return { mind: 'PARLIAMENT', direction: finalDirection, score: Math.round(avgScore) }
}
