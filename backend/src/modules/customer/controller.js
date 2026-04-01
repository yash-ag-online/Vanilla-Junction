import { isValidObjectId } from 'mongoose';
import { statusCodes } from '../../constants.js';
import Customer from '../../models/customer.js';
import { ApiError, ApiResponse, asyncHandler, sendLoginOtpToCustomer } from '../../utils.js';
import { generateLoginOtpSchema, loginSchema, refreshTokensSchema, updateCustomerSchema } from './validator.js';

export const generateLoginOTP = asyncHandler(async (req, res) => {
  const parsedBody = generateLoginOtpSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  let customer = await Customer.findOne({
    'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
    'phoneNumber.number': parsedBody.data.phoneNumber.number,
  });

  if (!customer) {
    try {
      customer = await Customer.insertOne({
        phoneNumber: parsedBody.data.phoneNumber,
      });
    } catch (error) {
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
    }
  }

  const otp = await customer.generateLoginOtp();
  if (!otp) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  sendLoginOtpToCustomer(`${customer.phoneNumber.countryCode}${customer.phoneNumber.number}`, otp);

  return res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, 'OTP generated successfully.'));
});

export const loginCustomer = asyncHandler(async (req, res) => {
  const parsedBody = loginSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
    otp: req.body?.otp,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  let customer = await Customer.findOne({
    'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
    'phoneNumber.number': parsedBody.data.phoneNumber.number,
  }).select('+otp');

  if (!customer) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid request!'));
  }

  if (!customer.otp || customer.otp !== parsedBody.data.otp) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid OTP!'));
  }

  const tokens = await customer.getNewTokens();
  if (!tokens) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  customer.otp = null;
  await customer.save({ validateBeforeSave: false });

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

export const getLogedInCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req._id);
  if (!customer) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Customer not found!'));
  }

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Customer data fetched successfully.', {
      customer,
    }),
  );
});

export const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Customers data fetched successfully.', {
      customers,
    }),
  );
});

export const updateCustomer = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid customer id!'));
  }

  const parsedBody = updateCustomerSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Customer not found!'));
  }

  if (parsedBody.data.phoneNumber) {
    const isDuplicateCustomer = await Customer.findOne({
      'phoneNumber.countryCode': parsedBody.data.phoneNumber.countryCode,
      'phoneNumber.number': parsedBody.data.phoneNumber.number,
    });

    if (isDuplicateCustomer) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(new ApiError(statusCodes.BAD_REQUEST, 'Phone number is already in use!'));
    }

    customer.phoneNumber = parsedBody.data.phoneNumber;
  }

  await customer.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Customer data updated successfully.', {
      customer,
    }),
  );
});

export const logoutCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req._id);
  if (!customer) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Customer not found!'));
  }

  customer.refreshToken = null;
  await customer.save({ validateBeforeSave: false });

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

  const customer = await Customer.findOne({
    refreshToken: parsedBody.data.refreshToken,
  });

  if (!customer) {
    return res.status(statusCodes.UNAUTHORIZED).json(new ApiError(statusCodes.UNAUTHORIZED, 'UNAUTHORIZED!'));
  }

  const tokens = await customer.getNewTokens();
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
