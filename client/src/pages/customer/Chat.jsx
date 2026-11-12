import ConversationList from "../../components/chat/ConversationList";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatWindow from "../../components/chat/ChatWindow";
import MessageInput from "../../components/chat/MessageInput";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Chat = ({
  conversations = [],
  messages = [],
  activeConversation = null,
  loading = false,
  messagesLoading = false,
  sending = false,
  user = null,
  onSelectConversation,
  onSendMessage,
  onDeleteConversation,
  onLoadMoreMessages,
  onNavigate,
}) => {
  const selectedConversation = activeConversation;

  const getConversationId = (conversation) =>
    conversation?._id || conversation?.id;

  const handleSelectConversation = (conversation) => {
    onSelectConversation?.(getConversationId(conversation));
  };

  const handleSendMessage = (message) => {
    if (!selectedConversation || !message) return;
    onSendMessage?.(getConversationId(selectedConversation), message);
  };

  const handleBack = () => {
    onSelectConversation?.(null);
  };

  return (
    <CustomerWorkspace title="Messages" eyebrow="Customer workspace">
      <div className="flex h-[600px] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {/* Conversations Sidebar */}
        <aside
          className={[
            "w-full shrink-0 border-r border-[var(--line)] bg-white dark:bg-card md:w-80",
            selectedConversation ? "hidden md:block" : "block",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-[var(--line)] bg-[var(--soft)]/50 p-4">
              <span className="pill text-[10px]">Chat support</span>
              <h2 className="mt-1 text-sm font-bold text-[var(--text)] dark:text-foreground">
                All conversations
              </h2>
            </div>

            {/* Conversation List */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <EmptyState
                    title="No conversations"
                    message="Your chats with sellers and customer support will appear here."
                  />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  activeConversation={selectedConversation}
                  onSelect={handleSelectConversation}
                  onDelete={onDeleteConversation}
                />
              )}
            </div>
          </div>
        </aside>

        {/* Chat Window */}
        <div
          className={[
            "flex min-w-0 flex-1 flex-col bg-[var(--bg)]",
            !selectedConversation ? "hidden md:flex" : "flex",
          ].join(" ")}
        >
          {selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedConversation}
                onBack={handleBack}
              />

              <div className="min-h-0 flex-1 p-4 overflow-y-auto">
                <ChatWindow
                  messages={messages}
                  loading={messagesLoading}
                  currentUser={user}
                  onLoadMore={onLoadMoreMessages}
                />
              </div>

              <div className="border-t border-[var(--line)] bg-white p-3 dark:bg-card">
                <MessageInput onSend={handleSendMessage} disabled={sending} />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--soft)] text-3xl">
                💬
              </div>
              <h2 className="mt-3 text-sm font-bold text-[var(--text)]">
                Select a conversation
              </h2>
              <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">
                Choose a conversation from the left to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </CustomerWorkspace>
  );
};

export default Chat;
