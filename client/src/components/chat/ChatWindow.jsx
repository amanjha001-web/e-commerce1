import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatWindow = ({
  conversation = null,
  messages = [],
  currentUserId,
  onSend,
  onBack,
  onClose,
  loading = false,
  sending = false,
}) => {
  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loading}
        />
      </div>

      <MessageInput onSend={onSend} loading={sending} />
    </div>
  );
};

export default ChatWindow;
