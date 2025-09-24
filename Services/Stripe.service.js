const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createStripeSubscription = async (customerId, priceId) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      billing_mode: { type: 'flexible' },
      expand: ['latest_invoice.confirmation_secret', 'items.data.price.product'],
    });
    const invoice = subscription.latest_invoice;
    const item = invoice.lines.data[0];
    const item2 = subscription?.items?.data[0];

    const summary = {
      subscriptionId: subscription?.id,
      status: subscription?.status,
      planName: item2?.price?.product?.name || 'Plan',
      currency: item?.currency,
      amount: item?.amount / 100,
      description: item?.description,
      startDate: new Date(item?.period?.start * 1000),
      endDate: new Date(item?.period?.end * 1000),
    };

    return {
      clientSecret: subscription.latest_invoice.confirmation_secret.client_secret,
      subscription: subscription,
      summary: summary,
    };
  } catch (error) {
    console.error('Stripe subscription error:', error);
    throw error;
  }
};

const getStripeSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    throw error;
  }
};

const cancelStripeSubscription = async (subscriptionId) => {
  try {
    const stripeResponse = await stripe.subscriptions.cancel(subscriptionId);
    return stripeResponse;
  } catch (error) {
    throw error;
  }
};

const createStripeCustomer = async ({ email }) => {
  try {
    const customer = await stripe.customers.create({ email, name: 'ali' });
    return customer;
  } catch (error) {
    throw error;
  }
};

const attachPaymentMethodToStripeCustomer = async (customerId, paymentMethodId) => {
  // Attach and set as customer's default invoice method
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  return paymentMethodId;
};

module.exports = { createStripeSubscription, getStripeSubscription, cancelStripeSubscription, createStripeCustomer, attachPaymentMethodToStripeCustomer };
