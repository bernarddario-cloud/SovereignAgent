import { 
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type ConsentRequest,
  type InsertConsentRequest,
  type Opportunity,
  type InsertOpportunity,
  type Action,
  type InsertAction,
  type Token,
  type InsertToken,
  type LedgerEntry,
  type InsertLedgerEntry
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  getActiveSessionByUserId(userId: string): Promise<Session | undefined>;

  // Consent Requests
  getConsentRequest(id: string): Promise<ConsentRequest | undefined>;
  createConsentRequest(request: InsertConsentRequest): Promise<ConsentRequest>;
  updateConsentRequest(id: string, updates: Partial<ConsentRequest>): Promise<ConsentRequest | undefined>;
  getConsentRequestsBySessionId(sessionId: string): Promise<ConsentRequest[]>;
  getPendingConsentRequests(sessionId: string): Promise<ConsentRequest[]>;

  // Opportunities
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getAllActiveOpportunities(): Promise<Opportunity[]>;
  getOpportunitiesByCategory(category: 'safe' | 'balanced' | 'aggressive'): Promise<Opportunity[]>;

  // Actions
  getAction(id: string): Promise<Action | undefined>;
  createAction(action: InsertAction): Promise<Action>;
  updateAction(id: string, updates: Partial<Action>): Promise<Action | undefined>;
  getActionsBySessionId(sessionId: string): Promise<Action[]>;

  // Tokens
  getToken(id: string): Promise<Token | undefined>;
  getTokenByUserAndProvider(userId: string, provider: string): Promise<Token | undefined>;
  getTokensByUserId(userId: string): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: string, updates: Partial<Token>): Promise<Token>;
  deleteToken(id: string): Promise<boolean>;

  // Ledger Entries
  getLedgerEntry(id: string): Promise<LedgerEntry | undefined>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  getLedgerEntriesByUserId(userId: string, limit?: number): Promise<LedgerEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private consentRequests: Map<string, ConsentRequest>;
  private opportunities: Map<string, Opportunity>;
  private actions: Map<string, Action>;
  private tokens: Map<string, Token>;
  private ledgerEntries: Map<string, LedgerEntry>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.consentRequests = new Map();
    this.opportunities = new Map();
    this.actions = new Map();
    this.tokens = new Map();
    this.ledgerEntries = new Map();

    // Initialize with default user and opportunities
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default user
    const defaultUser = await this.createUser({
      username: "eldario",
      password: "sovereign",
      fullName: "El Dario Stephon Bernard Bey"
    });

    // Create default opportunities
    await this.createOpportunity({
      title: "Affiliate Quick Win",
      description: "Promote existing partnerships through automated email sequences",
      category: "safe",
      roiRange: "$500-2K ROI",
      timeEstimate: "2-4 hours",
      riskLevel: "Low risk",
      requiredScopes: ["email.send", "contacts.read"],
      isActive: true
    });

    await this.createOpportunity({
      title: "Digital Course Launch",
      description: "Create micro-course from existing expertise, automate delivery",
      category: "balanced",
      roiRange: "$2K-8K ROI",
      timeEstimate: "1-2 weeks",
      riskLevel: "Medium risk",
      requiredScopes: ["files.create", "payment.process", "calendar.write"],
      isActive: true
    });

    await this.createOpportunity({
      title: "AI SaaS Tool",
      description: "Develop niche AI tool, implement subscription model with API monetization",
      category: "aggressive",
      roiRange: "$10K+ ROI",
      timeEstimate: "2-3 months",
      riskLevel: "High risk",
      requiredScopes: ["bank.transfer", "api.create", "domain.manage"],
      isActive: true
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const session: Session = {
      ...insertSession,
      id,
      startTime: now,
      lastActionTime: now,
      grantedScopes: insertSession.grantedScopes || [],
      appInventory: insertSession.appInventory || [],
      executedTasks: insertSession.executedTasks || [],
      sessionRevenue: insertSession.sessionRevenue || "0",
      isActive: true
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, lastActionTime: new Date() };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getActiveSessionByUserId(userId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.userId === userId && session.isActive,
    );
  }

  // Consent Requests
  async getConsentRequest(id: string): Promise<ConsentRequest | undefined> {
    return this.consentRequests.get(id);
  }

  async createConsentRequest(insertRequest: InsertConsentRequest): Promise<ConsentRequest> {
    const id = randomUUID();
    const request: ConsentRequest = {
      ...insertRequest,
      id,
      requestedAt: new Date(),
      respondedAt: null,
    };
    this.consentRequests.set(id, request);
    return request;
  }

  async updateConsentRequest(id: string, updates: Partial<ConsentRequest>): Promise<ConsentRequest | undefined> {
    const request = this.consentRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { 
      ...request, 
      ...updates, 
      respondedAt: updates.status ? new Date() : request.respondedAt 
    };
    this.consentRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getConsentRequestsBySessionId(sessionId: string): Promise<ConsentRequest[]> {
    return Array.from(this.consentRequests.values()).filter(
      (request) => request.sessionId === sessionId,
    );
  }

  // Opportunities
  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = randomUUID();
    const opportunity: Opportunity = { ...insertOpportunity, id };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async getAllActiveOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter(opp => opp.isActive);
  }

  async getOpportunitiesByCategory(category: 'safe' | 'balanced' | 'aggressive'): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter(
      (opp) => opp.category === category && opp.isActive,
    );
  }

  // Actions
  async getAction(id: string): Promise<Action | undefined> {
    return this.actions.get(id);
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const id = randomUUID();
    const action: Action = {
      ...insertAction,
      id,
      executedAt: new Date(),
    };
    this.actions.set(id, action);
    return action;
  }

  async updateAction(id: string, updates: Partial<Action>): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    const updatedAction = { ...action, ...updates };
    this.actions.set(id, updatedAction);
    return updatedAction;
  }

  async getActionsBySessionId(sessionId: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(
      (action) => action.sessionId === sessionId,
    );
  }

  async getPendingConsentRequests(sessionId: string): Promise<ConsentRequest[]> {
    return Array.from(this.consentRequests.values()).filter(
      (request) => request.sessionId === sessionId && request.status === 'pending',
    );
  }

  // Tokens
  async getToken(id: string): Promise<Token | undefined> {
    return this.tokens.get(id);
  }

  async getTokenByUserAndProvider(userId: string, provider: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.userId === userId && token.provider === provider,
    );
  }

  async getTokensByUserId(userId: string): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(
      (token) => token.userId === userId,
    );
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = randomUUID();
    const now = new Date();
    const token: Token = {
      ...insertToken,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tokens.set(id, token);
    return token;
  }

  async updateToken(id: string, updates: Partial<Token>): Promise<Token> {
    const token = this.tokens.get(id);
    if (!token) throw new Error('Token not found');
    
    const updatedToken = { 
      ...token, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }

  async deleteToken(id: string): Promise<boolean> {
    return this.tokens.delete(id);
  }

  // Ledger Entries
  async getLedgerEntry(id: string): Promise<LedgerEntry | undefined> {
    return this.ledgerEntries.get(id);
  }

  async createLedgerEntry(insertEntry: InsertLedgerEntry): Promise<LedgerEntry> {
    const id = randomUUID();
    const entry: LedgerEntry = {
      ...insertEntry,
      id,
      timestamp: new Date(),
    };
    this.ledgerEntries.set(id, entry);
    return entry;
  }

  async getLedgerEntriesByUserId(userId: string, limit: number = 50): Promise<LedgerEntry[]> {
    const entries = Array.from(this.ledgerEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeB - timeA;
      });
    
    return entries.slice(0, limit);
  }
}

export const storage = new MemStorage();
