'use client';

import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  action?: ReactNode;
}

export function Sheet({ children, onClose, title, action }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45"
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-mobile flex-col rounded-t-[28px] bg-surface shadow-sheet"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-center py-2.5">
          <div className="h-1 w-9 rounded-full bg-line2" />
        </div>
        {title ? (
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-semibold text-ink-3"
            >
              Annuler
            </button>
            <div className="text-[14px] font-bold text-ink">{title}</div>
            {action ?? <div className="w-10" />}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
