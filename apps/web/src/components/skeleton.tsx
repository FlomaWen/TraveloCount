'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  radius?: number | string;
}

export function Skeleton({ width, height, className, radius }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
  if (radius !== undefined) style.borderRadius = typeof radius === 'number' ? `${radius}px` : radius;
  return <div className={`skeleton ${className ?? ''}`} style={style} />;
}

interface LoadingFallbackProps {
  skeleton: ReactNode;
  timeoutMs?: number;
  onRetry?: () => void;
}

export function LoadingFallback({ skeleton, timeoutMs = 10000, onRetry }: LoadingFallbackProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <p className="text-[13px] font-semibold text-ink-2">Connexion impossible</p>
        <p className="text-[12px] text-ink-3">
          Le serveur met trop de temps à répondre. Vérifie ta connexion.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onRetry) onRetry();
            else window.location.reload();
          }}
          className="mt-2 inline-flex h-9 items-center rounded-btn bg-ink px-4 text-[12.5px] font-bold text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return <>{skeleton}</>;
}

export function SkeletonText({ width = '60%', height = 12 }: { width?: string | number; height?: number }) {
  return <Skeleton width={width} height={height} radius={4} />;
}

export function SkeletonCircle({ size }: { size: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      {children ?? (
        <div className="flex flex-col gap-2">
          <SkeletonText width="40%" height={11} />
          <SkeletonText width="80%" height={16} />
          <SkeletonText width="65%" height={12} />
        </div>
      )}
    </div>
  );
}
