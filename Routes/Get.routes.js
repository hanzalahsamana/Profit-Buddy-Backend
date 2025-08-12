const express = require('express');
const router = express.Router();
const { searchProducts } = require('../Controllers/Product');

router.get('/search-product', searchProducts);

module.exports = router;