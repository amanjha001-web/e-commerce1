import { useRef, useState } from "react";

const MessageInput = ({
  onSend,
  loading = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = message.trim();

    if (!text || loading) {
      return;
    }

    await onSend?.(text);

    setMessage("");

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSubmit(event);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        <button
          type="submit"
          disabled={!message.trim() || loading}
          className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <p className="mt-1.5 hidden text-[11px] text-gray-400 sm:block">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
};

export default MessageInput;
