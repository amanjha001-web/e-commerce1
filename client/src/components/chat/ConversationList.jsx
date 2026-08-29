import ConversationItem from "./ConversationItem";

const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelect,
  loading = false,
  search = "",
  onSearchChange,
}) => {
  const filteredConversations = conversations.filter((conversation) => {
    if (!search.trim()) {
      return true;
    }

    const user =
      conversation.user || conversation.vendor || conversation.participant;

    const name = user?.fullName || user?.name || conversation.name || "";

    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Messages
        </h2>

        {onSearchChange && (
          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex animate-pulse gap-3 rounded-lg p-3"
              >
                <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-full min-h-64 items-center justify-center px-6 text-center">
            <div>
              <div className="text-4xl">💬</div>

              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                No conversations
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your conversations will appear here.
              </p>
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const conversationId = conversation._id || conversation.id;

            return (
              <ConversationItem
                key={conversationId}
                conversation={conversation}
                isActive={activeConversationId === conversationId}
                onClick={onSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
