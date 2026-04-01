import { isValidObjectId } from 'mongoose';
import { statusCodes } from '../../constants.js';
import Admin from '../../models/admin.js';
import { ApiError, ApiResponse, asyncHandler } from '../../utils.js';
import { createAdminSchema, loginSchema, refreshTokensSchema, updateAdminSchema } from './validator.js';

export const createAdmin = asyncHandler(async (req, res) => {
  const parsedBody = createAdminSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
    password: req.body?.password,
    role: req.body?.role,
    name: req.body?.name,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  if (parsedBody.data.role === 'Admin') {
    const isAdminAlreadyPresent = (await Admin.find({ role: 'Admin' })).length > 0;
    if (isAdminAlreadyPresent) {
      return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Admin already present!'));
    }
  }

  const isDuplicateAdmin = await Admin.findOne({
    'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
    'phoneNumber.number': parsedBody.data.phoneNumber.number,
  });

  if (isDuplicateAdmin) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, 'Phone number is already in use!'));
  }

  const admin = await Admin.insertOne({ ...parsedBody.data });
  if (!admin) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  admin.password = undefined;
  admin.refreshToken = undefined;

  return res
    .status(statusCodes.OK)
    .json(new ApiResponse(statusCodes.OK, `${parsedBody.data.role} created successfully.`, { admin }));
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const parsedBody = loginSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
    password: req.body?.password,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  const admin = await Admin.findOne({
    'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
    'phoneNumber.number': parsedBody.data.phoneNumber.number,
  }).select('+password');

  if (!admin) {
    return res
      .status(statusCodes.UNAUTHORIZED)
      .json(new ApiError(statusCodes.UNAUTHORIZED, 'Phone Number or Password is incorect!'));
  }

  const isValidPassword = await admin.comparePassword(parsedBody.data.password);
  if (!isValidPassword) {
    return res
      .status(statusCodes.UNAUTHORIZED)
      .json(new ApiError(statusCodes.UNAUTHORIZED, 'Phone Number or Password is incorect!'));
  }

  const tokens = await admin.getNewTokens();
  if (!tokens) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  return res
    .status(statusCodes.OK)
    .cookie('accessToken', tokens.newAccessToken, {
      maxAge: 5 * 60000,
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })
    .cookie('refreshToken', tokens.newRefreshToken, {
      maxAge: 7 * 86400000,
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })
    .json(new ApiResponse(statusCodes.OK, 'Login successfully.', { tokens }));
});

export const getLogedInAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req._id);
  if (!admin) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Admin not found!'));
  }

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Admin data fetched successfully.', {
      admin,
    }),
  );
});

export const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find({});

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Admins data fetched successfully.', {
      admins,
    }),
  );
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const id = req.params.id || req._id;
  if (!isValidObjectId(id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid admin id!'));
  }

  const admin = await Admin.findById(id).select('+password');
  if (!admin) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Admin not found!'));
  }

  const parsedBody = updateAdminSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
    name: req.body?.name,
    password: req.body?.password,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  if (parsedBody.data.phoneNumber) {
    const isDuplicateAdmin = await Admin.findOne({
      'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
      'phoneNumber.number': parsedBody.data.phoneNumber.number,
    });

    if (isDuplicateAdmin) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(new ApiError(statusCodes.BAD_REQUEST, 'Phone number is already in use!'));
    }

    admin.phoneNumber = parsedBody.data.phoneNumber;
  }

  if (parsedBody.data.name) admin.name = parsedBody.data.name;
  if (parsedBody.data.password) admin.password = parsedBody.data.password;

  await admin.save({ validateBeforeSave: false });

  admin.password = undefined;

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Admin data updated successfully.', {
      admin,
    }),
  );
});

export const logoutAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req._id);
  if (!admin) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Admin not found!'));
  }

  admin.refreshToken = null;
  await admin.save({ validateBeforeSave: false });

  return res
    .status(statusCodes.OK)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(statusCodes.OK, 'Logout successfully.'));
});

export const refreshTokens = asyncHandler(async (req, res) => {
  const token = (req.cookies?.refreshToken || req.body?.refreshToken) ?? null;

  const parsedBody = refreshTokensSchema.safeParse({
    refreshToken: token,
  });

  if (!parsedBody.success) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'UNAUTHORIZED!'));
  }

  const admin = await Admin.findOne({
    refreshToken: parsedBody.data.refreshToken,
  });

  if (!admin) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'UNAUTHORIZED!'));
  }

  const tokens = await admin.getNewTokens();
  if (!tokens) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  return res
    .status(statusCodes.OK)
    .cookie('accessToken', tokens.newAccessToken, {
      maxAge: 5 * 60000,
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })
    .cookie('refreshToken', tokens.newRefreshToken, {
      maxAge: 7 * 86400000,
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })
    .json(
      new ApiResponse(statusCodes.OK, 'Tokens refresed successfully.', {
        tokens,
      }),
    );
});

export const deleteAdminById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid admin id!'));
  }

  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Admin not found!'));
  }

  if (admin.role === 'Admin') {
    return res
      .status(statusCodes.UNAUTHORIZED)
      .json(new ApiError(statusCodes.UNAUTHORIZED, 'Admin with role Admin cannot be deleted!'));
  }

  try {
    await Admin.findByIdAndDelete(admin._id);
  } catch (error) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Admin deletion failed!', error));
  }

  return res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, 'Admin deleted successfully.'));
});
