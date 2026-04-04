import { isValidObjectId } from 'mongoose';
import { statusCodes } from '../../constants.js';
import Order from '../../models/order.js';
import { ApiError, ApiResponse, asyncHandler, razorpay, sendDeliveryOtpToCustomer } from '../../utils.js';
import { orderSchema, verifyDeliverySchema } from './validator.js';
import IceCream from '../../models/ice-cream.js';
import Payment from '../../models/payment.js';
import Customer from '../../models/customer.js';

export const createOrder = asyncHandler(async (req, res) => {
  const parsedBody = orderSchema.safeParse({
    phoneNumber: req.body?.phoneNumber,
    items: req.body?.items,
    address: req.body?.address,
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

  let totalPrice = 0;
  let totalDiscount = 0;

  for (const i in parsedBody.data.items) {
    if (!isValidObjectId(parsedBody.data.items[i])) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(new ApiError(statusCodes.BAD_REQUEST, `Invalid item id ${parsedBody.data.items[i]}!`));
    }

    const item = await IceCream.findById(parsedBody.data.items[i]);
    if (!item) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(new ApiError(statusCodes.BAD_REQUEST, `Invalid item id ${parsedBody.data.items[i]}!`));
    }

    totalPrice += item.price;
    totalDiscount += item.price * (item.discount / 100);
  }

  const order = new Order({
    ...parsedBody.data,
    totalPrice,
    totalDiscount,
    deliveryStatus: 'Pending',
    orderStatus: 'Pending',
    customerId: customer._id,
    deliveryAddress: parsedBody.data.address,
  });

  if (!order) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  let paymentData;
  await razorpay.orders.create(
    {
      amount: parseInt((order.totalPrice - order.totalDiscount) * 100),
      currency: 'INR',
      receipt: order._id,
      notes: JSON.stringify([...order.items]),
    },
    (err, razorpayOrder) => {
      if (err) {
        console.log(err);
        throw err;
      }

      paymentData = {
        status: 'Pending',
        amount: razorpayOrder.amount / 100,
        payeeId: customer._id,
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
      };
    },
  );

  const payment = await Payment.insertOne(paymentData);
  if (!payment) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Request failed!'));
  }

  order.paymentId = payment._id;
  customer.orderHistory.push(order._id);
  customer.savedAddress = parsedBody.data.address;

  await order.save({ validateBeforeSave: false });
  await customer.save({ validateBeforeSave: false });

  return res.status(statusCodes.CREATED).json(
    new ApiResponse(statusCodes.CREATED, 'Order created successfully.', {
      order,
      payment,
    }),
  );
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { filter } = req.query;

  let orders = [];

  if (req.admin.role === 'Admin') {
    if (filter) {
      if (filter === 'pending') orders = await Order.find({ deliveryStatus: 'Pending' });
      if (filter === 'canceled') orders = await Order.find({ deliveryStatus: 'Canceled' });
      if (filter === 'done') orders = await Order.find({ deliveryStatus: 'Done' });
    } else {
      orders = await Order.find({});
    }
  } else {
    orders = await Order.find({ deliveryStatus: 'Pending' });
  }

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Orders data fetched successfully.', {
      orders,
    }),
  );
});

export const gerOrderbyId = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid order id!'));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Order not found!'));
  }

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Order data fetched successfully.', {
      order,
    }),
  );
});

export const acceptDelivery = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid order id!'));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Order not found!'));
  }

  if (
    order.orderStatus === 'Delivered' ||
    order.orderStatus === 'Out for delivery' ||
    order.orderStatus === 'Canceled'
  ) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Order is not pending!'));
  }

  if (order.deliveryStatus !== 'Pending') {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Delivery is not pending!'));
  }

  const customer = await Customer.findById(order.customerId);
  if (!customer) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Customer not found!'));
  }

  order.deliveryPersonId = req.admin._id;
  order.orderStatus = 'Out for delivery';

  const otp = await order.generateDeliveryOtp();
  await order.save({ validateBeforeSave: false });

  sendDeliveryOtpToCustomer(`${customer.phoneNumber.countryCode}${customer.phoneNumber.number}`, otp, order._id);

  order.deliveryOtp = undefined;

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Delivery accepted successfully.', {
      order,
    }),
  );
});

export const verifyDeliveryOTP = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid order id!'));
  }

  const order = await Order.findById(req.params.id).select('+deliveryOtp');
  if (!order) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Order not found!'));
  }

  if (order.orderStatus === 'Delivered') {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Order already delivered!'));
  }

  const parsedBody = verifyDeliverySchema.safeParse({
    otp: req.body?.otp,
  });

  if (!parsedBody.success) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, parsedBody.error.message, parsedBody.error));
  }

  if (!order.deliveryOtp || order.deliveryOtp !== parsedBody.data.otp) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid otp!'));
  }

  order.deliveryStatus = 'Done';
  order.orderStatus = 'Delivered';
  order.deliveryDate = Date.now();
  order.deliveryOtp = null;

  await order.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Delivery OTP verified successfully.', {
      order,
    }),
  );
});

export const cancelOrderbyId = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(statusCodes.BAD_REQUEST).json(new ApiError(statusCodes.BAD_REQUEST, 'Invalid order id!'));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(statusCodes.NOT_FOUND).json(new ApiError(statusCodes.NOT_FOUND, 'Order not found!'));
  }

  if (order.orderStatus === 'Delivered' || order.deliveryStatus === 'Done') {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json(new ApiError(statusCodes.BAD_REQUEST, 'Order is already fulfilled!'));
  }

  order.orderStatus = 'Canceled';
  order.deliveryStatus = 'Canceled';
  await order.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(
    new ApiResponse(statusCodes.OK, 'Order canceled successfully.', {
      order,
    }),
  );
});
