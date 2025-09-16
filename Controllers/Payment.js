// backend/controllers/subscriptionController.js
const { default: Stripe } = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createSubscription = async (req, res) => {
  console.log('Creating subscription...');

  try {
    const { email, priceId, paymentMethodId } = req.body;

    if (!email || !priceId || !paymentMethodId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1️⃣ Create Customer
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 2️⃣ Create Subscription and expand PaymentIntent
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
      payment_behavior: 'default_incomplete', // ensures payment is required if needed
    });

    // 3️⃣ Get client secret if PaymentIntent exists
    let clientSecret = null;
    if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    }

    // 4️⃣ Send response
    res.json({
      subscriptionId: subscription.id,
      clientSecret, // may be null if payment not required immediately
      status: subscription.status,
    });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(400).json({ error: { message: error.message } });
  }
};

module.exports = { createSubscription };
