import { model, Schema } from 'mongoose';

const paymentSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Fail'],
      required: true,
      default: 'Pending',
    },
    amount: {
      type: Number,
      required: true,
      max: [100000, 'Amount cannot be more than 100000.'],
      min: [0, 'Amount cannot be in negative.'],
    },
    payeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpayPaymentSignature: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const Payment = model('Payment', paymentSchema);
export default Payment;
