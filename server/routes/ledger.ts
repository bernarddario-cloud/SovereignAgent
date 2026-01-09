import { Router } from 'express';
import { getIntentsBySession, recordIntent } from '../ledger';
import { readLedger } from '../ledger/storage';

const router = Router();

// GET /api/ledger/records - Get all intent records
router.get('/records', async (req, res) => {
  try {
    const records = await readLedger('intents.jsonl');
    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error: any) {
    console.error('Ledger records error:', error);
    res.status(500).json({ error: 'Failed to read ledger', message: error.message });
  }
});

// GET /api/ledger/session/:sessionId - Get records for a specific session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await getIntentsBySession(sessionId);
    res.json({
      success: true,
      sessionId,
      count: records.length,
      records,
    });
  } catch (error: any) {
    console.error('Session ledger error:', error);
    res.status(500).json({ error: 'Failed to read session ledger', message: error.message });
  }
});

export default router;
