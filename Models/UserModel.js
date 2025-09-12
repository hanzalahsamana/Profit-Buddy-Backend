const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    userName: {
      type: String,
      default: '',
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    terms: {
      type: Boolean,
      default: false,
      required: true,
    },

    // Verifications Token
    // verifyToken: { type: String, default: null, select: false },
    // verifyTokenExpiry: { type: Date, default: null, select: false },
    // deleteAccountToken: { type: String, default: null, select: false },
    // deleteAccountTokenExpiry: { type: Date, default: null, select: false },
    resetToken: { type: String, default: null, select: false },
    resetTokenExpiry: { type: Date, default: null, select: false },

    // For logout frome every device when change password
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const UserModal = mongoose.model('User', userSchema);

module.exports = { UserModal };
