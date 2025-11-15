import { storage } from '../storage';
import type { InsertLedgerEntry, LedgerEntry } from '@shared/schema';
import crypto from 'crypto';

class Ledger {
  private createHash(entry: Omit<InsertLedgerEntry, 'hash'>, timestamp?: Date): string {
    const data = JSON.stringify({
      userId: entry.userId,
      action: entry.action,
      channel: entry.channel,
      status: entry.status,
      payload: this.redactSensitiveData(entry.payload),
      result: entry.result,
      timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString()
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private redactSensitiveData(payload: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'secret',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'pin'
    ];

    const redacted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(payload)) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  async logAction(
    userId: string,
    action: string,
    channel: 'api' | 'shortcut' | 'manual',
    status: 'sent' | 'confirmed' | 'failed',
    payload: Record<string, any>,
    result?: any
  ): Promise<LedgerEntry> {
    const redactedPayload = this.redactSensitiveData(payload);
    const timestamp = new Date();
    
    const entryData: Omit<InsertLedgerEntry, 'hash'> = {
      userId,
      action,
      channel,
      status,
      payload: redactedPayload,
      result
    };

    const hash = this.createHash(entryData, timestamp);

    const ledgerEntry: InsertLedgerEntry = {
      ...entryData,
      hash
    };

    const entry = await storage.createLedgerEntry(ledgerEntry, timestamp);
    return entry;
  }

  async getLedger(userId: string, limit: number = 50): Promise<LedgerEntry[]> {
    return storage.getLedgerEntriesByUserId(userId, limit);
  }

  async exportLedger(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const entries = await storage.getLedgerEntriesByUserId(userId, 1000);

    if (format === 'csv') {
      const headers = 'Timestamp,Action,Channel,Status,Hash\n';
      const rows = entries.map(entry => 
        `${entry.timestamp?.toISOString() || ''},${entry.action},${entry.channel},${entry.status},${entry.hash}`
      ).join('\n');
      
      return headers + rows;
    }

    return JSON.stringify(entries, null, 2);
  }

  async verifyEntryIntegrity(entry: LedgerEntry): Promise<boolean> {
    if (!entry.timestamp) return false;
    
    const computedHash = this.createHash({
      userId: entry.userId,
      action: entry.action,
      channel: entry.channel,
      status: entry.status,
      payload: entry.payload,
      result: entry.result
    }, entry.timestamp);

    return computedHash === entry.hash;
  }

  async getActionSummary(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
    recent: LedgerEntry[];
  }> {
    const entries = await storage.getLedgerEntriesByUserId(userId, 100);

    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};

    entries.forEach(entry => {
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
      byChannel[entry.channel] = (byChannel[entry.channel] || 0) + 1;
    });

    return {
      total: entries.length,
      byStatus,
      byChannel,
      recent: entries.slice(0, 5)
    };
  }
}

export const ledger = new Ledger();
