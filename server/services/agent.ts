import { storage } from "../storage";
import { processAgentRequest, transcribeAudio, generateSpeech } from "./openai";
import type { Session, ConsentRequest, Action } from "@shared/schema";

export interface AgentSession {
  sessionId: string;
  userId: string;
  grantedScopes: string[];
  executedTasks: any[];
  revenue: string;
}

export class SovereignAgent {
  private sessions: Map<string, AgentSession> = new Map();

  async createSession(userId: string): Promise<AgentSession> {
    const session = await storage.createSession({
      userId,
      grantedScopes: [],
      appInventory: [],
      executedTasks: [],
      sessionRevenue: "0",
      isActive: true
    });

    const agentSession: AgentSession = {
      sessionId: session.id,
      userId: session.userId,
      grantedScopes: session.grantedScopes,
      executedTasks: session.executedTasks,
      revenue: session.sessionRevenue
    };

    this.sessions.set(session.id, agentSession);
    return agentSession;
  }

  async getSession(sessionId: string): Promise<AgentSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async processVoiceInput(sessionId: string, audioBuffer: Buffer): Promise<{
    transcription: string;
    response: string;
    audioResponse: string;
    actions: any[];
    requestedScopes?: string[];
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Transcribe audio
    const { text: transcription } = await transcribeAudio(audioBuffer);
    
    // Get user for context
    const user = await storage.getUser(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Process with agent
    const agentResponse = await processAgentRequest(transcription, {
      grantedScopes: session.grantedScopes,
      sessionData: session,
      userName: user.fullName
    });

    // Generate speech response
    const { audioUrl } = await generateSpeech(agentResponse.response);

    // Handle requested scopes
    if (agentResponse.requestedScopes && agentResponse.requestedScopes.length > 0) {
      for (const scope of agentResponse.requestedScopes) {
        await storage.createConsentRequest({
          sessionId: session.sessionId,
          scope,
          status: 'pending'
        });
      }
    }

    // Execute actions
    const executedActions = [];
    for (const action of agentResponse.actions) {
      const actionRecord = await storage.createAction({
        sessionId: session.sessionId,
        tool: action.tool,
        args: action.args,
        status: 'pending'
      });

      const result = await this.executeAction(action);
      await storage.updateAction(actionRecord.id, {
        status: result.success ? 'success' : 'failed',
        result: result
      });

      executedActions.push({
        ...actionRecord,
        result
      });
    }

    // Update session
    await storage.updateSession(session.sessionId, {
      executedTasks: [...session.executedTasks, {
        timestamp: new Date(),
        input: transcription,
        response: agentResponse.response,
        actions: executedActions.length
      }]
    });

    return {
      transcription,
      response: agentResponse.response,
      audioResponse: audioUrl,
      actions: executedActions,
      requestedScopes: agentResponse.requestedScopes
    };
  }

  async processTextInput(sessionId: string, message: string): Promise<{
    response: string;
    actions: any[];
    requestedScopes?: string[];
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const agentResponse = await processAgentRequest(message, {
      grantedScopes: session.grantedScopes,
      sessionData: session,
      userName: user.fullName
    });

    // Handle requested scopes
    if (agentResponse.requestedScopes && agentResponse.requestedScopes.length > 0) {
      for (const scope of agentResponse.requestedScopes) {
        await storage.createConsentRequest({
          sessionId: session.sessionId,
          scope,
          status: 'pending'
        });
      }
    }

    return {
      response: agentResponse.response,
      actions: agentResponse.actions,
      requestedScopes: agentResponse.requestedScopes
    };
  }

  async requestConsentScope(sessionId: string, scope: string): Promise<ConsentRequest> {
    return await storage.createConsentRequest({
      sessionId,
      scope,
      status: 'pending'
    });
  }

  async handleConsentResponse(requestId: string, approved: boolean): Promise<void> {
    const request = await storage.updateConsentRequest(requestId, {
      status: approved ? 'granted' : 'denied'
    });

    if (!request) {
      throw new Error("Consent request not found");
    }

    if (approved) {
      const session = await storage.getSession(request.sessionId);
      if (session) {
        const updatedScopes = [...session.grantedScopes, request.scope];
        await storage.updateSession(request.sessionId, {
          grantedScopes: updatedScopes
        });

        // Update in-memory session
        const agentSession = this.sessions.get(request.sessionId);
        if (agentSession) {
          agentSession.grantedScopes = updatedScopes;
        }
      }
    }
  }

  async revokeConsentScope(sessionId: string, scope: string): Promise<void> {
    const session = await storage.getSession(sessionId);
    if (session) {
      const updatedScopes = session.grantedScopes.filter(s => s !== scope);
      await storage.updateSession(sessionId, {
        grantedScopes: updatedScopes
      });

      // Update in-memory session
      const agentSession = this.sessions.get(sessionId);
      if (agentSession) {
        agentSession.grantedScopes = updatedScopes;
      }
    }
  }

  private async executeAction(action: { tool: string; args: Record<string, any> }): Promise<any> {
    // Mock execution for different tool types
    switch (action.tool) {
      case 'shortcuts.run':
        return {
          success: true,
          message: `Shortcut '${action.args.shortcut_name}' executed successfully`,
          output: action.args.input || "executed"
        };
      
      case 'tasker.intent':
        return {
          success: true,
          message: `Tasker intent '${action.args.action}' sent successfully`,
          extras: action.args.extras
        };
      
      case 'webhook.reply':
        return {
          success: true,
          message: "Webhook reply sent",
          payload: action.args.payload
        };
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${action.tool}`
        };
    }
  }

  async getSessionStats(sessionId: string): Promise<{
    grantedScopes: number;
    appInventory: number;
    executedTasks: number;
    revenue: string;
    startTime: Date;
    lastAction: Date;
  }> {
    const session = await storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    return {
      grantedScopes: session.grantedScopes.length,
      appInventory: session.appInventory.length,
      executedTasks: session.executedTasks.length,
      revenue: session.sessionRevenue,
      startTime: session.startTime,
      lastAction: session.lastActionTime
    };
  }
}

export const sovereignAgent = new SovereignAgent();
