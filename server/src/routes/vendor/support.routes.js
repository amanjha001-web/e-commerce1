import { Router } from 'express';
import * as vendorSupportController from '../../controllers/vendor/support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

// Primary `/vendor/support/tickets*` routes
router.get('/tickets', vendorSupportController.getTickets);
router.post('/tickets', vendorSupportController.createTicket);
router.get('/tickets/:ticketId', vendorSupportController.getTicketById);
router.post('/tickets/:ticketId/messages', vendorSupportController.addMessage);
router.patch('/tickets/:ticketId/close', vendorSupportController.closeTicket);
router.patch('/tickets/:ticketId/reopen', vendorSupportController.reopenTicket);

// Direct `/vendor/support*` root aliases
router.get('/', vendorSupportController.getTickets);
router.post('/', vendorSupportController.createTicket);
router.get('/:ticketId', vendorSupportController.getTicketById);
router.post('/:ticketId/messages', vendorSupportController.addMessage);
router.patch('/:ticketId/close', vendorSupportController.closeTicket);
router.patch('/:ticketId/reopen', vendorSupportController.reopenTicket);

export default router;
