import {
  getConversationParticipant,
  getUserDisplayName,
  resolveAvatarUrl,
} from "../../utils/chatHelpers";

const ChatHeader = ({
  conversation = null,
  currentUserId,
  onBack,
  onClose,
  onDelete,
}) => {
  const participant = getConversationParticipant(conversation, currentUserId);
  const name = getUserDisplayName(
    participant,
    conversation?.name || "Customer Support",
  );
  const avatar =
    resolveAvatarUrl(participant?.avatar) ||
    resolveAvatarUrl(conversation?.avatar);
  const isOnline = conversation?.isOnline ?? participant?.isOnline ?? false;
  const roleLabel =
    participant?.role === "vendor"
      ? "Verified Seller"
      : ["admin", "super_admin"].includes(String(participant?.role || "").toLowerCase())
        ? "Customer Support"
        : isOnline
          ? "Online"
          : "ShopSphere Member";

  return (
    <div className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-4 dark:bg-card">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-lg p-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--soft)] md:hidden"
            aria-label="Go back"
          >
            ←
          </button>
        )}

        <div className="flex min-w-0 items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-full border border-[var(--line)] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] text-sm font-bold text-[var(--primary)]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-[var(--text)] dark:text-white">
              {name}
            </h2>

            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-[var(--gold)]"
                }`}
              />
              <span className="truncate text-xs text-[var(--muted)]">
                {participant?.email ? `${roleLabel} · ${participant.email}` : roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {onDelete && conversation && (
          <button
            type="button"
            onClick={() => onDelete(conversation._id || conversation.id)}
            className="cursor-pointer rounded-lg border border-[var(--line)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--soft)]"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
