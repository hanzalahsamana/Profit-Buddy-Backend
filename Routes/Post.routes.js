const express = require('express');
const { login, register } = require('../Controllers/User');
const { userLoginValidate, userRegisterValidate } = require('../MiddleWares/UserValidation');
const router = express.Router();

router.post('/register', userRegisterValidate, register);
router.post('/login', userLoginValidate, login);

module.exports = router;
