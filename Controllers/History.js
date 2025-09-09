const { HistoryModal } = require('../Models/HistoryModel');
const { isValidASIN } = require('../Utils/Validator');

const upsertHistory = async (req, res) => {
  try {
    const { asin, ...historyData } = req.body;
    const { userId } = req.query;

    if (!asin) {
      return res.status(400).json({ success: false, message: 'ASIN is required' });
    }

    if (!isValidASIN(asin)) {
      return res.status(400).json({ success: false, message: 'ASIN should be valid asin' });
    }

    historyData.updatedAt = new Date();

    const history = await HistoryModal.findOneAndUpdate(
      { asin, userRef: userId },
      { $set: historyData, $setOnInsert: { asin, userRef: userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, history });
  } catch (err) {
    console.error('upsertHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { upsertHistory };
