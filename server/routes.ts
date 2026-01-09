import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { sovereignAgent } from "./services/agent";
import { tokenVault } from "./services/tokenVault";
import { ledger } from "./services/ledger";
import { 
  agentRequestSchema, 
  consentResponseSchema,
  insertActionSchema,
  consentPreviewSchema,
  executeActionSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import parliamentRoutes from './routes/parliament';
import ledgerRoutes from './routes/ledger';

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections by session ID
  const wsConnections = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      wsConnections.set(sessionId, ws);
      
      ws.on('close', () => {
        wsConnections.delete(sessionId);
      });
      
      ws.send(JSON.stringify({ type: 'connected', sessionId }));
    }
  });

  // Helper function to broadcast to session
  const broadcastToSession = (sessionId: string, data: any) => {
    const ws = wsConnections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };


    // Health check endpoint for Render
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

    // Mount parliament and ledger routes
  app.use('/api/parliament', parliamentRoutes);
  app.use('/api/ledger', ledgerRoutes);

  // Initialize session
  app.post('/api/sessions', async (req, res) => {
    try {
      // Get or create default user
      let user = await storage.getUserByUsername('eldario');
      if (!user) {
        user = await storage.createUser({
          username: 'eldario',
          password: 'sovereign',
          fullName: 'El Dario Stephon Bernard Bey'
        });
      }

      // Check for existing active session
      let session = await storage.getActiveSessionByUserId(user.id);
      if (!session) {
        // Create new agent session
        const agentSession = await sovereignAgent.createSession(user.id);
        session = await storage.getSession(agentSession.sessionId);
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session details
  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Process voice input
  app.post('/api/sessions/:id/voice', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const result = await sovereignAgent.processVoiceInput(
        req.params.id, 
        req.file.buffer
      );

      // Broadcast update to WebSocket clients
      broadcastToSession(req.params.id, {
        type: 'voice_processed',
        data: result
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Process text input
  app.post('/api/sessions/:id/chat', async (req, res) => {
    try {
      const { message } = agentRequestSchema.parse(req.body);
      
      const result = await sovereignAgent.processTextInput(req.params.id, message);

      // Broadcast update to WebSocket clients
      broadcastToSession(req.params.id, {
        type: 'chat_processed',
        data: result
      });

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get consent requests for session
  app.get('/api/sessions/:id/consent', async (req, res) => {
    try {
      const requests = await storage.getConsentRequestsBySessionId(req.params.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Respond to consent request
  app.post('/api/consent/:requestId', async (req, res) => {
    try {
      const { approved } = consentResponseSchema.parse(req.body);
      
      await sovereignAgent.handleConsentResponse(req.params.requestId, approved);
      
      const request = await storage.getConsentRequest(req.params.requestId);
      if (request) {
        broadcastToSession(request.sessionId, {
          type: 'consent_updated',
          data: { requestId: req.params.requestId, approved }
        });
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke consent scope
  app.delete('/api/sessions/:id/consent/:scope', async (req, res) => {
    try {
      await sovereignAgent.revokeConsentScope(req.params.id, req.params.scope);
      
      broadcastToSession(req.params.id, {
        type: 'scope_revoked',
        data: { scope: req.params.scope }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get financial opportunities
  app.get('/api/opportunities', async (req, res) => {
    try {
      const opportunities = await storage.getAllActiveOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute opportunity
  app.post('/api/sessions/:id/opportunities/:opportunityId/execute', async (req, res) => {
    try {
      const opportunity = await storage.getOpportunity(req.params.opportunityId);
      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      // Create action for opportunity execution
      const action = await storage.createAction({
        sessionId: req.params.id,
        tool: 'opportunity.execute',
        args: { opportunityId: req.params.opportunityId },
        status: 'success'
      });

      broadcastToSession(req.params.id, {
        type: 'opportunity_executed',
        data: { opportunity, action }
      });

      res.json({ success: true, action });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session actions
  app.get('/api/sessions/:id/actions', async (req, res) => {
    try {
      const actions = await storage.getActionsBySessionId(req.params.id);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute custom action
  app.post('/api/sessions/:id/actions', async (req, res) => {
    try {
      const actionData = insertActionSchema.parse({
        ...req.body,
        sessionId: req.params.id
      });

      const action = await storage.createAction(actionData);
      
      // Update action as executed (mock)
      await storage.updateAction(action.id, {
        status: 'success',
        result: { success: true, message: 'Action executed successfully' }
      });

      const updatedAction = await storage.getAction(action.id);

      broadcastToSession(req.params.id, {
        type: 'action_executed',
        data: updatedAction
      });

      res.json(updatedAction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get session statistics
  app.get('/api/sessions/:id/stats', async (req, res) => {
    try {
      const stats = await sovereignAgent.getSessionStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // End session
  app.post('/api/sessions/:id/end', async (req, res) => {
    try {
      await storage.updateSession(req.params.id, { isActive: false });
      
      broadcastToSession(req.params.id, {
        type: 'session_ended',
        data: { sessionId: req.params.id }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook endpoints for mobile integration
  app.post('/api/webhooks/shortcuts', async (req, res) => {
    try {
      const { sessionId, shortcut_name, input, result } = req.body;
      
      if (sessionId) {
        broadcastToSession(sessionId, {
          type: 'shortcut_result',
          data: { shortcut_name, input, result }
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/webhooks/tasker', async (req, res) => {
    try {
      const { sessionId, action, extras, result } = req.body;
      
      if (sessionId) {
        broadcastToSession(sessionId, {
          type: 'tasker_result',
          data: { action, extras, result }
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // OAuth Callback Endpoint
  app.post('/api/auth/oauth/callback', async (req, res) => {
    try {
      const { provider, code, userId } = req.body;

      if (!provider || !code || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await ledger.logAction(
        userId,
        'oauth.callback',
        'api',
        'confirmed',
        { provider, code: '[REDACTED]' },
        { success: true }
      );

      res.json({ success: true, provider });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Consent Preview (Dry Run)
  app.post('/api/agent/consent', async (req, res) => {
    try {
      const { action, scope, parameters, dryRun } = consentPreviewSchema.parse(req.body);
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const dryRunResult = {
        action,
        scope,
        parameters,
        estimatedImpact: 'Preview of operation',
        reversible: true,
        riskLevel: 'low'
      };

      const consentRequest = await storage.createConsentRequest({
        sessionId,
        action,
        scope,
        parameters,
        dryRun,
        dryRunResult,
        status: 'pending'
      });

      await ledger.logAction(
        session.userId,
        `consent.request.${action}`,
        'api',
        'sent',
        { scope, parameters, dryRun },
        { consentRequestId: consentRequest.id }
      );

      broadcastToSession(sessionId, {
        type: 'consent_required',
        data: consentRequest
      });

      res.json(consentRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Execute Action After Consent
  app.post('/api/agent/execute', async (req, res) => {
    try {
      const { consentRequestId, confirm } = executeActionSchema.parse(req.body);

      const consentRequest = await storage.getConsentRequest(consentRequestId);
      if (!consentRequest) {
        return res.status(404).json({ error: 'Consent request not found' });
      }

      const session = await storage.getSession(consentRequest.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!confirm) {
        await storage.updateConsentRequest(consentRequestId, { status: 'denied' });
        await ledger.logAction(
          session.userId,
          `action.denied.${consentRequest.action}`,
          'api',
          'confirmed',
          { consentRequestId },
          { denied: true }
        );
        return res.json({ success: false, message: 'Action denied' });
      }

      await storage.updateConsentRequest(consentRequestId, { status: 'granted' });

      const executionResult = {
        success: true,
        executedAt: new Date(),
        action: consentRequest.action,
        parameters: consentRequest.parameters
      };

      await ledger.logAction(
        session.userId,
        consentRequest.action,
        'api',
        'confirmed',
        consentRequest.parameters,
        executionResult
      );

      const updatedSession = await storage.updateSession(session.id, {
        grantedScopes: [...(session.grantedScopes || []), consentRequest.scope]
      });

      broadcastToSession(session.id, {
        type: 'action_executed',
        data: executionResult
      });

      res.json(executionResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Ledger
  app.get('/api/ledger', async (req, res) => {
    try {
      const { userId, limit } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const entries = await ledger.getLedger(
        userId as string,
        limit ? parseInt(limit as string) : 50
      );

      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export Ledger
  app.get('/api/ledger/export', async (req, res) => {
    try {
      const { userId, format } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const exportData = await ledger.exportLedger(
        userId as string,
        (format as 'json' | 'csv') || 'json'
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ledger.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(exportData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Connected Accounts (Token Status)
  app.get('/api/auth/accounts', async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const accounts = await tokenVault.getAllUserTokens(userId as string);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke Token
  app.delete('/api/auth/accounts/:provider', async (req, res) => {
    try {
      const { userId } = req.query;
      const { provider } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const success = await tokenVault.revokeToken(userId as string, provider);

      if (success) {
        await ledger.logAction(
          userId as string,
          'token.revoke',
          'api',
          'confirmed',
          { provider },
          { success: true }
        );
      }

      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
