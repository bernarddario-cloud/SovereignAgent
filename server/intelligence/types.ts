// File: server/intelligence/types.ts

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type MindId =
  | "COMPLIANCE"
  | "RISK"
  | "OPERATIONS"
  | "EVIDENCE"
  | "EFFICIENCY"
  | "GOVERNANCE";

export type VoteDirection = "APPROVE" | "REVISE" | "REJECT";

export type RiskTag =
  | "SAFETY"
  | "LEGAL"
  | "PRIVACY"
  | "SECURITY"
  | "FINANCIAL"
  | "REPUTATION"
  | "OPERATIONAL";

export type SignalTag =
  | "MISSING_INFO"
  | "CONTRADICTION"
  | "HIGH_IMPACT"
  | "REVERSIBLE"
  | "IRREVERSIBLE"
  | "TIME_SENSITIVE"
  | "USER_CONFIRMATION_REQUIRED";

export type IntentType =
  | "INFO_REQUEST"
  | "PLAN_REQUEST"
  | "DECISION_REQUEST"
  | "EXECUTION_REQUEST"
  | "STATUS_REQUEST"
  | "DEBUG_REQUEST"
  | "GOVERNANCE_REQUEST"
  | "UNKNOWN";

export interface FallbackContext {
  sessionId?: string;
  requestId: string;
  nowIso: string;
  userText: string;
  metadata?: Record<string, unknown>;
}

export interface MindVote {
  mind: MindId;
  direction: VoteDirection;
  score: number; // 0..100
  risk: number; // 0..100
  riskTags: RiskTag[];
  signals: SignalTag[];
  reasons: string[];
  requiredNextSteps: string[];
  evidence: string[];
}

export interface ParliamentAggregate {
  finalDirection: VoteDirection;
  finalScore: number; // 0..100
  finalRisk: number; // 0..100
  confidence: ConfidenceLevel;
  consensus: {
    approvals: number;
    revises: number;
    rejects: number;
    total: number;
    agreementPct: number; // 0..100
    margin: number; // difference between top and second bucket
  };
  topReasons: string[];
  requiredNextSteps: string[];
  riskTags: RiskTag[];
  signals: SignalTag[];
}

export interface AuditRecord {
  version: string; // bump when schema changes
  mode: "FALLBACK_PARLIAMENT";
  sessionId?: string;
  requestId: string;
  createdAt: string;
  input: {
    userText: string;
    intent: IntentType;
    extracted: {
      entities: string[];
      constraints: string[];
      questions: string[];
    };
    metadata?: Record<string, unknown>;
  };
  minds: MindVote[];
  aggregate: ParliamentAggregate;
  output: {
    userMessage: string;
    structured: {
      decision: VoteDirection;
      confidence: ConfidenceLevel;
      score: number;
      risk: number;
      nextSteps: string[];
      flags: {
        riskTags: RiskTag[];
        signals: SignalTag[];
      };
    };
  };
}