'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface SheetProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  action?: ReactNode;
}

const CLOSE_THRESHOLD_PX = 110;
const CLOSE_THRESHOLD_VELOCITY = 0.6; // px/ms

export function Sheet({ children, onClose, title, action }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [closing, setClosing] = useState(false);
  const startRef = useRef<{ y: number; time: number } | null>(null);
  const lastRef = useRef<{ y: number; time: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { y: e.clientY, time: performance.now() };
    lastRef.current = { y: e.clientY, time: performance.now() };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dy = e.clientY - startRef.current.y;
    setDragY(dy > 0 ? dy : 0);
    lastRef.current = { y: e.clientY, time: performance.now() };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || !lastRef.current) return;
    const dy = lastRef.current.y - startRef.current.y;
    const dt = Math.max(1, lastRef.current.time - startRef.current.time);
    const velocity = dy / dt;
    startRef.current = null;
    lastRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (dy > CLOSE_THRESHOLD_PX || velocity > CLOSE_THRESHOLD_VELOCITY) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  let translate = 'translateY(100%)';
  if (closing) translate = 'translateY(100%)';
  else if (mounted) translate = dragY > 0 ? `translateY(${dragY}px)` : 'translateY(0)';

  const dragging = dragY > 0;
  const backdropOpacity = closing ? 0 : !mounted ? 0 : Math.max(0, 1 - dragY / 400);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={handleClose}
        className="absolute inset-0 bg-ink/45"
        style={{
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 200ms ease',
        }}
      />
      <div
        className="relative flex max-h-[80vh] w-full max-w-mobile flex-col overflow-x-hidden rounded-t-[28px] bg-surface shadow-sheet"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: translate,
          transition: dragging ? 'none' : 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex cursor-grab justify-center py-3 active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div className="h-1 w-9 rounded-full bg-line2" />
        </div>
        {title ? (
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="text-[13px] font-semibold text-ink-3"
            >
              Annuler
            </button>
            <div className="text-[14px] font-bold text-ink">{title}</div>
            {action ?? <div className="w-10" />}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
