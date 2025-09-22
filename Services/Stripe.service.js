const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createStripeSubscription = async (customerId, priceId) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
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
    const customer = await stripe.customers.create({ email });
    return customer;
  } catch (error) {
    throw error;
  }
};

const attachPaymentMethodToStripeCustomer = async (customerId, paymentMethodId) => {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    
  } catch (error) {
    throw error;
  }
};

module.exports = { createStripeSubscription, getStripeSubscription, cancelStripeSubscription, createStripeCustomer, attachPaymentMethodToStripeCustomer };
