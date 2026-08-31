import { useState } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { Button, Input, Label } from '../../../shared/components/ui';
import { Skeleton } from '../../../shared/components/feedback';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useSendTelegramTest } from '../hooks/useSendTelegramTest';

export const ProfilePage = () => {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { mutate: sendTest, isPending: isTesting } = useSendTelegramTest();
  const [chatId, setChatId] = useState('');
  // Tracks the last server value we synced `chatId` from, so the input
  // picks up the loaded/saved value exactly once per change without an
  // effect — see React's "adjusting state when a prop changes" pattern.
  const [syncedChatId, setSyncedChatId] = useState<string | null>(null);
  if (user && user.telegramChatId !== syncedChatId) {
    setSyncedChatId(user.telegramChatId);
    setChatId(user.telegramChatId ?? '');
  }

  const isLinked = !!user?.telegramChatId;
  const isDirty = chatId !== (user?.telegramChatId ?? '');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-text-muted" />
        <h1>Hồ sơ</h1>
      </div>

      <div className="max-w-xl rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-1 text-body font-semibold text-text">Thông báo qua Telegram</h3>
        <p className="mb-4 text-small text-text-muted">
          Liên kết Chat ID Telegram để nhận thông báo (được gán việc, có bình luận, sắp/đã quá hạn) ngay
          lập tức, không cần mở app.
        </p>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <Label htmlFor="telegram-chat-id">Telegram Chat ID</Label>
                <Input
                  id="telegram-chat-id"
                  placeholder="Ví dụ: 123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                isLoading={isSaving}
                disabled={!isDirty}
                onClick={() => updateProfile({ telegramChatId: chatId })}
              >
                Lưu
              </Button>
              <Button
                variant="ghost"
                isLoading={isTesting}
                disabled={!isLinked || isDirty}
                onClick={() => sendTest()}
              >
                <Send className="mr-1.5 h-4 w-4" />
                Gửi thử
              </Button>
            </div>

            <details className="mt-4 text-small text-text-muted">
              <summary className="cursor-pointer font-medium text-text">Lấy Chat ID bằng cách nào?</summary>
              <ol className="ml-4 mt-2 list-decimal space-y-1">
                <li>
                  Server cần được cấu hình sẵn <code className="text-text">TELEGRAM_BOT_TOKEN</code> (tạo bot
                  qua <code className="text-text">@BotFather</code> trên Telegram, gõ{' '}
                  <code className="text-text">/newbot</code>).
                </li>
                <li>Mở Telegram, nhắn bất kỳ nội dung gì (vd "/start") cho bot vừa tạo.</li>
                <li>
                  Nhắn tin cho <code className="text-text">@userinfobot</code> — nó trả lời ngay số Chat ID của
                  bạn.
                </li>
                <li>Dán số đó vào ô trên, bấm Lưu rồi Gửi thử.</li>
              </ol>
            </details>
          </>
        )}
      </div>
    </div>
  );
};
