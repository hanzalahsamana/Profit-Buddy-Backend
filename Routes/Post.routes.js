const express = require('express');
const { login, register } = require('../Controllers/User');
const { userLoginValidate, userRegisterValidate } = require('../MiddleWares/UserValidation');
const tokenChecker = require('../MiddleWares/TokenChecker');
const { upsertHistory } = require('../Controllers/History');
const router = express.Router();

router.post('/register', userRegisterValidate, register);
router.post('/login', userLoginValidate, login);
router.post('/upsert-history', tokenChecker, upsertHistory);

module.exports = router;
