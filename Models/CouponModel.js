const { default: mongoose } = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
      enum: ['basic_monthly', 'basic_yearly', 'business_monthly', 'business_yearly'],
    },
    used: {
      type: Boolean,
      default: false,
    },
    userEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
  },
  { timestamps: true }
);

const CouponModel = mongoose.model('Coupon', couponSchema);

module.exports = { CouponModel };
