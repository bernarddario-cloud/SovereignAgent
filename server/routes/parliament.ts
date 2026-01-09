import { Router } from 'express';
import { runParliament } from '../intelligence/parliament';
import { classifyIntent } from '../intelligence/intent';

const router = Router();

// POST /api/parliament/evaluate - Test parliament decision-making
router.post('/evaluate', async (req, res) => {
  try {
    const { userMessage, sessionId } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const intentType = classifyIntent(userMessage);
    
    const context = {
      userMessage,
      sessionId: sessionId || 'test-session',
      intentType,
      constraints: [],
      questions: [],
    };

    const decision = runParliament(context);

    res.json({
      success: true,
      decision,
      context: {
        intentType,
        userMessage,
      },
    });
  } catch (error: any) {
    console.error('Parliament evaluation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
