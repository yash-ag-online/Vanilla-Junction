import { Router } from 'express';
import { adminOnlyRoute, protectedRoute } from '../../middlewares.js';
import { failPaymentById, getAllPayments, verifyPaymentById } from './controller.js';

const paymentRouter = Router();

paymentRouter.get('/', protectedRoute, adminOnlyRoute, getAllPayments);
paymentRouter.post('/:id/payment-failure', failPaymentById);
paymentRouter.post('/:id', verifyPaymentById);

export default paymentRouter;
