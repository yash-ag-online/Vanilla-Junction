import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { ApiError, ApiResponse, asyncHandler, envValues } from './utils.js';
import { statusCodes } from './constants.js';
import { connectToMongoDB } from './db.js';

import adminRouter from './modules/admin/router.js';
import customerRouter from './modules/customer/router.js';
import iceCreamRouter from './modules/ice-cream/router.js';
import orderRouter from './modules/order/router.js';
import paymentRouter from './modules/payment/router.js';

const app = express();

// MongoDB Connection
await connectToMongoDB();

// Common Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(`:method :url :status :res[content-length] - :response-time ms`));
app.use(
  cors({
    origin: envValues.origins, // EX: [ 'http://localhost:5173', 'http://localhost:5500' ]
    methods: ['POST', 'GET', 'PATCH', 'OPTION', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  }),
);

// Routes
app.get(
  '/health-check',
  asyncHandler((req, res) => {
    return res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, 'Health Ok!', null));
  }),
);

app.use('/api/v1/admins', adminRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/ice-creams', iceCreamRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);

// Not-Found Handler
app.use(
  asyncHandler((req, res) => {
    return res.status(statusCodes.NOT_FOUND).json(new ApiResponse(statusCodes.NOT_FOUND, 'Route Not Found!', null));
  }),
);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(new ApiError(err.statusCode, err.message, err.error));
  }

  if (err instanceof Error) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, err.message, null));
  }

  return res
    .status(statusCodes.INTERNAL_SERVER_ERROR)
    .json(new ApiError(statusCodes.INTERNAL_SERVER_ERROR, 'Something Went Wrong!', null));
});

export default app;
