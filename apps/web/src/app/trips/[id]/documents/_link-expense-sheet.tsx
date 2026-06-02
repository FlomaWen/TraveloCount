'use client';

import { IcReceipt } from '@/components/icons';
import { Sheet } from '@/components/sheet';

interface ExpenseRef {
  id: string;
  label: string;
  amount: number;
  currency: string;
  date: string;
}

export function LinkExpenseSheet({
  linkedExpenseId,
  expenses,
  busy,
  onClose,
  onLink,
}: {
  linkedExpenseId: string | null;
  expenses: ExpenseRef[];
  busy: boolean;
  onClose: () => void;
  onLink: (expenseId: string | null) => void;
}) {
  return (
    <Sheet
      title="Lier à une dépense"
      onClose={onClose}
      action={
        linkedExpenseId ? (
          <button
            type="button"
            onClick={() => onLink(null)}
            disabled={busy}
            className="rounded-[9px] border border-neg/40 px-3 py-[7px] text-[12px] font-bold text-neg disabled:opacity-40"
          >
            Délier
          </button>
        ) : undefined
      }
    >
      <div className="px-2 pb-3">
        {expenses.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-ink-3">
            Aucune dépense dans ce voyage.
          </p>
        ) : (
          expenses.map((e) => {
            const selected = linkedExpenseId === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onLink(e.id)}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-card px-3 py-3 text-left hover:bg-bg disabled:opacity-50"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg text-ink-2">
                  <IcReceipt size={16} sw={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-ink">{e.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-ink-3">
                    {new Date(e.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    ·{' '}
                    {e.amount.toFixed(2).replace('.', ',')}
                    {e.currency === 'EUR' ? '€' : e.currency}
                  </div>
                </div>
                {selected ? (
                  <span className="text-[14px] font-bold text-accent">✓</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </Sheet>
  );
}
