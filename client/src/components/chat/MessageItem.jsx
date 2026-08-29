const MessageItem = ({ message, isOwn = false, currentUserId }) => {
  if (!message) {
    return null;
  }

  const senderId =
    message.sender?._id || message.sender?.id || message.senderId;

  const ownMessage =
    isOwn ||
    (currentUserId && senderId && String(senderId) === String(currentUserId));

  const content = message.content || message.text || message.message || "";

  const timestamp = message.createdAt || message.timestamp;

  const senderName = message.sender?.fullName || message.sender?.name || "User";

  return (
    <div
      className={`flex w-full ${ownMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] gap-2 sm:max-w-[65%] ${
          ownMessage ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!ownMessage && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {senderName.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 ${
            ownMessage
              ? "rounded-br-md bg-blue-600 text-white"
              : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          }`}
        >
          {message.replyTo && (
            <div
              className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${
                ownMessage
                  ? "border-blue-200 bg-blue-700/50 text-blue-100"
                  : "border-gray-400 bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
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
                ownMessage
                  ? "text-blue-100"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              📎 {message.file.name || "Attachment"}
            </a>
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              ownMessage ? "text-blue-100" : "text-gray-400"
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
              <span className={message.read ? "text-blue-200" : ""}>
                {message.read ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
