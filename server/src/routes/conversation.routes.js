import { Router } from "express";

import { conversationController } from "../controllers/index.js";

import { authMiddleware as verifyJWT, validate } from "../middlewares/index.js";

import conversationValidator from "../validators/conversation.validator.js";

const router = Router();

/*                    Create Conversation                              */

router.post(
  "/",
  verifyJWT,
  validate(conversationValidator.createConversationSchema),
  conversationController.createConversation,
);

/*                    Get My Conversations                             */

router.get(
  "/",
  verifyJWT,
  validate(conversationValidator.conversationQuerySchema),
  conversationController.getMyConversations,
);

/*                    Get Conversation By Id                            */

router.get(
  "/:conversationId",
  verifyJWT,
  validate(conversationValidator.conversationIdSchema),
  conversationController.getConversationById,
);

/*                    Update Conversation                              */

router.patch(
  "/:conversationId",
  verifyJWT,
  validate(
    conversationValidator.conversationIdSchema.merge(
      conversationValidator.updateConversationSchema,
    ),
  ),
  conversationController.updateConversation,
);

/*                    Close Conversation                               */

router.patch(
  "/:conversationId/close",
  verifyJWT,
  validate(conversationValidator.conversationIdSchema),
  conversationController.closeConversation,
);

/*                    Delete Conversation                              */

router.delete(
  "/:conversationId",
  verifyJWT,
  validate(conversationValidator.conversationIdSchema),
  conversationController.deleteConversation,
);

export default router;
