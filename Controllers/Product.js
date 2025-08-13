const { QUERY_FOR_FETCH_PRODUCT_DATA } = require('../Enums/KeepaConstant');
const { searchProductsFromKeepa, getProductsFromKeepa, getOffersOfProductFromKeepa, getGraphImageFromKeepa } = require('../Services/Keepa.service');
const { extractNeededDataFromProduct, extractOffersFromProduct } = require('../Utils/ExtractNeededData');

const searchProducts = async (req, res) => {
  try {
    const { searchTerm, page = 0 } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Search Term is required' });
    }

    const searchedResult = await searchProductsFromKeepa(searchTerm, page);
    console.log(searchedResult);

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

const getOffersOfProduct = async (req, res) => {
  try {
    const { asin } = req.query;
    if (!asin) {
      return res.status(400).json({ success: false, message: 'Asin is required' });
    }

    const offersResult = await getOffersOfProductFromKeepa(asin);

    if (!offersResult?.products || !offersResult?.products?.length === 0 || offersResult?.products[0]?.offers?.length === 0) {
      return res.status(400).json({ success: false, message: 'Oops, This product has no offers.' });
    }

    const finalizedOffer = extractOffersFromProduct(offersResult?.products?.[0]);

    if (!finalizedOffer || Object.keys(finalizedOffer)?.length === 0) {
      return res.status(400).json({ success: false, message: 'Oops, This product has no offers.' });
    }

    return res.status(200).json({ success: true, asin: asin, offer: finalizedOffer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getGraphImage = (req, res) => {
  const { asin } = req.query;
  if (!asin) {
    return res.status(400).json({ success: false, message: 'ASIN is required' });
  }
  getGraphImageFromKeepa(asin, res);
};

module.exports = { searchProducts, getOffersOfProduct, getGraphImage };
