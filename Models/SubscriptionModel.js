const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['incomplete', 'active', 'canceled', 'past_due', 'unpaid'],
      default: 'incomplete',
    },

    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    stripeCustomerId: { type: String, default: null, select: false },
    stripeSubscriptionId: { type: String, default: null, select: false },

    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);

module.exports = { SubscriptionModel };
