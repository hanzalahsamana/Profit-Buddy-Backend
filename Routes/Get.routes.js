const express = require('express');
const router = express.Router();
const { searchProducts, getOffersOfProduct, getGraphImage } = require('../Controllers/Product');

router.get('/search-product', searchProducts);
router.get('/get-product-offers', getOffersOfProduct);
router.get('/get-graph-image', getGraphImage);

module.exports = router;
