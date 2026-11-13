import { notificationService } from '../../services/common/notification.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Notifications retrieved');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);
  return ApiResponse.success(res, result, 'Unread count retrieved');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.notificationId, req.user._id);
  return ApiResponse.success(res, notification, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return ApiResponse.success(res, result, 'All notifications marked as read');
});
