import { Router } from 'express';
import { adminOnlyRoute, protectedRoute } from '../../middlewares.js';
import {
  createAdmin,
  deleteAdminById,
  getAllAdmins,
  getLogedInAdmin,
  loginAdmin,
  logoutAdmin,
  refreshTokens,
  updateAdmin,
} from './controller.js';
import { envValues } from '../../utils.js';

const adminRouter = Router();

if (envValues.node_env === 'development') {
  adminRouter.post('/', createAdmin);
} else {
  adminRouter.post('/', protectedRoute, adminOnlyRoute, createAdmin);
}
adminRouter.post('/login', loginAdmin);
adminRouter.get('/me', protectedRoute, getLogedInAdmin);
adminRouter.get('/', protectedRoute, adminOnlyRoute, getAllAdmins);
adminRouter.patch('/me', protectedRoute, updateAdmin);
adminRouter.patch('/:id', protectedRoute, adminOnlyRoute, updateAdmin);
adminRouter.post('/me/logout', protectedRoute, logoutAdmin);
adminRouter.post('/me/refresh-tokens', refreshTokens);
adminRouter.delete('/:id', protectedRoute, adminOnlyRoute, deleteAdminById);

export default adminRouter;
