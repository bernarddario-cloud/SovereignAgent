import { ParliamentContext, MindVote } from './types';

// Risk Mind evaluates potential risks
export function riskMind(ctx: ParliamentContext): MindVote {
  return {
    mind: 'RISK',
    direction: 'REVISE',
    score: 50,
    reasoning: 'Risk assessment pending'
  };
}

// Operations Mind evaluates operational feasibility  
export function operationsMind(ctx: ParliamentContext): MindVote {
  return {
    mind: 'OPERATIONS',
    direction: 'APPROVE',
    score: 75,
    reasoning: 'Operations approved'
  };
}

// Evidence Mind evaluates supporting evidence
export function evidenceMind(ctx: ParliamentContext): MindVote {
  return {
    mind: 'EVIDENCE',
    direction: 'APPROVE',
    score: 70,
    reasoning: 'Evidence sufficient'
  };
}

// Efficiency Mind evaluates resource efficiency
export function efficiencyMind(ctx: ParliamentContext): MindVote {
  return {
    mind: 'EFFICIENCY',
    direction: 'APPROVE',
    score: 80,
    reasoning: 'Efficient approach'
  };
}
