import { Router } from 'express';
import { adminOnlyRoute, protectedRoute } from '../../middlewares.js';
import {
  generateLoginOTP,
  getAllCustomers,
  getLogedInCustomer,
  loginCustomer,
  logoutCustomer,
  refreshTokens,
  updateCustomer,
} from './controller.js';

const customerRouter = Router();

customerRouter.post('/generate-login-otp', generateLoginOTP);
customerRouter.post('/login', loginCustomer);
customerRouter.get('/me', protectedRoute, getLogedInCustomer);
customerRouter.get('/', protectedRoute, adminOnlyRoute, getAllCustomers);
customerRouter.patch('/:id', protectedRoute, adminOnlyRoute, updateCustomer);
customerRouter.post('/me/logout', protectedRoute, logoutCustomer);
customerRouter.post('/me/refresh-tokens', refreshTokens);

export default customerRouter;
