'use client';

import type { Worker } from 'tesseract.js';

export interface OcrResult {
  rawText: string;
  amount: number | null;
  currency: string | null;
  date: string | null; // ISO YYYY-MM-DD
}

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker(['fra', 'eng']);
    })();
  }
  return workerPromise;
}

export async function ocrReceipt(file: File): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);
  const rawText = data.text;
  return {
    rawText,
    amount: extractAmount(rawText),
    currency: extractCurrency(rawText),
    date: extractDate(rawText),
  };
}

const CURRENCY_PATTERNS: Array<{ code: string; patterns: RegExp[] }> = [
  { code: 'EUR', patterns: [/€/, /\bEUR\b/i, /\beuros?\b/i] },
  { code: 'USD', patterns: [/\$/, /\bUSD\b/i, /\bdollars?\b/i] },
  { code: 'GBP', patterns: [/£/, /\bGBP\b/i, /\bpounds?\b/i, /\blivres?\b/i] },
  { code: 'CHF', patterns: [/\bCHF\b/i, /\bfrancs? suisses?\b/i] },
  { code: 'JPY', patterns: [/¥/, /\bJPY\b/i, /\byens?\b/i] },
  { code: 'CAD', patterns: [/\bCAD\b/i, /\bCA\$/i] },
];

function extractCurrency(text: string): string | null {
  for (const { code, patterns } of CURRENCY_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return code;
  }
  return null;
}

/**
 * Look for the largest amount preceded by keywords like total, montant, etc.
 * Falls back to the largest number with 2 decimals if no keyword found.
 */
function extractAmount(text: string): number | null {
  const upper = text.toUpperCase();
  const lines = upper.split(/\r?\n/);

  // Priority: lines containing total/montant/somme/à payer
  const totalKeywords = /\b(TOTAL|MONTANT|SOMME|A PAYER|À PAYER|NET A PAYER|NET À PAYER|TOTAL TTC|TTC)\b/;
  const candidates: number[] = [];
  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const nums = extractNumbers(line);
      candidates.push(...nums);
    }
  }
  if (candidates.length > 0) {
    return Math.max(...candidates);
  }

  // Fallback: all numbers with exactly 2 decimals in the entire text
  const allNumbers = extractNumbers(text);
  if (allNumbers.length === 0) return null;
  // Heuristic: largest number is usually the total
  return Math.max(...allNumbers);
}

function extractNumbers(s: string): number[] {
  // Matches 12,34 / 12.34 / 1234,56 / 1 234,56 / 1,234.56
  const re = /\b\d{1,5}(?:[\s.,]\d{3})*[.,]\d{2}\b/g;
  const matches = s.match(re) ?? [];
  const out: number[] = [];
  for (const m of matches) {
    // Normalize: keep last separator as decimal, drop the others
    const lastSepIndex = Math.max(m.lastIndexOf(','), m.lastIndexOf('.'));
    if (lastSepIndex < 0) continue;
    const intPart = m.slice(0, lastSepIndex).replace(/[\s.,]/g, '');
    const decPart = m.slice(lastSepIndex + 1);
    const n = Number(`${intPart}.${decPart}`);
    if (!Number.isNaN(n) && n > 0) out.push(n);
  }
  return out;
}

const MONTH_MAP: Record<string, number> = {
  janv: 0, jan: 0, january: 0, janvier: 0,
  fevr: 1, fev: 1, feb: 1, february: 1, fevrier: 1, février: 1, févr: 1,
  mars: 2, mar: 2, march: 2,
  avr: 3, apr: 3, avril: 3, april: 3,
  mai: 4, may: 4,
  juin: 5, jun: 5, june: 5,
  juil: 6, jul: 6, july: 6, juillet: 6,
  aout: 7, août: 7, aug: 7, august: 7,
  sept: 8, sep: 8, september: 8, septembre: 8,
  oct: 9, october: 9, octobre: 9,
  nov: 10, november: 10, novembre: 10,
  dec: 11, déc: 11, december: 11, decembre: 11, décembre: 11,
};

function extractDate(text: string): string | null {
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numericRe = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
  const m1 = text.match(numericRe);
  if (m1) {
    const day = Number(m1[1]);
    const month = Number(m1[2]);
    let year = Number(m1[3]);
    if (year < 100) year += 2000;
    if (isValidDate(year, month, day)) {
      return formatIso(year, month, day);
    }
  }

  // DD MMM YYYY (mois en lettres)
  const wordRe = /\b(\d{1,2})\s+([a-zéûô]+)\s+(\d{2,4})\b/i;
  const m2 = text.match(wordRe);
  if (m2) {
    const day = Number(m2[1]);
    const monthKey = m2[2].toLowerCase().slice(0, 5);
    const month = MONTH_MAP[monthKey] ?? MONTH_MAP[m2[2].toLowerCase().slice(0, 4)] ?? MONTH_MAP[m2[2].toLowerCase().slice(0, 3)];
    let year = Number(m2[3]);
    if (year < 100) year += 2000;
    if (month !== undefined && isValidDate(year, month + 1, day)) {
      return formatIso(year, month + 1, day);
    }
  }

  return null;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 2000 || year > 2100) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function formatIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
