import { randomUUID } from 'crypto';
import { IntentRecord } from './types';
import { appendToLedger, writeIndex } from './storage';

const INTENT_LEDGER_FILE = 'intents.jsonl';
const INTENT_INDEX_FILE = 'intents-index.json';

let intentIndex: { id: string; timestamp: string; sessionId: string }[] = [];

export async function recordIntent(record: Omit<IntentRecord, 'id' | 'timestamp'>): Promise<string> {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  
  const fullRecord: IntentRecord = {
    id,
    timestamp,
    ...record,
  };

  await appendToLedger(INTENT_LEDGER_FILE, fullRecord);
  
  intentIndex.push({ id, timestamp, sessionId: record.sessionId });
  await writeIndex(INTENT_INDEX_FILE, intentIndex);

  return id;
}

export async function getIntentsBySession(sessionId: string): Promise<IntentRecord[]> {
  const { readLedger } = await import('./storage');
  const allRecords = await readLedger(INTENT_LEDGER_FILE);
  return allRecords.filter((r: IntentRecord) => r.sessionId === sessionId);
}
