import { Router, Request, Response } from 'express';

const router = Router();

// Temporary simplified version until intelligence system is properly structured
router.get('/parliament', async (req: Request, res: Response) => {
  try {
    // Simple mock response for now
    const mockDecision = {
      mind: 'PARLIAMENT',
      direction: 'REJECT',
      score: 30,
      message: 'Intelligence system initializing - fallback mode active',
      fallback: {
        message: 'OpenAI API rate limit exceeded',
        suggestion: 'The intelligent system is temporarily unavailable. Please retry in a few moments.',
        fallbackMode: 'STATIC',
        timestamp: new Date().toISOString()
      },
      ledger: []
    };
    
    res.json({ decision: mockDecision });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ledger', (req: Request, res: Response) => {
  res.json({ ledger: [] });
});

router.delete('/ledger', (req: Request, res: Response) => {
  res.json({ message: 'Ledger cleared' });
});

export default router;