import {
  getUserDisplayName,
  resolveAvatarUrl,
} from "../../utils/chatHelpers";

const MessageItem = ({ message, isOwn = false, currentUserId }) => {
  if (!message) {
    return null;
  }

  const senderId =
    message.sender?._id || message.sender?.id || message.senderId || message.sender;

  const ownMessage =
    isOwn ||
    Boolean(
      currentUserId &&
        senderId &&
        typeof senderId !== "object" &&
        String(senderId) === String(currentUserId),
    ) ||
    Boolean(
      currentUserId &&
        typeof message.sender === "object" &&
        String(message.sender._id || message.sender.id) === String(currentUserId),
    );

  const content = message.content || message.text || message.message || "";
  const timestamp = message.createdAt || message.timestamp;
  const senderName = getUserDisplayName(message.sender, "User");
  const senderAvatar = resolveAvatarUrl(message.sender?.avatar);
  const isRead = Boolean(message.isRead ?? message.read);

  return (
    <div
      className={`flex w-full ${ownMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] gap-2 sm:max-w-[68%] ${
          ownMessage ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!ownMessage && (
          senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="h-8 w-8 shrink-0 rounded-full border border-[var(--line)] object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] text-xs font-bold text-[var(--primary)]">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-2xs ${
            ownMessage
              ? "rounded-br-md bg-[var(--primary)] text-white"
              : "rounded-bl-md border border-[var(--line)] bg-white text-[var(--text)] dark:bg-card"
          }`}
        >
          {message.replyTo && (
            <div
              className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${
                ownMessage
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-[var(--primary)] bg-[var(--soft)] text-[var(--muted)]"
              }`}
            >
              {message.replyTo.content ||
                message.replyTo.text ||
                "Replied message"}
            </div>
          )}

          {content && (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {content}
            </p>
          )}

          {Array.isArray(message.attachments) &&
            message.attachments.map((att, idx) =>
              att?.url ? (
                <a
                  key={att.publicId || idx}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-2 block text-xs font-medium underline ${
                    ownMessage ? "text-white" : "text-[var(--primary)]"
                  }`}
                >
                  📎 {att.fileType || "Attachment"}
                </a>
              ) : null,
            )}

          {message.image && (
            <img
              src={message.image}
              alt="Message attachment"
              className="mt-2 max-h-64 max-w-full rounded-lg object-cover"
            />
          )}

          {message.file && (
            <a
              href={message.file.url || message.file}
              target="_blank"
              rel="noreferrer"
              className={`mt-2 block text-xs font-medium underline ${
                ownMessage ? "text-white" : "text-[var(--primary)]"
              }`}
            >
              📎 {message.file.name || "Attachment"}
            </a>
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              ownMessage ? "text-white/75" : "text-[var(--muted)]"
            }`}
          >
            {timestamp && (
              <span>
                {new Date(timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            {ownMessage && (
              <span>{isRead ? "✓✓" : "✓"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
