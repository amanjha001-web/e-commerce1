import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatWindow = ({
  conversation = null,
  messages = [],
  currentUser = null,
  currentUserId,
  onSend,
  onBack,
  onClose,
  onDelete,
  loading = false,
  sending = false,
  embedded = false,
}) => {
  const resolvedUserId =
    currentUserId || currentUser?._id || currentUser?.id || null;

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MessageList
          messages={messages}
          currentUserId={resolvedUserId}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white dark:bg-card">
      <ChatHeader
        conversation={conversation}
        currentUserId={resolvedUserId}
        onBack={onBack}
        onClose={onClose}
        onDelete={onDelete}
      />

      <div className="min-h-0 flex-1 bg-[var(--bg)]/40">
        <MessageList
          messages={messages}
          currentUserId={resolvedUserId}
          loading={loading}
        />
      </div>

      <MessageInput onSend={onSend} loading={sending} />
    </div>
  );
};

export default ChatWindow;
