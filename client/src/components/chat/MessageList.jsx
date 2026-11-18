import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

const MessageList = ({ messages = [], currentUserId, loading = false }) => {
  const containerRef = useRef(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (messages.length !== lastCountRef.current) {
      el.scrollTop = el.scrollHeight;
      lastCountRef.current = messages.length;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--primary)]/60" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--primary)]/60 [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--primary)]/60 [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl">💬</div>

          <h3 className="mt-3 text-sm font-bold text-[var(--text)] dark:text-white">
            No messages yet
          </h3>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Send a message below to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-5">
      <div className="space-y-3">
        {messages.map((message, index) => (
          <MessageItem
            key={
              message._id ||
              message.id ||
              `${message.createdAt || "message"}-${index}`
            }
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;
