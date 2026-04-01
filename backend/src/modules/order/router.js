import { Router } from 'express';
import { adminAndDeliveryPersonOnlyRoute, protectedRoute } from '../../middlewares.js';
import {
  acceptDelivery,
  cancelOrderbyId,
  createOrder,
  gerOrderbyId,
  getAllOrders,
  verifyDeliveryOTP,
} from './controller.js';

const orderRouter = Router();

orderRouter.post('/', createOrder);
orderRouter.get('/', protectedRoute, adminAndDeliveryPersonOnlyRoute, getAllOrders);
orderRouter.get('/:id', gerOrderbyId);
orderRouter.post('/:id/accept-delivery', protectedRoute, adminAndDeliveryPersonOnlyRoute, acceptDelivery);
orderRouter.post('/:id/verify-otp', protectedRoute, adminAndDeliveryPersonOnlyRoute, verifyDeliveryOTP);
orderRouter.post('/:id/cancel', cancelOrderbyId);

export default orderRouter;
