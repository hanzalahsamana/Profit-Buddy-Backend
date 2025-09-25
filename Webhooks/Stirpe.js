const { UserModal } = require('../Models/UserModel');
const { SubscriptionModel } = require('../Models/SubscriptionModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const webHooks = async (req, res) => {
  let event;
  console.log('🚚🚚👍');

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log('🚚🚚', event);
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const subscriptionId =
          invoice.subscription || // normal location
          invoice.parent?.subscription_details?.subscription || // fallback
          invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
        if (!subscriptionId) {
          console.warn('⚠️ No subscription ID found for paid invoice:', invoice.id);
          break;
        }

        const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
        if (subscription) {
          subscription.status = 'active';
          subscription.currentPeriodEnd = new Date(event.data.object.period_end * 1000);
          subscription.currentPeriodStart = new Date(event.data.object.period_start * 1000);
          await subscription.save();

          const user = await UserModal.findById(subscription.userRef);
          if (user) {
            user.plan = subscription.planName;
            await user.save();
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const subscriptionId =
          invoice.subscription || // normal location
          invoice.parent?.subscription_details?.subscription || // fallback
          invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
        if (!subscriptionId) {
          console.warn('⚠️ No subscription ID found for paid invoice:', invoice.id);
          break;
        }

        const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
        if (subscription) {
          subscription.status = 'past_due';
          await subscription.save();

          const user = await UserModal.findById(subscription.userRef);
          if (user) {
            user.plan = null; // or keep old plan but mark subscription inactive
            await user.save();
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionId = event.data.object.id;

        const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
        if (subscription) {
          subscription.status = 'canceled';
          subscription.currentPeriodEnd = new Date();
          await subscription.save();

          const user = await UserModal.findById(subscription.userRef);
          if (user) {
            user.plan = null;
            user.currentSubscription = null;
            user.stripeCustomerId = null; // optional
            await user.save();
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionId = event.data.object.id;
        const status = event.data.object.status;

        const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
        if (subscription) {
          subscription.status = status;
          await subscription.save();

          const user = await UserModal.findById(subscription.userRef);
          if (user) {
            user.plan = status === 'active' ? subscription.planName : null;
            await user.save();
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { webHooks };
