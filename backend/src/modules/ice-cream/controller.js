import { isValidObjectId } from 'mongoose';
import { statusCodes } from '../../constants.js';
import IceCream from '../../models/ice-cream.js';
import { ApiError, ApiResponse, asyncHandler } from '../../utils.js';
import { iceCreamSchema, iceCreamUpdateSchema } from './validator.js';

export const listIceCream = asyncHandler(async (req, res) => {
  const parsedBody = iceCreamSchema.safeParse({
    name: req.body?.name,
    price: req.body?.price,
    discount: req.body?.discount,
    description: req.body?.description,
    image: req.body?.image,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  const icecream = await IceCream.insertOne({ ...parsedBody.data });
  if (!icecream) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  return res.status(statusCodes.CREATED).json(
    new ApiResponse(statusCodes.CREATED, 'Ice Cream listed successfully.', {
      icecream,
    }),
  );
});

export const getAllIceCreamItems = asyncHandler(async (req, res) => {
  const icecreams = await IceCream.find({});

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Ice Creams data fetched successfully.', {
      icecreams,
    }),
  );
});

export const getIceCreamById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid icecream id!'));
  }

  const icecream = await IceCream.findById(req.params.id);
  if (!icecream) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Ice Cream not found!'));
  }

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Ice Cream data fetched successfully.', {
      icecream,
    }),
  );
});

export const updateIceCreamById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid icecream id!'));
  }

  const icecream = await IceCream.findById(req.params.id);
  if (!icecream) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Ice Cream not found!'));
  }

  const parsedBody = iceCreamUpdateSchema.safeParse({
    name: req.body?.name,
    price: req.body?.price,
    discount: req.body?.discount,
    description: req.body?.description,
    image: req.body?.image,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  for (const key in parsedBody.data) {
    if (parsedBody.data[`${key}`] !== null && parsedBody.data[`${key}`] !== undefined)
      icecream[`${key}`] = parsedBody.data[`${key}`];
  }

  await icecream.save();

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Ice Cream data updated successfully.', {
      icecream,
    }),
  );
});

export const deleteIceCreamById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid icecream id!'));
  }

  const icecream = await IceCream.findByIdAndDelete(req.params.id);
  if (!icecream) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Ice Cream not found!'));
  }

  return res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, 'Ice Cream item deleted successfully.'));
});
