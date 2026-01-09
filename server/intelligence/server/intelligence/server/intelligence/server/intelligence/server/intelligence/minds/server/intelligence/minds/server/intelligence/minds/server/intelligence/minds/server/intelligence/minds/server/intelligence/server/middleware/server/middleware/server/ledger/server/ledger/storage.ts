import { writeFile, appendFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const LEDGER_DIR = join(process.cwd(), 'data', 'intent-ledger');
const INDEX_DIR = join(process.cwd(), 'data', 'intent-ledger-index');

export async function ensureLedgerDirs() {
  if (!existsSync(LEDGER_DIR)) await mkdir(LEDGER_DIR, { recursive: true });
  if (!existsSync(INDEX_DIR)) await mkdir(INDEX_DIR, { recursive: true });
}

export async function appendToLedger(filename: string, data: any) {
  await ensureLedgerDirs();
  const path = join(LEDGER_DIR, filename);
  const line = JSON.stringify(data) + '\n';
  await appendFile(path, line, 'utf8');
}

export async function writeIndex(filename: string, data: any) {
  await ensureLedgerDirs();
  const path = join(INDEX_DIR, filename);
  await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
}

export async function readLedger(filename: string): Promise<any[]> {
  const path = join(LEDGER_DIR, filename);
  if (!existsSync(path)) return [];
  const content = await readFile(path, 'utf8');
  return content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}
