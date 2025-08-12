const { keepa } = require('../config');
const httpClient = require('../Utils/HttpClient');

const searchProductsFromKeepa = async (searchTerm, page = 0) => {
  try {
    const params = new URLSearchParams({
      key: keepa.apiKey,
      domain: keepa.amazonDomain,
      term: searchTerm,
      page: page,
      type: 'product',
      'asins-only': 1,
    });

    const { data } = await httpClient.get(`${keepa.baseURL}/search?${params.toString()}`);

    if (data.error && data.error.length > 0) {
      throw new Error(`Keepa API Error: ${data.error.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.error('Keepa API request failed:', error);
    throw new Error('Unable to fetch products from Keepa at the moment. Please try again later.');
  }
};

const getProductsFromKeepa = async (asins = [], moreQuery = {}) => {
  try {
    const params = new URLSearchParams({
      key: keepa.apiKey,
      domain: keepa.amazonDomain,
      asin: asins.join(','),
      ...moreQuery,
    });

    const { data } = await httpClient.get(`${keepa.baseURL}/product?${params.toString()}`);

    if (data.error && data.error.length > 0) {
      throw new Error(`Keepa API Error: ${data.error.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.error('Keepa API request failed:', error);
    throw new Error('Unable to fetch products from Keepa at the moment. Please try again later.');
  }
};

module.exports = { searchProductsFromKeepa, getProductsFromKeepa };
