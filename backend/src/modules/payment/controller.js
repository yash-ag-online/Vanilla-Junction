import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils.js';
import { statusCodes } from '../../constants.js';
import Payment from '../../models/payment.js';
import { ApiError, ApiResponse, asyncHandler, envValues } from '../../utils.js';
import { isValidObjectId } from 'mongoose';
import { paymentFailSchema, paymentVerifySchema } from './validator.js';
import Order from '../../models/order.js';

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({});

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Payments data fetched successfully', {
      payments,
    }),
  );
});

export const failPaymentById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid payment id!'));
  }

  const parsedBody = paymentFailSchema.safeParse({
    razorpayPaymentId: req.body?.razorpayPaymentId,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Payment not found!'));
  }

  payment.status = 'Fail';
  payment.razorpayPaymentId = parsedBody.data.razorpayPaymentId;
  payment.transactionId = parsedBody.data.razorpayPaymentId;

  await payment.save({ validateBeforeSave: false });

  const order = await Order.findById(payment.orderId);
  if (!order) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, `Order not found!`));
  }

  order.orderStatus = 'Canceled';
  order.deliveryStatus = 'Canceled';
  await order.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Payment marked failed successfully.', {
      payment,
    }),
  );
});

export const verifyPaymentById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid payment id!'));
  }

  const parsedBody = paymentVerifySchema.safeParse({
    razorpayPaymentId: req.body?.razorpayPaymentId,
    razorpayPaymentSignature: req.body?.razorpayPaymentSignature,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Payment not found!'));
  }

  const body = payment.razorpayOrderId + '|' + parsedBody.data.razorpayPaymentId;
  const isValidPayment = validateWebhookSignature(
    body,
    parsedBody.data.razorpayPaymentSignature,
    envValues.razorpay_key_secret,
  );

  if (!isValidPayment) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, `Verification failed!`));
  }

  payment.status = 'Success';
  payment.razorpayPaymentId = parsedBody.data.razorpayPaymentId;
  payment.razorpayPaymentSignature = parsedBody.data.razorpayPaymentSignature;
  payment.transactionId = parsedBody.data.razorpayPaymentId;

  await payment.save({ validateBeforeSave: false });

  const order = await Order.findById(payment.orderId);
  if (!order) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, `Order not found!`));
  }

  order.orderStatus = 'Confirm';
  await order.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Payment verified successfully.', {
      payment,
    }),
  );
});
