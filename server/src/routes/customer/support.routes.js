import { Router } from 'express';
import * as supportController from '../../controllers/customer/support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getMyTickets);
router.get('/tickets/:ticketId', supportController.getTicketById);
router.post('/tickets/:ticketId/messages', supportController.addMessage);
router.patch('/tickets/:ticketId/close', supportController.closeTicket);
router.patch('/tickets/:ticketId/reopen', supportController.reopenTicket);

export default router;
