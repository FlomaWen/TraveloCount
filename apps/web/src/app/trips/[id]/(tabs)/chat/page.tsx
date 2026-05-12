'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/atoms';
import { LoadingFallback, Skeleton, SkeletonCircle } from '@/components/skeleton';
import { useChat, type ChatMessage } from '@/lib/use-chat';
import { useTrip } from '@/lib/trip-context';

export default function ChatPage() {
  const { trip } = useTrip();
  const { data: session } = useSession();
  const { messages, connected, error, send } = useChat({
    tripId: trip.id,
    accessToken: session?.accessToken,
  });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    await send(content);
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {error ? <p className="text-center text-sm text-neg">{error}</p> : null}

        {!messages ? (
          <LoadingFallback
            skeleton={
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
                  >
                    <SkeletonCircle size={28} />
                    <Skeleton width={180} height={36} radius={14} />
                  </div>
                ))}
              </div>
            }
          />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-ink-3">
            Aucun message. Démarrez la conversation.
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const isMe = m.author.id === session?.userId;
              const sameAuthorAsPrev =
                prev && prev.author.id === m.author.id && withinGroupWindow(prev.createdAt, m.createdAt);
              const sameAuthorAsNext =
                next && next.author.id === m.author.id && withinGroupWindow(m.createdAt, next.createdAt);
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isMe={isMe}
                  isFirstOfGroup={!sameAuthorAsPrev}
                  isLastOfGroup={!sameAuthorAsNext}
                />
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={connected ? 'Écrire un message…' : 'Connexion…'}
          maxLength={2000}
          className="flex-1 rounded-pill border border-line2 bg-bg px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="inline-flex h-10 items-center justify-center rounded-pill bg-ink px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {sending ? '…' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isMe,
  isFirstOfGroup,
  isLastOfGroup,
}: {
  message: ChatMessage;
  isMe: boolean;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
}) {
  const bubbleRadius = isMe
    ? `rounded-[18px] ${isFirstOfGroup ? '' : 'rounded-tr-[6px]'} ${isLastOfGroup ? 'rounded-br-[6px]' : 'rounded-br-[6px]'}`
    : `rounded-[18px] ${isFirstOfGroup ? '' : 'rounded-tl-[6px]'} ${isLastOfGroup ? 'rounded-bl-[6px]' : 'rounded-bl-[6px]'}`;
  return (
    <div
      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} ${
        isFirstOfGroup ? 'mt-2' : ''
      }`}
    >
      <div className="w-7 flex-shrink-0">
        {!isMe && isLastOfGroup ? (
          <Avatar id={message.author.id} name={message.author.name} size={28} />
        ) : null}
      </div>
      <div className={`flex max-w-[78%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && isFirstOfGroup ? (
          <div className="mb-0.5 text-[11px] font-semibold text-ink-3">
            {message.author.name.split(' ')[0]}
          </div>
        ) : null}
        <div
          className={
            isMe
              ? `${bubbleRadius} bg-ink px-3.5 py-2 text-[14px] text-white`
              : `${bubbleRadius} bg-[rgba(47,69,80,0.08)] px-3.5 py-2 text-[14px] text-ink`
          }
        >
          {message.content}
        </div>
        {isLastOfGroup ? (
          <div className="mt-0.5 text-[10px] font-medium text-ink-3">
            {formatTime(message.createdAt)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function withinGroupWindow(prevIso: string, currIso: string): boolean {
  return Math.abs(new Date(currIso).getTime() - new Date(prevIso).getTime()) < GROUP_WINDOW_MS;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
