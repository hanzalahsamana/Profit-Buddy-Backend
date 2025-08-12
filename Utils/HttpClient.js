const axios = require('axios');

const httpClient = axios.create({
  timeout: 10000,
});

module.exports = httpClient;
