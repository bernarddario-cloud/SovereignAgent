export interface IntentRecord {
  id: string;
  timestamp: string;
  sessionId: string;
  intentType: string;
  userMessage: string;
  parliamentDecision?: {
    direction: string;
    confidence: number;
    votes: any[];
  };
  llmResponse?: string;
  error?: string;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  eventType: 'startup' | 'shutdown' | 'error' | 'config_change';
  details: Record<string, any>;
}

export interface RedactionLog {
  id: string;
  timestamp: string;
  recordId: string;
  reason: string;
  redactedBy: string;
}
