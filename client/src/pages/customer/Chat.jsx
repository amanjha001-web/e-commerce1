import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactReduxContext } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import chatService from "../../services/chat.service";
import ConversationList from "../../components/chat/ConversationList";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";
import {
  extractConversationObject,
  extractConversationsList,
  extractMessageObject,
  extractMessagesList,
  resolveAvatarUrl,
} from "../../utils/chatHelpers";

const getConversationId = (conversation) =>
  conversation?._id || conversation?.id || null;

const Chat = ({
  conversations: propConversations = null,
  messages: propMessages = null,
  activeConversation: propActiveConversation = null,
  loading: propLoading = false,
  messagesLoading: propMessagesLoading = false,
  sending: propSending = false,
  user: propUser = null,
  onSelectConversation,
  onSendMessage,
  onDeleteConversation,
  onNavigate,
}) => {
  const { conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();
  const reduxCtx = useContext(ReactReduxContext);
  const fetchedRouteIdRef = useRef(null);

  const [authUser, setAuthUser] = useState(
    () => propUser || reduxCtx?.store?.getState()?.auth?.user || null,
  );

  useEffect(() => {
    if (propUser) {
      setAuthUser(propUser);
      return undefined;
    }
    const store = reduxCtx?.store;
    if (!store) return undefined;
    setAuthUser(store.getState()?.auth?.user || null);
    return store.subscribe(() => {
      setAuthUser(store.getState()?.auth?.user || null);
    });
  }, [propUser, reduxCtx]);

  const currentUser = propUser || authUser;
  const currentUserId = currentUser?._id || currentUser?.id || null;

  const isControlledConversations = Array.isArray(propConversations);
  const isControlledMessages = Array.isArray(propMessages);

  const [internalConversations, setInternalConversations] = useState([]);
  const [internalMessages, setInternalMessages] = useState([]);
  const [internalActiveConv, setInternalActiveConv] = useState(null);
  const [internalLoading, setInternalLoading] = useState(!isControlledConversations);
  const [internalMessagesLoading, setInternalMessagesLoading] = useState(false);
  const [internalSending, setInternalSending] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");

  // Start new chat modal state
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [startingChat, setStartingChat] = useState(false);

  const conversations = isControlledConversations
    ? propConversations
    : internalConversations;
  const messages = isControlledMessages ? propMessages : internalMessages;
  const selectedConversation =
    propActiveConversation !== null ? propActiveConversation : internalActiveConv;
  const activeConvId = getConversationId(selectedConversation);
  const loading = propLoading || internalLoading;
  const messagesLoading = propMessagesLoading || internalMessagesLoading;
  const sending = propSending || internalSending;

  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (isControlledConversations) return;
      try {
        if (!silent) {
          setInternalLoading(true);
          setFetchError("");
        }
        const res = await chatService.getConversations();
        const list = extractConversationsList(res);
        setInternalConversations(list);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        if (!silent) {
          setFetchError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load conversations.",
          );
          setInternalConversations([]);
        }
      } finally {
        if (!silent) setInternalLoading(false);
      }
    },
    [isControlledConversations],
  );

  const loadMessages = useCallback(
    async (convId, { silent = false, signal = null } = {}) => {
      if (!convId || isControlledMessages) return;
      try {
        if (!silent) setInternalMessagesLoading(true);
        const res = await chatService.getMessages(convId);
        if (signal?.cancelled) return;

        const nextMessages = extractMessagesList(res);
        setInternalMessages((prev) => {
          if (
            silent &&
            prev.length === nextMessages.length &&
            (prev[prev.length - 1]?._id || prev[prev.length - 1]?.id) ===
              (nextMessages[nextMessages.length - 1]?._id ||
                nextMessages[nextMessages.length - 1]?.id)
          ) {
            return prev;
          }
          return nextMessages;
        });

        chatService.markConversationAsRead(convId).catch(() => {});
        setInternalConversations((prev) => {
          const needsClear = prev.some(
            (c) =>
              String(getConversationId(c)) === String(convId) &&
              Number(c.unreadCount || 0) > 0,
          );
          if (!needsClear) return prev;
          return prev.map((c) =>
            String(getConversationId(c)) === String(convId)
              ? { ...c, unreadCount: 0 }
              : c,
          );
        });
      } catch (err) {
        if (signal?.cancelled) return;
        console.error("Failed to fetch messages:", err);
        if (!silent) {
          toast.error(
            err?.response?.data?.message || "Failed to load messages",
          );
        }
      } finally {
        if (!silent && !signal?.cancelled) {
          setInternalMessagesLoading(false);
        }
      }
    },
    [isControlledMessages],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Sync selected conversation cleanly with URL param without re-triggering message fetches
  useEffect(() => {
    if (propActiveConversation !== null) return;

    if (!routeConversationId) {
      fetchedRouteIdRef.current = null;
      return;
    }

    const match = conversations.find(
      (c) => String(getConversationId(c)) === String(routeConversationId),
    );
    if (match) {
      fetchedRouteIdRef.current = routeConversationId;
      setInternalActiveConv((prev) =>
        String(getConversationId(prev)) === String(routeConversationId)
          ? prev
          : match,
      );
      return;
    }

    if (
      !isControlledConversations &&
      !internalLoading &&
      fetchedRouteIdRef.current !== routeConversationId
    ) {
      fetchedRouteIdRef.current = routeConversationId;
      chatService
        .getConversationById(routeConversationId)
        .then((res) => {
          const conv = extractConversationObject(res);
          if (conv?._id) {
            setInternalActiveConv(conv);
            setInternalConversations((prev) =>
              prev.some((c) => String(getConversationId(c)) === String(conv._id))
                ? prev
                : [conv, ...prev],
            );
          }
        })
        .catch(() => {
          toast.error("Conversation not found");
          navigate("/chat", { replace: true });
        });
    }
  }, [
    routeConversationId,
    conversations,
    propActiveConversation,
    isControlledConversations,
    internalLoading,
    navigate,
  ]);

  // Fetch messages ONLY when activeConvId changes + keep open chat polled silently
  useEffect(() => {
    if (!activeConvId || isControlledMessages) {
      if (!activeConvId && !isControlledMessages) {
        setInternalMessages([]);
        setInternalMessagesLoading(false);
      }
      return undefined;
    }

    const signal = { cancelled: false };
    setInternalMessages([]);
    loadMessages(activeConvId, { silent: false, signal });

    const timer = setInterval(() => {
      loadMessages(activeConvId, { silent: true, signal });
    }, 5000);

    return () => {
      signal.cancelled = true;
      clearInterval(timer);
    };
  }, [activeConvId, isControlledMessages, loadMessages]);

  const handleSelectConversation = (conversation) => {
    const convId =
      typeof conversation === "string"
        ? conversation
        : getConversationId(conversation);

    if (onSelectConversation) {
      onSelectConversation(convId || null);
      return;
    }

    if (!convId) {
      setInternalActiveConv(null);
      setInternalMessages([]);
      if (routeConversationId) navigate("/chat");
      return;
    }

    const found =
      (typeof conversation === "object" && conversation) ||
      conversations.find((c) => String(getConversationId(c)) === String(convId)) ||
      null;

    setInternalActiveConv(found);
    if (String(routeConversationId || "") !== String(convId)) {
      navigate(`/chat/${convId}`);
    }
  };

  const handleSendMessage = async (text) => {
    const cleanText = String(text || "").trim();
    if (!activeConvId || !cleanText) return false;

    if (onSendMessage) {
      return onSendMessage(activeConvId, cleanText);
    }

    try {
      setInternalSending(true);
      const res = await chatService.sendMessage(activeConvId, {
        content: cleanText,
      });
      const createdMsg = extractMessageObject(res);

      if (createdMsg) {
        setInternalMessages((prev) => {
          const msgId = createdMsg._id || createdMsg.id;
          if (msgId && prev.some((m) => String(m._id || m.id) === String(msgId))) {
            return prev;
          }
          return [...prev, createdMsg];
        });
      }

      setInternalConversations((prev) => {
        const updated = prev.map((c) =>
          String(getConversationId(c)) === String(activeConvId)
            ? {
                ...c,
                lastMessage: createdMsg || { content: cleanText },
                updatedAt: new Date().toISOString(),
              }
            : c,
        );
        return updated.sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
      });
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
      return false;
    } finally {
      setInternalSending(false);
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!convId) return;
    if (onDeleteConversation) {
      onDeleteConversation(convId);
      return;
    }

    try {
      await chatService.deleteConversation(convId);
      toast.success("Conversation removed");
      setInternalConversations((prev) =>
        prev.filter((c) => String(getConversationId(c)) !== String(convId)),
      );
      if (String(activeConvId) === String(convId)) {
        setInternalActiveConv(null);
        setInternalMessages([]);
        if (routeConversationId) navigate("/chat");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete conversation",
      );
    }
  };

  const handleOpenNewChatModal = async () => {
    setNewChatOpen(true);
    setContactSearch("");
    try {
      setContactsLoading(true);
      const res = await chatService.getContacts();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setContacts(list);
    } catch (err) {
      console.error("Failed to fetch chat contacts:", err);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleStartConversation = async (payload) => {
    try {
      setStartingChat(true);
      const res = await chatService.createConversation(payload);
      const created = extractConversationObject(res);
      const createdId = getConversationId(created);
      if (!createdId) {
        toast.error("Unable to open conversation");
        return;
      }

      setInternalConversations((prev) => {
        const exists = prev.some(
          (c) => String(getConversationId(c)) === String(createdId),
        );
        return exists ? prev : [created, ...prev];
      });
      setNewChatOpen(false);
      handleSelectConversation(created);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "No support or seller contact available right now",
      );
    } finally {
      setStartingChat(false);
    }
  };

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.name} ${c.label} ${c.email || ""}`.toLowerCase().includes(q),
    );
  }, [contacts, contactSearch]);

  const handleBack = () => {
    handleSelectConversation(null);
    if (onNavigate) onNavigate("/chat");
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
              <div className="flex items-center justify-between gap-2">
                <span className="pill text-[10px]">Chat support</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => loadConversations()}
                    title="Refresh conversations"
                    className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--soft)] disabled:opacity-50"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNewChatModal}
                    className="btnsm cursor-pointer !px-2.5 !py-1 !text-[11px]"
                  >
                    + New Chat
                  </button>
                </div>
              </div>
              <h2 className="mt-1.5 text-sm font-bold text-[var(--text)] dark:text-foreground">
                All conversations
              </h2>
            </div>

            {/* Conversation List */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {loading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader />
                </div>
              ) : fetchError ? (
                <div className="overflow-y-auto p-6 text-center">
                  <EmptyState
                    title="Unable to load messages"
                    message={fetchError}
                    action={() => loadConversations()}
                    actionText="Try Again"
                  />
                </div>
              ) : conversations.length === 0 ? (
                <div className="overflow-y-auto p-6 text-center">
                  <EmptyState
                    title="No conversations"
                    message="Your chats with sellers and customer support will appear here."
                    action={() => handleStartConversation({ type: "support" })}
                    actionText={
                      startingChat ? "Starting..." : "Chat with Support"
                    }
                  />
                </div>
              ) : (
                <ConversationList
                  embedded
                  conversations={conversations}
                  activeConversation={selectedConversation}
                  currentUserId={currentUserId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelect={handleSelectConversation}
                  onDelete={handleDeleteConversation}
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
                currentUserId={currentUserId}
                onBack={handleBack}
                onDelete={handleDeleteConversation}
              />

              <div className="min-h-0 flex-1 overflow-hidden bg-[var(--bg)]/40">
                <MessageList
                  messages={messages}
                  currentUserId={currentUserId}
                  loading={messagesLoading}
                />
              </div>

              <MessageInput
                onSend={handleSendMessage}
                loading={sending}
                disabled={sending}
              />
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
                Choose a conversation from the left or start a new chat with Customer Support or a Seller.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={startingChat}
                  onClick={() => handleStartConversation({ type: "support" })}
                  className="primarybtn cursor-pointer disabled:opacity-50"
                >
                  {startingChat ? "Starting..." : "Chat with Support"}
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewChatModal}
                  className="outlinebtn cursor-pointer"
                >
                  Browse Sellers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start New Chat Modal */}
      {newChatOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewChatOpen(false);
          }}
        >
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div className="modalhead">
              <h2>Start a Conversation</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setNewChatOpen(false)}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              className="field full"
              placeholder="Search customer support or sellers..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {contactsLoading ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]">
                  Loading contacts...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--muted)]">
                  No matching contacts available.
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const avatarUrl = resolveAvatarUrl(contact.avatar);
                  return (
                    <button
                      key={contact._id}
                      type="button"
                      disabled={startingChat}
                      onClick={() =>
                        handleStartConversation({ recipientId: contact._id })
                      }
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-left transition hover:border-[var(--primary)] hover:bg-[var(--soft)]/40 disabled:opacity-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={contact.name}
                            className="h-9 w-9 shrink-0 rounded-full border border-[var(--line)] object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] text-xs font-bold text-[var(--primary)]">
                            {String(contact.name || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[var(--text)]">
                            {contact.name}
                          </div>
                          <div className="truncate text-[11px] text-[var(--muted)]">
                            {contact.label}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[var(--primary)]">
                        Message →
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </CustomerWorkspace>
  );
};

export default Chat;
