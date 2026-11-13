import { Router } from 'express';
import * as notificationController from '../../controllers/common/notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);

export default router;
