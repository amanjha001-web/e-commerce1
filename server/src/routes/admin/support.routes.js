import { Router } from 'express';
import * as supportController from '../../controllers/admin/support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

const withForcedStatus = (status) => (req, res, next) => {
  req.body = { ...(req.body || {}), status };
  return supportController.updateSupportTicketStatus(req, res, next);
};

// Collection routes
router.get('/', supportController.getSupportTickets);
router.get('/tickets', supportController.getSupportTickets);

// Specific `/tickets/:ticketId` routes first
router.get('/tickets/:ticketId/history', supportController.getTicketHistory);
router.get('/tickets/:ticketId', supportController.getSupportTicketById);
router.post('/tickets/:ticketId/reply', supportController.replyToSupportTicket);
router.post('/tickets/:ticketId/notes', supportController.addInternalNote);
router.patch('/tickets/:ticketId/status', supportController.updateSupportTicketStatus);
router.patch('/tickets/:ticketId/priority', supportController.updateSupportTicketPriority);
router.patch('/tickets/:ticketId/close', withForcedStatus('closed'));
router.patch('/tickets/:ticketId/reopen', withForcedStatus('open'));
router.patch('/tickets/:ticketId/assign', supportController.assignSupportTicket);
router.delete('/tickets/:ticketId', supportController.deleteTicket);

// Direct `/:ticketId` alias routes
router.get('/:ticketId/history', supportController.getTicketHistory);
router.get('/:ticketId', supportController.getSupportTicketById);
router.post('/:ticketId/reply', supportController.replyToSupportTicket);
router.post('/:ticketId/notes', supportController.addInternalNote);
router.patch('/:ticketId/status', supportController.updateSupportTicketStatus);
router.patch('/:ticketId/priority', supportController.updateSupportTicketPriority);
router.patch('/:ticketId/close', withForcedStatus('closed'));
router.patch('/:ticketId/reopen', withForcedStatus('open'));
router.patch('/:ticketId/assign', supportController.assignSupportTicket);
router.delete('/:ticketId', supportController.deleteTicket);

export default router;
