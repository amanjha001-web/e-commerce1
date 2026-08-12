import { Router } from "express";

import {chatController} from "../controllers/index.js";

import {authMiddleware as verifyJWT} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  chatValidator
} from "../validators/index.js";

const router = Router();

/*                              Create Chat                                   */

router.post(
  "/",
  verifyJWT,
  validate(chatValidator.createChatSchema),
  chatController.createChat,
);

/*                              Get Chat By Id                                */

router.get(
  "/:chatId",
  verifyJWT,
  validate(chatValidator.chatIdSchema),
  chatController.getChatById,
);

/*                     Get Chats By Conversation                             */

router.get(
  "/conversation/:conversationId",
  verifyJWT,
  validate(chatValidator.conversationIdSchema),
  chatController.getChatsByConversation,
);

/*                             Get User Chats                                */

router.get(
  "/user/:userId",
  verifyJWT,
  validate(chatValidator.userIdSchema),
  chatController.getUserChats,
);

/*                              Update Chat                                  */

router.patch(
  "/:chatId",
  verifyJWT,
  validate(chatValidator.chatIdSchema.merge(chatValidator.updateChatSchema)),
  chatController.updateChat,
);

/*                         Update Presence                                   */

router.patch(
  "/presence/:conversationId/:userId",
  verifyJWT,
  validate(
    chatValidator.conversationUserSchema.merge(
      chatValidator.updatePresenceSchema,
    ),
  ),
  chatController.updatePresence,
);

/*                          Online Users                                     */

router.get(
  "/online/:conversationId",
  verifyJWT,
  validate(chatValidator.conversationIdSchema),
  chatController.getOnlineUsers,
);

/*                      Online Users Count                                   */

router.get(
  "/online/:conversationId/count",
  verifyJWT,
  validate(chatValidator.conversationIdSchema),
  chatController.getOnlineUsersCount,
);

/*                              Delete Chat                                  */

router.delete(
  "/:chatId",
  verifyJWT,
  validate(chatValidator.chatIdSchema),
  chatController.deleteChat,
);

export default router;
