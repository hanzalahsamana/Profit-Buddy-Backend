const express = require('express');
const { login, register, requestPasswordReset, verifyResetToken, resetPassword, updateProfile } = require('../Controllers/User');
const { userLoginValidate, userRegisterValidate } = require('../MiddleWares/UserValidation');
const tokenChecker = require('../MiddleWares/TokenChecker');
const { upsertHistory } = require('../Controllers/History');
const router = express.Router();

router.post('/register', userRegisterValidate, register);
router.post('/login', userLoginValidate, login);
router.post('/upsert-history', tokenChecker, upsertHistory);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.post('/update-profile', tokenChecker, updateProfile);

module.exports = router;
