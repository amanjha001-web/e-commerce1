import ConversationItem from "./ConversationItem";
import {
  getConversationParticipant,
  getUserDisplayName,
} from "../../utils/chatHelpers";

const ConversationList = ({
  conversations = [],
  activeConversation = null,
  activeConversationId,
  currentUserId,
  onSelect,
  onDelete,
  loading = false,
  search = "",
  onSearchChange,
  embedded = false,
}) => {
  const resolvedActiveId =
    activeConversationId || activeConversation?._id || activeConversation?.id;

  const filteredConversations = conversations.filter((conversation) => {
    if (!search.trim()) {
      return true;
    }

    const participant = getConversationParticipant(conversation, currentUserId);
    const name = getUserDisplayName(participant, conversation?.name || "");
    const lastText =
      conversation?.lastMessage?.content ||
      conversation?.lastMessage?.text ||
      "";

    return `${name} ${lastText}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  const body = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {loading ? (
        <div className="space-y-1 p-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex animate-pulse gap-3 rounded-lg p-3"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-[var(--soft)]" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-[var(--soft)]" />
                <div className="h-3 w-full rounded bg-[var(--soft)]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
          <div>
            <div className="text-3xl">💬</div>

            <h3 className="mt-2 text-sm font-bold text-[var(--text)]">
              No conversations found
            </h3>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {search.trim()
                ? "Try a different search keyword."
                : "Your conversations will appear here."}
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
              currentUserId={currentUserId}
              isActive={
                Boolean(resolvedActiveId) &&
                String(resolvedActiveId) === String(conversationId)
              }
              onClick={onSelect}
              onDelete={onDelete}
            />
          );
        })
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full flex-col">
        {onSearchChange && (
          <div className="border-b border-[var(--line)] px-3 py-2.5">
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
          </div>
        )}
        {body}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white dark:bg-card">
      <div className="border-b border-[var(--line)] p-4">
        <h2 className="text-base font-bold text-[var(--text)] dark:text-white">
          Messages
        </h2>

        {onSearchChange && (
          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {body}
    </div>
  );
};

export default ConversationList;
