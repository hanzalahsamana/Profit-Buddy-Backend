require('dotenv').config();

module.exports = {
  keepa: {
    baseURL: 'https://api.keepa.com',
    apiKey: process.env.KEEPA_API_KEY,
    amazonDomain: process.env.KEEPA_AMAZON_DOMAIN_CODE,
  },
};
