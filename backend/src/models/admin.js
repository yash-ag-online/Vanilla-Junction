import { model, Schema } from 'mongoose';
import { envValues, phoneNumberSchema } from '../utils.js';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

const adminSchema = new Schema(
  {
    phoneNumber: {
      type: phoneNumberSchema,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      maxLength: [20, 'Name cannot contain more than 20 characters.'],
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    role: {
      type: String,
      enum: ['Admin', 'Delivery Person'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  return (this.password = await hash(this.password, 12));
});

adminSchema.methods.getNewTokens = async function () {
  const newRefreshToken = jwt.sign({ _id: this._id }, envValues.referesh_token_secret, { expiresIn: '7d' });
  const newAccessToken = jwt.sign({ _id: this._id }, envValues.access_token_secret, { expiresIn: '15m' });

  this.refreshToken = newRefreshToken;
  await this.save({ validateBeforeSave: false });

  return {
    newRefreshToken,
    newAccessToken,
  };
};

adminSchema.methods.comparePassword = async function (password) {
  try {
    return await compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

const Admin = model('Admin', adminSchema);
export default Admin;
