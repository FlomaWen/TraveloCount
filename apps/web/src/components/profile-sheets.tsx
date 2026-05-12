'use client';

import { useState } from 'react';
import { Sheet } from './sheet';
import { Avatar, Card, Chip, Label, initialsOf } from './atoms';
import { IcCheck } from './icons';

interface SessionLite {
  name: string | null | undefined;
  email: string | null | undefined;
  userId: string | undefined;
}

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc suisse' },
  { code: 'JPY', symbol: '¥', label: 'Yen japonais' },
  { code: 'CAD', symbol: 'C$', label: 'Dollar canadien' },
];

export function IdentitySheet({
  session,
  onClose,
}: {
  session: SessionLite;
  onClose: () => void;
}) {
  const name = session.name ?? 'Utilisateur';
  const email = session.email ?? '—';
  return (
    <Sheet title="Identité" onClose={onClose}>
      <div className="space-y-4 px-4 pb-6 pt-2">
        <Card className="flex items-center gap-3.5">
          <span className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-[16px] bg-accent text-[22px] font-bold text-accent-ink">
            {initialsOf(name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-bold text-ink">{name}</div>
            <div className="truncate text-[12px] font-medium text-ink-3">{email}</div>
          </div>
        </Card>

        <div>
          <Label>Compte connecté</Label>
          <Card padding={0}>
            <ReadRow label="Nom complet" value={name} />
            <div className="h-px bg-line" />
            <ReadRow label="Email" value={email} />
            <div className="h-px bg-line" />
            <ReadRow label="Méthode de connexion" value="Google" />
          </Card>
        </div>

        <p className="text-[11.5px] text-ink-3">
          Ces informations proviennent de ton compte Google. Pour les modifier, fais-le côté Google.
        </p>
      </div>
    </Sheet>
  );
}

export function CurrencySheet({
  current,
  onChange,
  onClose,
}: {
  current: string;
  onChange: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Devise par défaut" onClose={onClose}>
      <div className="space-y-3 px-4 pb-6 pt-2">
        <p className="text-[12px] text-ink-3">
          Utilisée par défaut à la création d'un voyage. Tu pourras toujours la changer voyage par voyage.
        </p>
        <Card padding={0}>
          {CURRENCIES.map((c, i) => {
            const active = c.code === current;
            return (
              <div key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-bg"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg mono text-[14px] font-bold text-ink">
                    {c.symbol}
                  </span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold text-ink">{c.label}</div>
                    <div className="text-[11px] text-ink-3">{c.code}</div>
                  </div>
                  {active ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
                      <IcCheck size={14} sw={2.5} />
                    </span>
                  ) : null}
                </button>
                {i < CURRENCIES.length - 1 ? <div className="ml-[60px] h-px bg-line" /> : null}
              </div>
            );
          })}
        </Card>
      </div>
    </Sheet>
  );
}

export function NotificationsSheet({
  prefs,
  onChange,
  onClose,
}: {
  prefs: NotifPrefs;
  onChange: (next: NotifPrefs) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Notifications" onClose={onClose}>
      <div className="space-y-3 px-4 pb-6 pt-2">
        <Card padding={0}>
          <ToggleRow
            label="Nouvelles dépenses"
            description="Quand un membre ajoute une dépense"
            value={prefs.newExpenses}
            onChange={(v) => onChange({ ...prefs, newExpenses: v })}
          />
          <div className="h-px bg-line" />
          <SelectRow
            label="Activité du groupe"
            description="Membres rejoints, étapes ajoutées, messages"
            value={prefs.groupActivity}
            options={['Tout', 'Important', 'Aucun']}
            onChange={(v) => onChange({ ...prefs, groupActivity: v })}
          />
          <div className="h-px bg-line" />
          <SelectRow
            label="Astuces de voyage"
            description="Conseils contextuels pendant le voyage"
            value={prefs.tips}
            options={['Quotidien', 'Hebdo', 'Aucun']}
            onChange={(v) => onChange({ ...prefs, tips: v })}
          />
        </Card>
        <p className="text-[11px] text-ink-3">
          Stocké localement pour le moment. Push web à venir.
        </p>
      </div>
    </Sheet>
  );
}

export function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="À propos" onClose={onClose}>
      <div className="space-y-3 px-4 pb-6 pt-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card-lg bg-ink text-white">
          <span className="mono text-[20px] font-bold">WS</span>
        </div>
        <div className="text-[18px] font-bold text-ink">WeSplit</div>
        <div className="mono text-[12px] text-ink-3">v0.1.0 · dev build</div>
        <p className="mx-auto max-w-[280px] text-[12.5px] leading-[1.5] text-ink-2">
          Application de gestion de voyages en groupe : itinéraires partagés, dépenses, comptes et règlements.
        </p>
        <div className="pt-2 flex justify-center gap-1.5">
          <Chip tone="ghost" size="sm">Next.js 15</Chip>
          <Chip tone="ghost" size="sm">NestJS 11</Chip>
          <Chip tone="ghost" size="sm">PostgreSQL</Chip>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Atoms internes ────────────────────────────────────────────

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3">
      <span className="text-[12.5px] font-semibold text-ink-3">{label}</span>
      <span className="truncate text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-ink">{label}</div>
        {description ? (
          <div className="mt-0.5 text-[11px] font-medium text-ink-3">{description}</div>
        ) : null}
      </div>
      <span
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-pill transition ${
          value ? 'bg-ink' : 'bg-line2'
        }`}
      >
        <span
          className={`absolute h-5 w-5 rounded-full bg-white shadow-card transition-all ${
            value ? 'left-[26px]' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-3.5 py-3">
      <div className="text-[13.5px] font-semibold text-ink">{label}</div>
      {description ? (
        <div className="mt-0.5 text-[11px] font-medium text-ink-3">{description}</div>
      ) : null}
      <div className="mt-2 flex gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`flex-1 rounded-pill px-3 py-1.5 text-[11.5px] font-semibold ${
              o === value ? 'bg-ink text-white' : 'bg-bg text-ink-2'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface NotifPrefs {
  newExpenses: boolean;
  groupActivity: string;
  tips: string;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  newExpenses: true,
  groupActivity: 'Important',
  tips: 'Quotidien',
};
