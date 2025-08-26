const { getSellerInfoFromKeepa, getCategoryInfoFromKeepa } = require('../Services/Keepa.service');
const { extractNeededDataFromSeller, enrichSellersWithCategoryName } = require('../Utils/ExtractNeededData');

const getSellerInfo = async (req, res) => {
  try {
    const { sellerId, wantsDetailInfo = false } = req.query;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller Id is required' });
    }

    const Sellers = await getSellerInfoFromKeepa(sellerId, { storefront: wantsDetailInfo ? 1 : 0 });

    if (!Sellers?.[sellerId] || !Object?.keys(Sellers?.[sellerId]).length) {
      return res.status(400).json({ success: false, message: 'Oops, No seller found with that ID.' });
    }

    const formatedSellerData = extractNeededDataFromSeller(Sellers?.[sellerId]);

    const categoryIds = [...new Set(formatedSellerData.categories.map((c) => c.id))];
    const categoryIdParam = categoryIds.join(',');

    const CategoryInfo = await getCategoryInfoFromKeepa(categoryIdParam);

    const enrichedSeller = enrichSellersWithCategoryName(formatedSellerData, CategoryInfo);

    return res.status(200).json({ success: true, seller: enrichedSeller });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSellerInfo };
