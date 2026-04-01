import { isValidObjectId } from 'mongoose';
import { statusCodes } from './constants.js';
import Admin from './models/admin.js';
import { ApiError, asyncHandler, envValues } from './utils.js';
import jwt from 'jsonwebtoken';
import * as z from 'zod';

export const protectedRoute = asyncHandler((req, res, next) => {
  const accessToken = (req.cookies?.accessToken || req.headers['Authorization']?.split(' ')[1]) ?? null;
  if (!accessToken) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'Invalid access token!'));
  }

  if (
    !z
      .object({
        accessToken: z.jwt(),
      })
      .safeParse({ accessToken }).success
  ) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'Invalid access token!'));
  }

  const decodedToken = jwt.verify(accessToken, envValues.access_token_secret);
  if (!decodedToken) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'Invalid access token!'));
  }

  const _id = decodedToken._id;
  if (!_id || !isValidObjectId(_id)) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'Invalid access token!'));
  }

  req._id = _id;

  return next();
});

export const adminOnlyRoute = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req._id);
  if (!admin || admin.role !== 'Admin') {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'Admin only route!'));
  }

  req.admin = admin;

  return next();
});

export const adminAndDeliveryPersonOnlyRoute = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req._id);
  if (!admin && (admin.role !== 'Admin' || admin.role !== 'Delivery Person')) {
    return res
      .status(statusCodes.UNAUTHORIZED)
      .json(new ApiError(statusCodes.UNAUTHORIZED, 'Admin and Delivery Person only route!'));
  }

  req.admin = admin;

  return next();
});
