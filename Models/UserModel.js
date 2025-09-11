const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
    resetToken: { type: String, default: null, select: false },
    resetTokenExpiry: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
  }
);

const UserModal = mongoose.model('User', userSchema);

module.exports = { UserModal };
