import { CatBadge, Money, categoryToIcon } from '@/components/atoms';

export interface Expense {
  id: string;
  label: string;
  category: 'TRANSPORT' | 'LODGING' | 'RESTAURANT' | 'ACTIVITY' | 'OTHER';
  amount: number;
  currency: string;
  amountOriginal: number | null;
  currencyOriginal: string | null;
  date: string;
  splitMethod: string;
  payer: { id: string; name: string };
  participantCount: number;
  myShare: number;
}

export function ExpenseRow({
  expense,
  currency,
  myId,
  onClick,
}: {
  expense: Expense;
  currency: string;
  myId?: string;
  onClick?: () => void;
}) {
  const isMe = expense.payer.id === myId;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-bg"
      >
        <ExpenseRowContent expense={expense} currency={currency} isMe={isMe} />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <ExpenseRowContent expense={expense} currency={currency} isMe={isMe} />
    </div>
  );
}

function ExpenseRowContent({
  expense,
  currency,
  isMe,
}: {
  expense: Expense;
  currency: string;
  isMe: boolean;
}) {
  return (
    <>
      <CatBadge name={categoryToIcon(expense.category)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold leading-tight text-ink">
          {expense.label}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-ink-3">
          {isMe ? (
            <span className="font-semibold text-pos">Tu as payé</span>
          ) : (
            <>
              Payé par <span className="font-semibold text-ink-2">{expense.payer.name.split(' ')[0]}</span>
            </>
          )}
          <span className="text-mute">·</span>
          <span>÷ {expense.participantCount}</span>
        </div>
      </div>
      <div className="text-right">
        <Money value={expense.amount} size={14} weight={700} color="#0C1A22" currency={currency} />
        {expense.amountOriginal !== null && expense.currencyOriginal ? (
          <div className="mono text-[10px] text-ink-3">
            ≈ {expense.amountOriginal.toFixed(2).replace('.', ',')} {expense.currencyOriginal}
          </div>
        ) : null}
        <div
          className={`mono mt-0.5 text-[11px] font-semibold ${isMe ? 'text-pos' : 'text-neg'}`}
        >
          {isMe ? '+' : '−'}
          {Math.abs(expense.amount - expense.myShare).toFixed(2).replace('.', ',')}
          {currency}
        </div>
      </div>
    </>
  );
}
