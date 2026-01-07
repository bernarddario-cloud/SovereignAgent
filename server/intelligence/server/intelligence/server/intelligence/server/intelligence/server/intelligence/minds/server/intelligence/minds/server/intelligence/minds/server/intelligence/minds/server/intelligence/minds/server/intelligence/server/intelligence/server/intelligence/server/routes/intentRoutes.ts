import { Router, Request, Response } from 'express';
import { parseIntent, MindVote as Intent } from '../intelligence/intent';
import { runParliament } from '../intelligence/parliament';
import { recordFailure, getLedger, clearLedger } from '../intelligence/ledger';
import { generateFallback } from '../intelligence/fallback';
import { FailureContext } from '../intelligence/types';

const router = Router();

router.get('/parliament', async (req: Request, res: Response) => {
  try {
    const reasons = ['Rate limit exceeded', 'Quota insufficient'];
    const intent = parseIntent('APPROVE');
    
    const ctx: FailureContext = {
      intent: intent.direction,
      reasons,
      votes: []
    };

    const decision = runParliament(ctx);
    
    recordFailure({
      timestamp: new Date().toISOString(),
      intent: ctx.intent,
      reasons: ctx.reasons,
      decision: decision.direction,
      score: decision.score
    });

    if (decision.direction === 'REJECT') {
      const fallback = generateFallback(ctx.intent, ctx.reasons);
      return res.json({ decision, fallback, ledger: getLedger() });
    }

    res.json({ decision, ledger: getLedger() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ledger', (req: Request, res: Response) => {
  res.json({ ledger: getLedger() });
});

router.delete('/ledger', (req: Request, res: Response) => {
  clearLedger();
  res.json({ message: 'Ledger cleared' });
});

export default router;