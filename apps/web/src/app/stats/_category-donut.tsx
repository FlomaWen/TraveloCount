export type Category = 'TRANSPORT' | 'LODGING' | 'RESTAURANT' | 'ACTIVITY' | 'OTHER';

export const CAT_COLOR: Record<Category, string> = {
  TRANSPORT: '#B8DBD9',
  LODGING: '#2F4550',
  RESTAURANT: '#586F7C',
  ACTIVITY: '#0C1A22',
  OTHER: '#9CC9C5',
};

export const CAT_LABEL: Record<Category, string> = {
  TRANSPORT: 'Transport',
  LODGING: 'Logement',
  RESTAURANT: 'Resto',
  ACTIVITY: 'Activités',
  OTHER: 'Autre',
};

export function CategoryDonut({
  categories,
  total,
  currency,
}: {
  categories: { category: Category; value: number }[];
  total: number;
  currency: string;
}) {
  const r = 46;
  const C = 2 * Math.PI * r;
  let cumPct = 0;
  return (
    <div className="relative">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F4F4F9" strokeWidth="22" />
        {categories.map((c) => {
          const pct = total > 0 ? c.value / total : 0;
          const dash = pct * C;
          const off = -cumPct * C;
          cumPct += pct;
          return (
            <circle
              key={c.category}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={CAT_COLOR[c.category]}
              strokeWidth="22"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={off}
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mono text-[18px] font-bold text-ink">
          {Math.round(total)}
          {currency}
        </div>
        <div className="label-up !text-[9.5px]">Total</div>
      </div>
    </div>
  );
}
