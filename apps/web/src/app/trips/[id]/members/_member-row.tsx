'use client';

import { useState } from 'react';
import { IcArrowR } from '@/components/icons';

export function PrefRow({
  label,
  value,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
        {value}
        {!disabled ? <IcArrowR size={14} sw={2} /> : null}
      </div>
    </>
  );
  if (disabled || !onClick) {
    return (
      <div className="flex items-center justify-between px-3.5 py-3">{content}</div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3.5 py-3 text-left hover:bg-bg"
    >
      {content}
    </button>
  );
}

export function RoleMenu({
  current,
  busy,
  onChange,
}: {
  current: 'ADMIN' | 'MEMBER';
  busy: boolean;
  onChange: (role: 'ADMIN' | 'MEMBER') => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={
          current === 'ADMIN'
            ? 'rounded-pill bg-ink px-2.5 py-1 text-[12px] font-semibold text-white'
            : 'rounded-pill bg-[rgba(47,69,80,0.07)] px-2.5 py-1 text-[12px] font-semibold text-ink-2'
        }
      >
        {busy ? '…' : current === 'ADMIN' ? 'Admin ▾' : 'Membre ▾'}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-card bg-surface shadow-card-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (current !== 'ADMIN') onChange('ADMIN');
            }}
            className="block w-full px-3 py-2 text-left text-[12px] font-medium hover:bg-bg"
          >
            {current === 'ADMIN' ? '✓ ' : ''}Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (current !== 'MEMBER') onChange('MEMBER');
            }}
            className="block w-full px-3 py-2 text-left text-[12px] font-medium hover:bg-bg"
          >
            {current === 'MEMBER' ? '✓ ' : ''}Membre
          </button>
        </div>
      ) : null}
    </div>
  );
}
