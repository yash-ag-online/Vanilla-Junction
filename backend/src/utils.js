import { Schema } from 'mongoose';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import twilio from 'twilio';

export const envValues = Object.freeze({
  port: Number(process.env.PORT),
  origins: process.env.ORIGINS.toString().split(','),
  node_env: process.env.NODE_ENV.toString(),
  mongodb_uri: process.env.MONGODB_URI.toString(),
  referesh_token_secret: process.env.REFERESH_TOKEN_SECRET.toString(),
  access_token_secret: process.env.ACCESS_TOKEN_SECRET.toString(),
  razorpay_key_id: process.env.RAZORPAY_API_KEY.toString(),
  razorpay_key_secret: process.env.RAZORPAY_API_SECRET.toString(),
  twilio_sid: process.env.TWILIO_SID.toString(),
  twilio_auth_token: process.env.TWILIO_AUTH_TOKEN.toString(),
  twilio_phone_number: process.env.TWILIO_PHONE_NUMBER.toString(),
});

export class ApiResponse {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode < 400;
    this.data = data;
  }
}

export class ApiError extends Error {
  constructor(statusCode, message, error, stack) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.success = false;
    this.error = error;

    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });

    if (envValues.node_env === 'development') {
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }

      Object.defineProperty(this, 'stack', {
        value: this.stack,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      this.stack = undefined;
    }
  }
}

export const asyncHandler = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export const phoneNumberSchema = new Schema(
  {
    countryCode: {
      type: String,
      enum: ['+91'],
      default: '+91',
      required: true,
    },
    number: {
      type: String,
      maxLength: [10, 'Phone number must contain exactly 10 digits'],
      minLength: [10, 'Phone number must contain exactly 10 digits'],
      required: true,
      match: /^\d+$/,
    },
  },
  { _id: false, id: false },
);

export const addressSchema = new Schema(
  {
    street: new Schema({
      streetNumber: String,
      streetName: String,
      houseNumber: String,
    }),
    city: String,
    state: String,
    zipCode: String,
  },
  { _id: false, id: false },
);

export const generateRandomSixDigitOTP = () => {
  const min = 100000;
  const max = 999999;

  const array = new Uint32Array(1);

  crypto.getRandomValues(array);

  const randomValue = array[0];

  const range = max - min + 1;
  const scaledRandom = (randomValue % range) + min; // OTP

  return scaledRandom;
};

export const razorpay = new Razorpay({
  key_id: envValues.razorpay_key_id,
  key_secret: envValues.razorpay_key_secret,
});

export const sendLoginOtpToCustomer = async (number, otp) => {
  const client = twilio(envValues.twilio_sid, envValues.twilio_auth_token);

  await client.messages.create({
    to: number,
    from: envValues.twilio_phone_number,
    body: `${otp} is your otp to login in vanilla junction website`,
  });
};

export const sendDeliveryOtpToCustomer = async (number, otp, orderId) => {
  const client = twilio(envValues.twilio_sid, envValues.twilio_auth_token);

  await client.messages.create({
    to: number,
    from: envValues.twilio_phone_number,
    body: `${otp} is your otp for order id - ${orderId}`,
  });
};
