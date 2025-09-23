const express = require('express');
const { login, register, requestPasswordReset, verifyResetToken, resetPassword, updateProfile, verifyEmail, deleteAccount, requestDeleteAccount } = require('../Controllers/User');
const { userLoginValidate, userRegisterValidate } = require('../MiddleWares/UserValidation');
const tokenChecker = require('../MiddleWares/TokenChecker');
const { upsertHistory } = require('../Controllers/History');
const { createSubscription, cancelSubscription } = require('../Controllers/Subscription');
const { webHooks } = require('../Webhooks/Stirpe');
const router = express.Router();

router.post('/register', userRegisterValidate, register);
router.post('/verify-email', verifyEmail);
router.post('/login', userLoginValidate, login);
router.post('/upsert-history', tokenChecker, upsertHistory);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.post('/request-delete-account', tokenChecker, requestDeleteAccount);
router.post('/delete-account', tokenChecker, deleteAccount);
router.post('/update-profile', tokenChecker, updateProfile);

router.post('/create-subscription', tokenChecker, createSubscription);
router.post('/cancel-subscription', tokenChecker, cancelSubscription);

router.post('/webhook', express.raw({ type: 'application/json' }), webHooks);

module.exports = router;
