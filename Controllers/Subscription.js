const { DEFAULT_SUBSCRIPTION_COUPON } = require('../Enums/OurConstant');
const { PRICE_IDS } = require('../Enums/StripeConstant');
const { SubscriptionModel } = require('../Models/SubscriptionModel');
const { UserModal } = require('../Models/UserModel');
const {
  createStripeCustomer,
  createStripeSubscription,
  attachPaymentMethodToStripeCustomer,
  cancelStripeSubscription,
  ensureStripeCustomer,
} = require('../Services/Stripe.service');
const { getDateAfterMonths } = require('../Utils/Converter');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createSubscription = async (req, res) => {
  try {
    const { planName, couponCode } = req.body;
    const { userId } = req.query;

    const user = await UserModal.findById(userId).select('+stripeCustomerId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ✅ Check existing subscription (cancel if needed before applying coupon)
    // if (user.currentSubscription) {
    //   const existingSubDoc = await SubscriptionModel.findById(user.currentSubscription).select('+stripeSubscriptionId');
    //   if (existingSubDoc?.stripeSubscriptionId) {
    //     await stripe.subscriptions.update(existingSubDoc.stripeSubscriptionId, { cancel_at_period_end: true });
    //     existingSubDoc.status = 'canceled';
    //     await existingSubDoc.save();
    //   }
    // }

    // ✅ Coupon Flow
    if (couponCode) {
      const coupon = DEFAULT_SUBSCRIPTION_COUPON?.[couponCode] || null;
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'The coupon code you entered is either invalid, expired, or not applicable. Please double-check the code or try a different one.',
        });
      }

      const startDate = new Date();
      const endDate = getDateAfterMonths(coupon?.durationMonths || 1);

      const newSubscriptionData = {
        planName: coupon.planName || planName,
        status: 'active',
        subscriptionType: 'coupon',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        userRef: user._id,
      };

      const subscriptionDoc = await SubscriptionModel.findOneAndUpdate({ userRef: user._id }, newSubscriptionData, { new: true, upsert: true });

      user.currentSubscription = subscriptionDoc._id;
      user.plan = coupon.planName || planName;
      await user.save();

      return res.json({
        success: true,
        message: `Free subscription activated via coupon: ${couponCode}`,
        subscription: subscriptionDoc,
      });
    }

    if (!PRICE_IDS[planName]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const customerId = await ensureStripeCustomer(user);

    const { subscription, clientSecret, summary } = await createStripeSubscription(customerId, PRICE_IDS[planName]);

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'No payment intent generated for this subscription.',
      });
    }

    const newSubscriptionData = {
      planName,
      status: 'incomplete',
      subscriptionType: 'stripe',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: summary?.startDate,
      currentPeriodEnd: summary?.endDate,
      userRef: user._id,
    };

    const subscriptionDoc = await SubscriptionModel.findOneAndUpdate({ userRef: user._id }, newSubscriptionData, { new: true, upsert: true });

    user.currentSubscription = subscriptionDoc._id;
    user.plan = planName;
    await user.save();

    res.json({
      success: true,
      clientSecret,
      subscriptionId: subscription.id,
      summary: summary,
    });
  } catch (err) {
    console.error('Stripe subscription error:', err?.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const subscription = await SubscriptionModel.findOne({ userRef: userId }).select('+stripeCustomerId +stripeSubscriptionId');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found for this user.' });
    }

    if (subscription.subscriptionType === 'coupon') {
      subscription.status = 'canceled';
      subscription.currentPeriodEnd = new Date();
    } else {
      if (!subscription.stripeSubscriptionId) {
        return res.status(404).json({ success: false, message: 'No subscription found for this user.' });
      }
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      if (!['active', 'past_due'].includes(stripeSub.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel subscription because it is currently "${stripeSub.status}".`,
        });
      }

      let stripeResponse;
      try {
        stripeResponse = await cancelStripeSubscription(subscription.stripeSubscriptionId);
      } catch (stripeErr) {
        console.error('Stripe subscription cancel error:', stripeErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to cancel subscription on Stripe. Please try again.',
          error: stripeErr.message,
        });
      }

      subscription.status = 'canceled';
      subscription.currentPeriodEnd = new Date();
      await subscription.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription successfully canceled.',
      subscription: subscription,
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Could not cancel subscription.',
      error: err.message,
    });
  }
};

module.exports = {
  createSubscription,
  cancelSubscription,
};
