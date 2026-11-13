import { Router } from 'express';
import * as supportController from '../../controllers/admin/support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', supportController.getSupportTickets);
router.get('/tickets', supportController.getSupportTickets);
router.get('/:ticketId', supportController.getSupportTicketById);
router.get('/tickets/:ticketId', supportController.getSupportTicketById);
router.post('/:ticketId/reply', supportController.replyToSupportTicket);
router.post('/tickets/:ticketId/reply', supportController.replyToSupportTicket);
router.patch('/:ticketId/status', supportController.updateSupportTicketStatus);
router.patch('/tickets/:ticketId/status', supportController.updateSupportTicketStatus);
router.patch('/:ticketId/close', (req, res, next) => { req.body.status = 'closed'; return supportController.updateSupportTicketStatus(req, res, next); });
router.patch('/tickets/:ticketId/close', (req, res, next) => { req.body.status = 'closed'; return supportController.updateSupportTicketStatus(req, res, next); });
router.patch('/:ticketId/reopen', (req, res, next) => { req.body.status = 'open'; return supportController.updateSupportTicketStatus(req, res, next); });
router.patch('/tickets/:ticketId/reopen', (req, res, next) => { req.body.status = 'open'; return supportController.updateSupportTicketStatus(req, res, next); });
router.patch('/:ticketId/priority', supportController.updateSupportTicketStatus);
router.patch('/tickets/:ticketId/priority', supportController.updateSupportTicketStatus);
router.post('/:ticketId/notes', supportController.replyToSupportTicket);
router.post('/tickets/:ticketId/notes', supportController.replyToSupportTicket);
router.get('/:ticketId/history', supportController.getSupportTicketById);
router.get('/tickets/:ticketId/history', supportController.getSupportTicketById);
router.patch('/:ticketId/assign', supportController.assignSupportTicket);
router.patch('/tickets/:ticketId/assign', supportController.assignSupportTicket);
router.delete('/:ticketId', supportController.deleteTicket);
router.delete('/tickets/:ticketId', supportController.deleteTicket);

export default router;
