const { keepa } = require('../config');
const httpClient = require('../Utils/HttpClient');
const https = require('https');

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

const getOffersOfProductFromKeepa = async (asin = '') => {
  try {
    const params = new URLSearchParams({
      key: keepa.apiKey,
      domain: keepa.amazonDomain,
      asin: asin,
      offers: 20,
      'only-live-offers': 1,
      stock: 1,
    });

    const { data } = await httpClient.get(`${keepa.baseURL}/product?${params.toString()}`);

    if (data.error && data.error.length > 0) {
      throw new Error(`Keepa API Error: ${data.error.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.error('Keepa API request failed:', error);
    throw new Error('Unable to fetch offers from Keepa at the moment.');
  }
};

const getGraphImageFromKeepa = (asin, res) => {
  const params = new URLSearchParams({
    key: keepa.apiKey,
    domain: keepa.amazonDomain,
    asin,
    salesrank: '1',
    bb: '1',
    title: '0',
  });

  const keepaUrl = `${keepa.baseURL}/graphimage?${params.toString()}`;

  https
    .get(keepaUrl, (keepaRes) => {
      if (keepaRes.statusCode !== 200) {
        res.status(keepaRes.statusCode).json({ success: false, message: 'Keepa API error' });
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      keepaRes.pipe(res);
    })
    .on('error', (err) => {
      res.status(500).json({ success: false, message: err.message });
    });
};

module.exports = { searchProductsFromKeepa, getProductsFromKeepa, getOffersOfProductFromKeepa, getGraphImageFromKeepa };
