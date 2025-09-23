const { PRICE_IDS } = require('../Enums/StripeConstant');
const { SubscriptionModel } = require('../Models/SubscriptionModel');
const { UserModal } = require('../Models/UserModel');
const { createStripeCustomer, createStripeSubscription, attachPaymentMethodToStripeCustomer, cancelStripeSubscription } = require('../Services/Stripe.service');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createSubscription = async (req, res) => {
  try {
    const { planName } = req.body;
    const { userId } = req.query;

    if (!PRICE_IDS[planName]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const user = await UserModal.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ✅ Check for existing active subscription
    if (user.currentSubscription) {
      const existingSubDoc = await SubscriptionModel.findById(user.currentSubscription).select('+stripeCustomerId +stripeSubscriptionId');

      if (existingSubDoc) {
        const stripeSub = await stripe.subscriptions.retrieve(existingSubDoc.stripeSubscriptionId);
        if (stripeSub.status === 'active') {
          return res.status(400).json({
            success: false,
            message: `Cancel your existing subscription before selecting ${planName} plan.`,
          });
        }
      }
    }

    // ✅ Create Stripe Customer if not exists
    const customerId = user.stripeCustomerId || (await createStripeCustomer({ email: user.email }))?.id;
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // ✅ Create Stripe Subscription & get subscription + clientSecret
    const { subscription, clientSecret } = await createStripeSubscription(customerId, PRICE_IDS[planName]);

    console.log(clientSecret, '♀️♀️');

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'No payment intent generated for this subscription.',
      });
    }

    const unixToDateOrNull = (sec) => {
      if (sec === undefined || sec === null) return null;
      const n = Number(sec);
      if (!Number.isFinite(n)) return null;
      return new Date(n * 1000);
    };

    // ✅ Save subscription in DB (update if exists)
    const newSubscriptionData = {
      planName,
      status: 'inActive',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: subscription?.items?.data?.current_period_start,
      currentPeriodEnd: subscription?.items?.data?.current_period_end,
      userRef: user._id,
    };

    let subscriptionDoc = await SubscriptionModel.findOneAndUpdate({ userRef: user._id }, newSubscriptionData, { new: true, upsert: true });

    user.currentSubscription = subscriptionDoc._id;
    user.plan = planName;
    await user.save();

    res.json({
      success: true,
      clientSecret,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error('Stripe subscription error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    // Fetch subscription with Stripe IDs
    const subscription = await SubscriptionModel.findOne({ userRef: userId }).select('+stripeCustomerId +stripeSubscriptionId');

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ success: false, message: 'No subscription found for this user.' });
    }

    // Retrieve subscription status from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Check if subscription is already inactive
    if (!['active', 'past_due'].includes(stripeSub.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel subscription because it is currently "${stripeSub.status}".`,
      });
    }

    // Cancel subscription on Stripe (at period end)
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

    // Update subscription in DB (do not delete)
    subscription.status = 'canceled';
    subscription.canceledAt = new Date(); // optional timestamp
    subscription.stripeData = stripeResponse; // save Stripe response if needed
    await subscription.save();

    return res.status(200).json({
      success: true,
      message: 'Subscription successfully canceled. It will remain active until the period ends.',
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
