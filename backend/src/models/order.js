import { model, Schema } from 'mongoose';
import { addressSchema, generateRandomSixDigitOTP } from '../utils.js';

const orderSchema = new Schema(
  {
    totalPrice: {
      type: Number,
      required: true,
      max: [100000, 'Total price cannot be more than 100000.'],
      min: [0, 'Total price cannot be in negative.'],
    },
    totalDiscount: {
      type: Number,
      required: true,
      max: [100000, 'Total discount cannot be more than 100000.'],
      min: [0, 'Total discount cannot be in negative.'],
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirm', 'Out for delivery', 'Delivered', 'Canceled'],
      required: true,
      default: 'Pending',
    },
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Done', 'Canceled'],
      required: true,
      default: 'Pending',
    },
    deliveryDate: {
      type: Date,
      min: Date.now(),
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    deliveryPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    items: {
      type: [Schema.Types.ObjectId],
      ref: 'IceCream',
      required: true,
    },
    deliveryOtp: {
      type: String,
      maxLength: 6,
      minLength: 6,
      select: false,
      default: null,
    },
    deliveryAddress: {
      type: addressSchema,
      default: null,
    },
  },
  { timestamps: true },
);

orderSchema.methods.generateDeliveryOtp = async function () {
  const newOtp = generateRandomSixDigitOTP();

  this.deliveryOtp = newOtp;
  await this.save({ validateBeforeSave: false });

  return newOtp;
};

const Order = model('Order', orderSchema);
export default Order;
