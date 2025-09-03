const express = require('express');
const router = express.Router();
const { searchProducts, findProductAsins, getProducts } = require('../Controllers/Product');
const { getOffersOfProduct } = require('../Controllers/Offer');
const { getGraphImage, getGraphData } = require('../Controllers/Graph');
const { getSellerInfo, calculateSellerRevenue } = require('../Controllers/Seller');

router.get('/products', getProducts);
router.get('/search-product', searchProducts);
router.get('/product-offers', getOffersOfProduct);
router.get('/graph-image', getGraphImage);
router.get('/seller-info', getSellerInfo);
router.get('/find-product-asins', findProductAsins);
router.get('/graph-data', getGraphData);
router.get('/calculate-seller-revenue', calculateSellerRevenue);

module.exports = router;
