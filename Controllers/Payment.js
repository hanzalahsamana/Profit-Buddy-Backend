const { SubscriptionModel } = require('../Models/SubscriptionModel');
const { UserModal } = require('../Models/UserModel');
const { getStripeSubscription, createStripeCustomer, createStripeSubscription, attachPaymentMethodToStripeCustomer } = require('../Services/Stripe.service');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Stripe Customer
const createCustomer = async (req, res) => {
  try {
    const { email, name } = req.body;
    const customer = await stripe.customers.create({ email, name });

    res.json({ customerId: customer.id });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(400).json({ error: { message: err.message } });
  }
};


const createSubscription = async (req, res) => {
  try {
    const { paymentMethodId, planName } = req.body;
    const { userId } = req.query;

    if (!PRICE_IDS[planName]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const user = await UserModal.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check for existing active subscription
    if (user.currentSubscription) {
      const existingSub = await SubscriptionModel.findById(user.currentSubscription);
      const stripeSub = await stripe.subscriptions.retrieve(existingSub.stripeSubscriptionId);
      if (stripeSub.status === 'active') {
        return res.status(400).json({
          success: false,
          message: `Cancel your existing subscription before selecting ${planName} plan.`,
        });
      }
    }

    // Create Stripe Customer if not exists
    const customerId = user.stripeCustomerId || (await createStripeCustomer({ email: user.email }))?.id;
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Attach Payment Method
    await attachPaymentMethodToStripeCustomer(customerId, paymentMethodId);

    // Create Stripe Subscription
    const subscription = await createStripeSubscription(customerId, PRICE_IDS[planName]);

    const clientSecret = subscription.latest_invoice.payment_intent?.client_secret;
    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'No payment intent generated for this subscription.',
      });
    }

    // Save subscription in DB
    const newSubscription = await SubscriptionModel.create({
      planName,
      status: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      userRef: user._id,
    });

    user.currentSubscription = newSubscription._id;
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

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.paid':
      console.log(`✅ Invoice paid for subscription: ${event.data.object.subscription}`);
      // TODO: Update your database to extend user access
      break;

    case 'invoice.payment_failed':
      console.log(`❌ Payment failed for subscription: ${event.data.object.subscription}`);
      // TODO: Notify user to update payment method
      break;

    case 'customer.subscription.deleted':
      console.log(`⚠️ Subscription cancelled: ${event.data.object.id}`);
      // TODO: Revoke user access
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createCustomer,
  createSubscription,
  stripeWebhook,
};
