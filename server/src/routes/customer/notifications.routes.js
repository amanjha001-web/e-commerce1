import { Router } from 'express';
import * as notificationController from '../../controllers/common/notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear', notificationController.clearNotifications);
router.delete('/', notificationController.clearNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.get('/:notificationId', notificationController.getNotificationById);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
