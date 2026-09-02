import ConversationList from "../../components/chat/ConversationList";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatWindow from "../../components/chat/ChatWindow";
import MessageInput from "../../components/chat/MessageInput";

import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

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
    <main className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Conversations */}
        <aside
          className={[
            "w-full shrink-0 border-r border-border md:w-80",
            selectedConversation ? "hidden md:block" : "block",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="border-b border-border p-5">
              <p className="text-sm font-medium text-primary">
                Customer Support
              </p>

              <h1 className="mt-1 text-xl font-bold">Messages</h1>

              <p className="mt-1 text-xs text-muted-foreground">
                Chat with vendors and support.
              </p>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[250px] items-center justify-center">
                  <Loader />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No conversations"
                    description="Your conversations will appear here."
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

            {/* Back Home */}
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => onNavigate?.("/")}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </aside>

        {/* Chat Section */}
        <section
          className={[
            "min-w-0 flex-1",
            selectedConversation ? "block" : "hidden md:block",
          ].join(" ")}
        >
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting."
              />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Chat Header */}
              <div className="border-b border-border">
                <ChatHeader
                  conversation={selectedConversation}
                  user={user}
                  onBack={handleBack}
                  onNavigate={onNavigate}
                />
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-8">
                    <EmptyState
                      title="No messages yet"
                      description="Send a message to start the conversation."
                    />
                  </div>
                ) : (
                  <ChatWindow
                    messages={messages}
                    user={user}
                    conversation={selectedConversation}
                    loading={messagesLoading}
                    onLoadMore={onLoadMoreMessages}
                  />
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <MessageInput
                  onSend={handleSendMessage}
                  loading={sending}
                  disabled={!selectedConversation}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Chat;
