const { QUERY_FOR_FETCH_PRODUCT_DATA } = require('../Enums/KeepaConstant');
const { searchProductsFromKeepa, getProductsFromKeepa, getSellerInfoFromKeepa } = require('../Services/Keepa.service');
const { extractNeededDataFromProduct } = require('../Utils/ExtractNeededData');

const getSeller = async (req, res) => {
  try {
    const { sellerId, wantsDetailInfo = true } = req.query;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller Id is required' });
    }

    const searchedResult = await getSellerInfoFromKeepa(sellerId, { storefront: wantsDetailInfo ? 1 : 0 });

    if (!searchedResult?.asinList || !searchedResult?.asinList.length === 0) {
      return res.status(400).json({ success: false, message: 'Oops, No products matching with that search.' });
    }
    const fetchedResult = await getProductsFromKeepa(searchedResult?.asinList, QUERY_FOR_FETCH_PRODUCT_DATA);

    if (!fetchedResult?.products || !fetchedResult?.products.length === 0) {
      return res.status(400).json({ success: false, message: 'Oops, No products matching with that search.' });
    }

    const finalResult = fetchedResult?.products?.map((product, index) => {
      return extractNeededDataFromProduct(product);
    });

    return res.status(200).json({ success: true, page: Number(page), products: finalResult });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchProducts, getOffersOfProduct, getGraphImage };
