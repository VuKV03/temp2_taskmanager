import { useState } from 'react';
import { Textarea, Button } from '../../../shared/components/ui';
import { useCreateComment } from '../hooks/useCreateComment';

interface CommentFormProps {
  taskId: number;
}

export const CommentForm = ({ taskId }: CommentFormProps) => {
  const [content, setContent] = useState('');
  const { mutate: createComment, isPending } = useCreateComment(taskId);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    createComment(trimmed, { onSuccess: () => setContent('') });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder="Viết bình luận…"
        rows={2}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} isLoading={isPending} disabled={!content.trim()}>
          Gửi
        </Button>
      </div>
    </div>
  );
};
