const { QUERY_FOR_FETCH_PRODUCT_DATA } = require('../Enums/KeepaConstant');
const { searchProductsFromKeepa, getProductsFromKeepa } = require('../Services/Keepa.service');
const { extractNeededData } = require('../Utils/ExtractNeededData');

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
      return extractNeededData(product);
    });

    return res.status(200).json({ success: true, page: Number(page), products: finalResult });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchProducts };
