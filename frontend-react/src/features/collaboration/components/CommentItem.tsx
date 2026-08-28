import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Textarea, Button, ConfirmDialog } from '../../../shared/components/ui';
import { useAuthStore } from '../../../features/auth';
import { formatDateTime } from '../../../shared/lib/datetime';
import { useUpdateComment } from '../hooks/useUpdateComment';
import { useDeleteComment } from '../hooks/useDeleteComment';
import type { Comment } from '../types/collaboration.types';

interface CommentItemProps {
  comment: Comment;
  taskId: number;
}

export const CommentItem = ({ comment, taskId }: CommentItemProps) => {
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = currentUser?.id === comment.user.id;

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment(taskId);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment(taskId);

  const save = () => {
    const trimmed = content.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      setContent(comment.content);
      return;
    }
    updateComment({ id: comment.id, content: trimmed }, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-small font-medium text-text">{comment.user.fullName}</span>{' '}
          <span className="text-small text-text-muted">{formatDateTime(comment.createdAt)}</span>
        </div>
        {isOwn && !isEditing && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Sửa bình luận"
              className="rounded p-1 text-text-muted hover:bg-background hover:text-text"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Xoá bình luận"
              className="rounded p-1 text-text-muted hover:bg-background hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-1 space-y-2">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setContent(comment.content);
              }}
            >
              Huỷ
            </Button>
            <Button size="sm" onClick={save} isLoading={isUpdating}>
              Lưu
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-body text-text">{comment.content}</p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteComment(comment.id, { onSuccess: () => setConfirmDelete(false) })}
        title="Xoá bình luận?"
        description="Bình luận sẽ bị xoá vĩnh viễn."
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />
    </li>
  );
};
