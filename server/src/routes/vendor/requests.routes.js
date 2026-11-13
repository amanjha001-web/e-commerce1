import { Router } from 'express';
import * as vendorRequestController from '../../controllers/vendor/request.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', vendorRequestController.createRequest);
router.get('/me', vendorRequestController.getMyRequest);
router.get('/my-requests', vendorRequestController.getMyRequests);
router.patch('/:requestId/cancel', vendorRequestController.cancelRequest);

export default router;
