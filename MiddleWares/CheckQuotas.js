const { PLAN_QUOTAS } = require("../Enums/OurConstant");

const checkAiQuota = async (req, res, next) => {
  const user = req.user;

  if (!user?.plan) {
    return res.status(403).json({ message: 'No active plan found' });
  }

  const limit = PLAN_QUOTAS?.[user.plan]?.aiChat;
  const used = user.quotasUsed.aiChat || 0;

  if (limit !== -1 && used >= limit) {
    return res.status(403).json({ message: 'AI chat quota exceeded for your plan' });
  }

  next();
};

module.exports = { checkAiQuota };
