import { Router } from "express";

import { messageController } from "../controllers/index.js";

import { authMiddleware as verifyJWT, validate } from "../middlewares/index.js";

import messageValidator from "../validators/message.validator.js";

const router = Router();

/*                         Create Message                         */

router.post(
  "/",
  verifyJWT,
  validate(messageValidator.createMessageSchema),
  messageController.createMessage,
);

/*                       Get Message By Id                       */

router.get(
  "/:messageId",
  verifyJWT,
  validate(messageValidator.messageIdSchema),
  messageController.getMessageById,
);

/*                 Get Messages By Conversation                 */

router.get(
  "/conversation/:conversationId",
  verifyJWT,
  validate(messageValidator.conversationIdSchema),
  validate(messageValidator.messageQuerySchema),
  messageController.getMessagesByConversation,
);

/*                         Update Message                         */

router.patch(
  "/:messageId",
  verifyJWT,
  validate(
    messageValidator.messageIdSchema.merge(
      messageValidator.updateMessageSchema,
    ),
  ),
  messageController.updateMessage,
);

/*                         Delete Message                         */

router.delete(
  "/:messageId",
  verifyJWT,
  validate(messageValidator.messageIdSchema),
  messageController.deleteMessage,
);

export default router;
