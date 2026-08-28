import { useRef, useState } from 'react';
import { Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog } from '../../../shared/components/ui';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { useAttachments } from '../hooks/useAttachments';
import { useUploadAttachments } from '../hooks/useUploadAttachments';
import { useDeleteAttachment } from '../hooks/useDeleteAttachment';
import { resolveAttachmentUrl } from '../services/collaboration.service';
import type { Attachment } from '../types/collaboration.types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentListProps {
  taskId: number;
}

export const AttachmentList = ({ taskId }: AttachmentListProps) => {
  const { data: attachments, isLoading, isError, refetch } = useAttachments(taskId);
  const { mutate: upload, isPending: isUploading } = useUploadAttachments(taskId);
  const { mutate: remove, isPending: isDeleting } = useDeleteAttachment(taskId);
  const [deletingAttachment, setDeletingAttachment] = useState<Attachment | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload(Array.from(files), {
      onError: (err) => toast.error(getErrorMessage(err.code)),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-small font-semibold uppercase tracking-wide text-text-muted">
          Đính kèm {attachments ? `(${attachments.length})` : ''}
        </label>
        <Button
          variant="secondary"
          size="sm"
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Tải lên
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được tệp đính kèm." onRetry={() => refetch()} />}

      {attachments && attachments.length === 0 && (
        <p className="text-small text-text-muted">Chưa có tệp đính kèm nào.</p>
      )}

      {attachments && attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5"
            >
              <a
                href={resolveAttachmentUrl(attachment.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-small text-text hover:text-primary"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <span className="truncate">{attachment.fileName}</span>
                <span className="shrink-0 text-text-muted">{formatFileSize(attachment.fileSize)}</span>
              </a>
              <button
                onClick={() => setDeletingAttachment(attachment)}
                aria-label={`Xoá ${attachment.fileName}`}
                className="shrink-0 rounded p-1 text-text-muted hover:bg-background hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deletingAttachment}
        onClose={() => setDeletingAttachment(undefined)}
        onConfirm={() => {
          if (deletingAttachment) remove(deletingAttachment.id, { onSuccess: () => setDeletingAttachment(undefined) });
        }}
        title="Xoá tệp đính kèm?"
        description={`"${deletingAttachment?.fileName}" sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />
    </div>
  );
};
