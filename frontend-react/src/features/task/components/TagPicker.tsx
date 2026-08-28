import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '../../../shared/components/ui';
import { useTags } from '../hooks/useTags';
import { useCreateTag } from '../hooks/useCreateTag';
import type { TagSummary } from '../types/task.types';

interface TagPickerProps {
  value: TagSummary[];
  onChange: (tags: TagSummary[]) => void;
}

export const TagPicker = ({ value, onChange }: TagPickerProps) => {
  const { data: tags } = useTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const [adding, setAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const available = (tags ?? []).filter((t) => !value.some((v) => v.id === t.id));

  const addTag = (tag: TagSummary) => onChange([...value, tag]);
  const removeTag = (id: number) => onChange(value.filter((t) => t.id !== id));

  const submitNewTag = () => {
    if (!newTagName.trim()) return;
    createTag(
      { name: newTagName.trim() },
      {
        onSuccess: (res) => {
          if (res.data) addTag(res.data);
          setNewTagName('');
          setAdding(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small"
          style={{ backgroundColor: `${tag.color ?? '#6B7280'}20`, color: tag.color ?? '#6B7280' }}
        >
          #{tag.name}
          <button onClick={() => removeTag(tag.id)} aria-label={`Bỏ nhãn ${tag.name}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {!adding && (
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-small text-text-muted hover:text-text"
          >
            <Plus className="h-3 w-3" />
            Thêm nhãn
          </button>
        </div>
      )}

      {adding && (
        <div className="flex items-center gap-1">
          {available.length > 0 && (
            <select
              className="rounded-md border border-border px-2 py-1 text-small"
              onChange={(e) => {
                const tag = available.find((t) => String(t.id) === e.target.value);
                if (tag) addTag(tag);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Chọn nhãn có sẵn
              </option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <Input
            autoFocus
            placeholder="Tên nhãn mới"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitNewTag();
              }
              if (e.key === 'Escape') setAdding(false);
            }}
            className="h-8 w-32 text-small"
            disabled={isCreating}
          />
          <button
            type="button"
            onClick={() => setAdding(false)}
            aria-label="Đóng"
            className="text-text-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
