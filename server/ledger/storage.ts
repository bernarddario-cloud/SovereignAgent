export interface LedgerRecord {
  id: string;
  type: string;
  payload: unknown;
  created_at: string;
}

const ledger: LedgerRecord[] = [];

export function addLedgerRecord(record: LedgerRecord) {
  ledger.push(record);
}

export function getLedgerRecords(limit = 10): LedgerRecord[] {
  return ledger.slice(-limit);
}
