import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

const MessageList = ({ messages = [], currentUserId, loading = false }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl">💬</div>

          <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            No messages yet
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Send a message to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-5">
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

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
