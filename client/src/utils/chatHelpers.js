const isObject = (val) =>
  Boolean(val) && typeof val === "object" && !Array.isArray(val);

export const resolveAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (typeof avatar === "string") return avatar.trim() || null;
  if (isObject(avatar) && typeof avatar.url === "string") {
    return avatar.url.trim() || null;
  }
  return null;
};

export const getUserDisplayName = (user, fallback = "Conversation") => {
  if (!isObject(user)) return fallback;
  const direct =
    user.fullName ||
    user.name ||
    user.storeName ||
    user.username;
  if (direct && String(direct).trim()) return String(direct).trim();
  if (user.email && String(user.email).includes("@")) {
    return String(user.email).split("@")[0];
  }
  return fallback;
};

export const getConversationParticipant = (conversation, currentUserId) => {
  if (!isObject(conversation)) return null;

  if (Array.isArray(conversation.participants) && conversation.participants.length > 0) {
    const objectParticipants = conversation.participants.filter(isObject);
    if (currentUserId) {
      const other = objectParticipants.find(
        (p) => String(p._id || p.id) !== String(currentUserId),
      );
      if (other) return other;
    }
    if (objectParticipants[0]) return objectParticipants[0];
  }

  return (
    (isObject(conversation.user) && conversation.user) ||
    (isObject(conversation.vendor) && conversation.vendor) ||
    (isObject(conversation.participant) && conversation.participant) ||
    null
  );
};

export const extractConversationsList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.conversations)) return res.data.conversations;
  if (Array.isArray(res?.conversations)) return res.conversations;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const extractConversationObject = (res) => {
  if (!res) return null;
  if (res?.data?.conversation) return res.data.conversation;
  if (res?.conversation) return res.conversation;
  if (res?.data?._id) return res.data;
  if (res?._id) return res;
  return res?.data || res;
};

export const extractMessagesList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.messages)) return res.data.messages;
  if (Array.isArray(res?.messages)) return res.messages;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const extractMessageObject = (res) => {
  if (!res) return null;
  if (res?.data?.message && isObject(res.data.message)) return res.data.message;
  if (res?.message && isObject(res.message)) return res.message;
  if (res?.data?._id) return res.data;
  if (res?._id) return res;
  return res?.data || res;
};
