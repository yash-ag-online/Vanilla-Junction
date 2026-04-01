import { Router } from 'express';
import { adminOnlyRoute, protectedRoute } from '../../middlewares.js';
import {
  deleteIceCreamById,
  getAllIceCreamItems,
  getIceCreamById,
  listIceCream,
  updateIceCreamById,
} from './controller.js';

const iceCreamRouter = Router();

iceCreamRouter.post('/', protectedRoute, adminOnlyRoute, listIceCream);
iceCreamRouter.get('/', getAllIceCreamItems);
iceCreamRouter.get('/:id', getIceCreamById);
iceCreamRouter.patch('/:id', protectedRoute, adminOnlyRoute, updateIceCreamById);
iceCreamRouter.delete('/:id', protectedRoute, adminOnlyRoute, deleteIceCreamById);

export default iceCreamRouter;
