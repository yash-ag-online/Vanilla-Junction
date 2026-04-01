import { model, Schema } from 'mongoose';
import { addressSchema, envValues, generateRandomSixDigitOTP, phoneNumberSchema } from '../utils.js';
import jwt from 'jsonwebtoken';

const customerSchema = new Schema(
  {
    phoneNumber: {
      type: phoneNumberSchema,
      required: true,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    otp: {
      type: String,
      maxLength: 6,
      minLength: 6,
      select: false,
      default: null,
    },
    savedAddress: {
      type: addressSchema,
      default: null,
    },
    orderHistory: {
      type: [Schema.Types.ObjectId],
      ref: 'Order',
      default: [],
    },
  },
  { timestamps: true },
);

customerSchema.methods.getNewTokens = async function () {
  const newRefreshToken = jwt.sign({ _id: this._id }, envValues.referesh_token_secret, { expiresIn: '7d' });
  const newAccessToken = jwt.sign({ _id: this._id }, envValues.access_token_secret, { expiresIn: '15m' });

  this.refreshToken = newRefreshToken;
  await this.save({ validateBeforeSave: false });

  return {
    newRefreshToken,
    newAccessToken,
  };
};

customerSchema.methods.generateLoginOtp = async function () {
  const newOtp = generateRandomSixDigitOTP();

  this.otp = newOtp;
  await this.save({ validateBeforeSave: false });

  return newOtp;
};

const Customer = model('Customer', customerSchema);

export default Customer;
