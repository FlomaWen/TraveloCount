'use client';

import type { OcrResult } from '@/lib/ocr';
import { currencySymbol } from '@/lib/currency';

export function ScanResultDialog({
  result,
  fallbackCurrency,
  onCancel,
  onApply,
}: {
  result: OcrResult;
  fallbackCurrency: string;
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-6">
      <div className="w-full max-w-sm rounded-card-lg bg-surface p-5 shadow-card-lg">
        <div className="mb-1 text-[14px] font-bold text-ink">Résultats détectés</div>
        <p className="mb-4 text-[12px] text-ink-3">
          Vérifie les valeurs avant d'appliquer. Tu pourras toujours les corriger ensuite.
        </p>
        <div className="space-y-2">
          <ScanRow
            label="Montant"
            value={
              result.amount !== null
                ? `${result.amount.toFixed(2).replace('.', ',')} ${currencySymbol(result.currency ?? fallbackCurrency)}`
                : 'Non détecté'
            }
            found={result.amount !== null}
          />
          <ScanRow label="Devise" value={result.currency ?? 'Non détectée'} found={!!result.currency} />
          <ScanRow label="Date" value={result.date ?? 'Non détectée'} found={!!result.date} />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-input border border-line2 bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-2"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-input bg-ink px-4 py-2.5 text-[13px] font-bold text-white"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanRow({ label, value, found }: { label: string; value: string; found: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-input bg-bg px-3 py-2">
      <span className="text-[12px] font-semibold text-ink-3">{label}</span>
      <span className={`text-[13px] font-bold ${found ? 'text-ink' : 'text-ink-3'}`}>
        {value}
      </span>
    </div>
  );
}
