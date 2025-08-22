const {
  AMAZON_IMAGE_BASE_URL,
  RATING_CONSTANT,
  REVIEW_COUNT_CONSTANT,
  BUYBOX_PRICE_HISTORY_CONSTANT,
  SALES_RANK_HISTORY_CONSTANT,
  NEW_FBM_PRICE_HISTORY_CONSTANT,
  NEW_FBA_PRICE_HISTORY_CONSTANT,
  AMAZON_PRICE_HISTORY_CONSTANT,
  NEW_PRICE_HISTORY_CONSTANT,
  OFFER_COUNT_HISTORY_CONSTANT,
} = require('../Enums/KeepaConstant');
const { gramsToPounds } = require('./Converter');
const { buildFlatGraphData, extractGraphData, priceTransform, rankTransform } = require('./GraphCsvUtils');

const extractNeededDataFromProduct = (product) => {
  if (!product) return {};

  const extractedData = {};
  const csv = product.csv || [];

  // Images
  if (product.images?.length) {
    extractedData.images = product.images.map((img) => `${AMAZON_IMAGE_BASE_URL}${img?.l || img?.m}`);
  }

  // Basic info
  if (product.title) extractedData.title = product.title;
  if (product.asin) extractedData.asin = product.asin;
  if (product.categoryTree?.length) {
    extractedData.category = product.categoryTree[0]?.name || 'Uncategorized';
  }

  // Reviews
  const ratingHistory = csv[RATING_CONSTANT] || [];
  const reviewCountHistory = csv[REVIEW_COUNT_CONSTANT] || [];
  if (ratingHistory.length || reviewCountHistory.length) {
    extractedData.reviews = {};
    if (ratingHistory.length) extractedData.reviews.rating = ratingHistory.at(-1) / 10 || 0;
    if (reviewCountHistory.length) extractedData.reviews.count = reviewCountHistory.at(-1) || 0;
  }

  // Info
  const buyboxHistory = csv[BUYBOX_PRICE_HISTORY_CONSTANT] || [];
  const salesRankHistory = csv[SALES_RANK_HISTORY_CONSTANT] || [];
  if (buyboxHistory.length || salesRankHistory.length || product.monthlySold || product.competitivePriceThreshold || product.packageWeight || product?.itemWeight) {
    extractedData.info = {};
    if (buyboxHistory.length) extractedData.info.sellPrice = buyboxHistory.at(-2) / 100 || 0;
    if (salesRankHistory.length) extractedData.info.sellRank = salesRankHistory.at(-1) || 0;
    if (product.monthlySold) extractedData.info.monthlySold = product.monthlySold;
    if (product.competitivePriceThreshold) extractedData.info.competitivePriceThreshold = product.competitivePriceThreshold / 100;
  }

  // Dimension
  if (product.packageWidth || product.packageLength || product.packageHeight || product.packageWeight) {
    extractedData.dimension = {};
    if (product.packageWidth) extractedData.dimension.width = product.packageWidth;
    if (product.packageLength) extractedData.dimension.length = product.packageLength;
    if (product.packageHeight) extractedData.dimension.height = product.packageHeight;
    if (product.packageWeight) extractedData.dimension.weight = product.packageWeight;
  }

  // Fees
  if (product.fbaFees?.pickAndPackFee || product.referralFeePercent) {
    extractedData.fees = {};
    if (product.fbaFees?.pickAndPackFee) extractedData.fees.fbaFees = product.fbaFees.pickAndPackFee / 100;
    if (product.referralFeePercent) extractedData.fees.referralFeePercent = product.referralFeePercent / 100;
    if (product.packageWeight ?? product.itemWeight) extractedData.fees.inboundShippingFee = gramsToPounds(product.packageWeight ?? product.itemWeight);
  }

  // Graph data
  if (csv?.length) {
    extractedData.graphData = {};

    const graphConfigs = {
      salesGraph: {
        keys: {
          buyboxHistory: BUYBOX_PRICE_HISTORY_CONSTANT,
          amazonHistory: AMAZON_PRICE_HISTORY_CONSTANT,
          salesRankHistory: SALES_RANK_HISTORY_CONSTANT,
          newPriceHistory: NEW_PRICE_HISTORY_CONSTANT,
        },
        series: [
          { key: 'buyBox', source: 'buyboxHistory', step: 3, transform: priceTransform },
          { key: 'amazon', source: 'amazonHistory', step: 2, transform: priceTransform },
          { key: 'salesRank', source: 'salesRankHistory', step: 2, transform: rankTransform },
          { key: 'newPrice', source: 'newPriceHistory', step: 2, transform: priceTransform },
        ],
      },
      offerGraph: {
        keys: {
          offerCountHistory: OFFER_COUNT_HISTORY_CONSTANT,
        },
        series: [{ key: 'offerCount', source: 'offerCountHistory', step: 2, transform: rankTransform }],
      },
    };

    for (const [graphName, config] of Object.entries(graphConfigs)) {
      const graphRawData = extractGraphData(csv, config);
      extractedData.graphData[graphName] = buildFlatGraphData(graphRawData, config.series);
    }
  }

  return extractedData;
};

const extractOffersFromProduct = (product) => {
  if (!product?.liveOffersOrder?.length || !product?.offers?.length) return {};

  const { liveOffersOrder, offers } = product;

  const availableOffers = liveOffersOrder
    .map((index) => offers[index])
    .filter((offer) => offer?.condition === 1)
    .map((offer) => {
      const stock = offer.stockCSV?.length ? offer.stockCSV.at(-1) : false;
      const price = offer.offerCSV?.length >= 2 ? offer.offerCSV.at(-2) / 100 : null;

      let seller = offer.isAmazon ? 'AMZ' : offer.isFBA ? 'FBA' : 'FBM';

      return {
        stock,
        price,
        seller,
        sellerId: offer.sellerId,
        condition: offer.condition,
      };
    });

  const totalOfferCount = availableOffers.length;
  const amazonOfferCount = availableOffers.filter((o) => o.seller === 'AMZ').length;
  const fbaOfferCount = availableOffers.filter((o) => o.seller === 'FBA').length;
  const fbmOfferCount = availableOffers.filter((o) => o.seller === 'FBM').length;

  return {
    totalOfferCount,
    amazonOfferCount,
    fbaOfferCount,
    fbmOfferCount,
    offers: availableOffers,
  };
};

module.exports = { extractNeededDataFromProduct, extractOffersFromProduct };
