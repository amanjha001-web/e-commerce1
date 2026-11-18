import { Router } from 'express';
import * as chatController from '../../controllers/common/chat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/contacts', chatController.getAvailableContacts);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId', chatController.getConversationById);
router.delete('/conversations/:conversationId', chatController.deleteConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markConversationAsRead);
router.post('/conversations/:conversationId/attachments', upload.single('file'), chatController.uploadAttachment);

router.patch('/messages/:messageId/read', chatController.markMessageAsRead);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.get('/unread-count', chatController.getUnreadCount);

export default router;
