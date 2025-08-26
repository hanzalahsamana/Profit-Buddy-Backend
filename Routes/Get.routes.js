const express = require('express');
const router = express.Router();
const { searchProducts, findProductAsins, getProducts } = require('../Controllers/Product');
const { getOffersOfProduct } = require('../Controllers/Offer');
const { getGraphImage } = require('../Controllers/Graph');
const { getSellerInfo } = require('../Controllers/Seller');

router.get('/products', getProducts);
router.get('/search-product', searchProducts);
router.get('/product-offers', getOffersOfProduct);
router.get('/graph-image', getGraphImage);
router.get('/seller-info', getSellerInfo);
router.get('/find-product-asins', findProductAsins);

module.exports = router;
