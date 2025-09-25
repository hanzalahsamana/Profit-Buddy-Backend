const DEFAULT_SUBSCRIPTION_COUPON = {
  'PROFIT-BUDDY-#COUPON098': {
    planName: 'business_yearly',
    usageLimit: Infinity,
    durationMonths: 12,
  },
};

// -1 = Unlimted
const PLAN_QUOTAS = {
  basic_monthly: { aiChat: 1000, supportAccess: false },
  basic_yearly: { aiChat: 12000, supportAccess: false },
  business_month: { aiChat: -1, supportAccess: true },
  business_yearly: { aiChat: -1, supportAccess: true },
};

module.exports = { DEFAULT_SUBSCRIPTION_COUPON, PLAN_QUOTAS };
