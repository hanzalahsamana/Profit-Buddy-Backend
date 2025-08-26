const { getGraphImageFromKeepa } = require('../Services/Keepa.service');

const getGraphImage = (req, res) => {
  const { asin } = req.query;
  if (!asin) {
    return res.status(400).json({ success: false, message: 'ASIN is required' });
  }
  getGraphImageFromKeepa(asin, res);
};

module.exports = { getGraphImage };
