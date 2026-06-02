import { Skeleton, SkeletonCircle } from '@/components/skeleton';

export function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 pb-12">
      <div className="rounded-card bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton width={140} height={14} radius={4} />
          <Skeleton width={42} height={18} radius={999} />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <SkeletonCircle size={28} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <Skeleton width="40%" height={12} radius={3} />
                  <Skeleton width={50} height={12} radius={3} />
                </div>
                <div className="mt-1.5">
                  <Skeleton width="100%" height={6} radius={999} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-1 pt-1">
        <Skeleton width={180} height={14} radius={4} />
        <Skeleton width={60} height={18} radius={999} />
      </div>
      <div className="rounded-card bg-surface p-0 shadow-card">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3">
            <SkeletonCircle size={32} />
            <Skeleton width={12} height={12} radius={2} />
            <SkeletonCircle size={32} />
            <div className="flex-1">
              <Skeleton width="60%" height={12} radius={3} />
              <div className="mt-1">
                <Skeleton width="40%" height={10} radius={3} />
              </div>
            </div>
            <Skeleton width={60} height={14} radius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}
