import { Router } from 'express';
import * as supportController from '../../controllers/admin/support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/tickets', supportController.getSupportTickets);
router.get('/tickets/:ticketId', supportController.getSupportTicketById);
router.post('/tickets/:ticketId/reply', supportController.replyToSupportTicket);
router.patch('/tickets/:ticketId/status', supportController.updateSupportTicketStatus);
router.patch('/tickets/:ticketId/assign', supportController.assignSupportTicket);
router.delete('/tickets/:ticketId', supportController.deleteTicket);

export default router;
