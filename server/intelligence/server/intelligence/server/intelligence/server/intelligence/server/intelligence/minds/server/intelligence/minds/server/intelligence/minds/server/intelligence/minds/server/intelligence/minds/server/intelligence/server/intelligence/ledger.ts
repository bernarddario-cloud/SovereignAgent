import { FailureLog } from './types';

const ledger: FailureLog[] = [];

export function recordFailure(log: FailureLog): void {
  ledger.push(log);
  console.log('[LEDGER] Recorded failure:', JSON.stringify(log, null, 2));
}

export function getLedger(): FailureLog[] {
  return [...ledger];
}

export function clearLedger(): void {
  ledger.length = 0;
  console.log('[LEDGER] Cleared all entries.');
}