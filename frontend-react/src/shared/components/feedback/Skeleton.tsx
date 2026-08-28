interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = 'h-12 w-full' }: SkeletonProps) => {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
};

/**
 * Skeleton loaders for common components
 */

export const TaskItemSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border p-3">
    <Skeleton className="h-5 w-5 rounded" />
    <Skeleton className="flex-1" />
  </div>
);

export const TaskListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <TaskItemSkeleton key={i} />
    ))}
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-96" />
  </div>
);
