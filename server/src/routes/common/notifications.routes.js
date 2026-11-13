import { Router } from 'express';
import * as notificationController from '../../controllers/common/notification.controller.js';
import { notificationService } from '../../services/common/notification.service.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/', asyncHandler(async (req, res) => {
  const notif = await notificationService.createNotification({
    userId: req.body.userId || req.user._id,
    title: req.body.title || 'Notification',
    message: req.body.message || '',
    type: req.body.type || 'system',
    data: req.body.data || {},
  });
  return ApiResponse.created(res, notif, 'Notification sent');
}));
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear', notificationController.clearNotifications);
router.delete('/', notificationController.clearNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.get('/:notificationId', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
