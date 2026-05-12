export interface Balance {
  userId: string;
  amount: number;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeBalances(
  memberIds: string[],
  expenses: { payerId: string; amount: number; shares: { userId: string; amount: number }[] }[],
  confirmedSettlements: { fromUserId: string; toUserId: string; amount: number }[] = [],
): Balance[] {
  const map = new Map<string, number>();
  for (const id of memberIds) map.set(id, 0);
  for (const exp of expenses) {
    map.set(exp.payerId, (map.get(exp.payerId) ?? 0) + exp.amount);
    for (const s of exp.shares) {
      map.set(s.userId, (map.get(s.userId) ?? 0) - s.amount);
    }
  }
  // A settlement confirmed: from paid to. So from's debt decreases (+), to's credit decreases (-).
  for (const s of confirmedSettlements) {
    map.set(s.fromUserId, (map.get(s.fromUserId) ?? 0) + s.amount);
    map.set(s.toUserId, (map.get(s.toUserId) ?? 0) - s.amount);
  }
  return Array.from(map.entries()).map(([userId, amount]) => ({
    userId,
    amount: round(amount),
  }));
}

/**
 * Greedy minimal-transactions settlement:
 * largest creditor receives from largest debtor until both are settled,
 * repeat. Produces at most N-1 transactions for N members.
 */
export function computeSettlements(balances: Balance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.amount < -0.005)
    .map((b) => ({ userId: b.userId, amount: -b.amount }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.amount > 0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const transfer = round(Math.min(d.amount, c.amount));
    if (transfer > 0) {
      settlements.push({ fromUserId: d.userId, toUserId: c.userId, amount: transfer });
      d.amount = round(d.amount - transfer);
      c.amount = round(c.amount - transfer);
    }
    if (d.amount < 0.005) i++;
    if (c.amount < 0.005) j++;
  }
  return settlements;
}
