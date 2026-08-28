import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments } from '../hooks/useComments';

interface CommentListProps {
  taskId: number;
}

export const CommentList = ({ taskId }: CommentListProps) => {
  const { data: comments, isLoading, isError, refetch } = useComments(taskId);

  return (
    <div>
      <label className="mb-2 block text-small font-semibold uppercase tracking-wide text-text-muted">
        Bình luận {comments ? `(${comments.length})` : ''}
      </label>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được bình luận." onRetry={() => refetch()} />}

      {comments && comments.length > 0 && (
        <ul className="mb-3 divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} taskId={taskId} />
          ))}
        </ul>
      )}

      <CommentForm taskId={taskId} />
    </div>
  );
};
