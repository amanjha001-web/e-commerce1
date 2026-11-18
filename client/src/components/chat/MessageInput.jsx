import { useRef, useState } from "react";

const MessageInput = ({
  onSend,
  loading = false,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const isBusy = Boolean(loading || disabled);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = message.trim();
    if (!text || isBusy) {
      return;
    }

    const result = await onSend?.(text);
    if (result === false) {
      return;
    }
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
      className="border-t border-[var(--line)] bg-white p-3 dark:bg-card"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isBusy}
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white"
        />

        <button
          type="submit"
          disabled={!message.trim() || isBusy}
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? "Sending..." : "Send"}
        </button>
      </div>

      <p className="mt-1.5 hidden text-[11px] text-[var(--muted)] sm:block">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
};

export default MessageInput;
