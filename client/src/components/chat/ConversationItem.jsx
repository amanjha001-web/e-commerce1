import { Link } from "react-router-dom";
import {
  getConversationParticipant,
  getUserDisplayName,
  resolveAvatarUrl,
} from "../../utils/chatHelpers";

const ConversationItem = ({
  conversation,
  isActive = false,
  currentUserId,
  onClick,
  onDelete,
}) => {
  if (!conversation) {
    return null;
  }

  const participant = getConversationParticipant(conversation, currentUserId);
  const name = getUserDisplayName(
    participant,
    conversation.name || "Customer Support",
  );
  const avatar =
    resolveAvatarUrl(participant?.avatar) ||
    resolveAvatarUrl(conversation.avatar);

  const lastMessage =
    conversation.lastMessage?.content ||
    conversation.lastMessage?.text ||
    conversation.lastMessage?.message ||
    (typeof conversation.lastMessage === "string"
      ? conversation.lastMessage
      : "") ||
    "No messages yet";

  const unreadCount = Number(conversation.unreadCount || 0);
  const isOnline = conversation.isOnline ?? participant?.isOnline ?? false;
  const conversationId = conversation._id || conversation.id;
  const roleLabel =
    participant?.role === "vendor"
      ? "Seller"
      : ["admin", "super_admin"].includes(String(participant?.role || "").toLowerCase())
        ? "Support"
        : "";

  return (
    <div
      className={`group relative flex items-center border-b border-[var(--line)] transition ${
        isActive
          ? "border-l-[3px] border-l-[var(--primary)] bg-[var(--soft)]/70"
          : "hover:bg-[var(--bg)]/70"
      }`}
    >
      <Link
        to={conversationId ? `/chat/${conversationId}` : "#"}
        onClick={(event) => {
          if (onClick) {
            event.preventDefault();
            onClick(conversation);
          } else if (!conversationId) {
            event.preventDefault();
          }
        }}
        className="flex min-w-0 flex-1 gap-3 px-4 py-3"
      >
        <div className="relative shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-11 w-11 rounded-full border border-[var(--line)] object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--soft)] text-sm font-bold text-[var(--primary)]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
              isOnline ? "bg-emerald-500" : "bg-stone-300"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3
                className={`truncate text-sm ${
                  unreadCount > 0
                    ? "font-bold text-[var(--text)]"
                    : "font-semibold text-[var(--text)]"
                }`}
              >
                {name}
              </h3>
              {roleLabel && (
                <span className="shrink-0 rounded-full bg-[var(--soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                  {roleLabel}
                </span>
              )}
            </div>

            {conversation.updatedAt && (
              <span className="shrink-0 text-[11px] text-[var(--muted)]">
                {new Date(conversation.updatedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p
              className={`truncate text-xs ${
                unreadCount > 0
                  ? "font-semibold text-[var(--text)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {lastMessage}
            </p>

            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>

      {onDelete && conversationId && (
        <button
          type="button"
          title="Remove conversation"
          aria-label="Remove conversation"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversationId);
          }}
          className="mr-2 hidden h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs text-[var(--muted)] hover:bg-red-50 hover:text-red-600 group-hover:flex"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ConversationItem;
