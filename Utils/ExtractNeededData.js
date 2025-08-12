const { AMAZON_IMAGE_BASE_URL, RATING_CONSTANT, REVIEW_COUNT_CONSTANT } = require('../Enums/KeepaConstant');

// Extract Needed Data From Product
const extractNeededData = (product) => {
  let extractedData = {};

  if (product?.images && product?.images?.length > 0) {
    extractedData.images = product.images.map((img) => {
      return `${AMAZON_IMAGE_BASE_URL}${img?.l || img?.m}`;
    });
  }

  if (product?.title) {
    extractedData.title = product.title;
  }

  if (product?.asin) {
    extractedData.title = product.asin;
  }

  if (product?.categoryTree && product?.categoryTree?.length > 0) {
    extractedData.category = product.categoryTree[0]?.name || 'Uncategorized';
  }
  
  extractedData.reviews = {};

  if (product?.csv && product?.csv?.[RATING_CONSTANT] && product?.csv?.[RATING_CONSTANT]?.length > 0) {
    extractedData.reviews?.rating = product.csv[RATING_CONSTANT]?.[product.csv[RATING_CONSTANT].length - 1] || 0;
  }

  if (product?.csv && product?.csv?.[REVIEW_COUNT_CONSTANT] && product?.csv?.[REVIEW_COUNT_CONSTANT]?.length > 0) {
    extractedData.reviews?.count = product.csv[REVIEW_COUNT_CONSTANT]?.[product.csv[REVIEW_COUNT_CONSTANT].length - 1] || 0;
  }
};

module.exports = { extractNeededData };
