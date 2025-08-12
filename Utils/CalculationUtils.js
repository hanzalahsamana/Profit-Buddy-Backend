function calculateMaxCost(sellingPrice, referralFee, fulfillmentFee, minROI, minProfit) {
  // Calculate max cost based on ROI
  const maxCostByROI = (sellingPrice - referralFee - fulfillmentFee) / (1 + minROI);

  // Calculate profit with maxCostByROI
  const profit = sellingPrice - referralFee - fulfillmentFee - maxCostByROI;

  // If profit meets or exceeds minProfit, return maxCostByROI
  // Otherwise, adjust max cost to ensure minProfit
  if (profit >= minProfit) {
    return Math.floor(maxCostByROI * 100) / 100;
  } else {
    const maxCostByProfit = sellingPrice - referralFee - fulfillmentFee - minProfit;
    return Math.floor(maxCostByProfit * 100) / 100;
  }
}

// Example usage:
const sellingPrice = 54.5;
const referralFee = 9.27;
const fulfillmentFee = 7.96;
const minROI = 0.25; // 25%
const minProfit = 3.0;

const maxCost = calculateMaxCost(sellingPrice, referralFee, fulfillmentFee, minROI, minProfit);
console.log('Maximum Cost:', maxCost);

function calculateProfitMargin(sellingPrice, costPrice, referralFee, fulfillmentFee) {
  const totalCost = costPrice + referralFee + fulfillmentFee;
  const profit = sellingPrice - totalCost;
  const profitMargin = (profit / sellingPrice) * 100;
  return profitMargin.toFixed(2); // returns string with 2 decimals
}

// Example usage:
const sellingPrice2 = 54.5;
const costPrice = 29.81; // your max cost or actual cost
const referralFee2 = 9.27;
const fulfillmentFee2 = 7.96;

const margin = calculateProfitMargin(sellingPrice2, costPrice, referralFee2, fulfillmentFee2);
console.log('Profit Margin (%):', margin);

const KEEPA_EPOCH_START_MINUTES = 21564000;

const MILLISECONDS_IN_ONE_MINUTE = 60000;

function keepaTimeMinutesToUnixTime(keepaMinutes) {
  const abc = (KEEPA_EPOCH_START_MINUTES + keepaMinutes) * MILLISECONDS_IN_ONE_MINUTE;
  return new Date(abc);
}

console.log('keepaTimeMinutesToUnixTime:', keepaTimeMinutesToUnixTime(7683452));

const liveOffersOrder = [1, 11, 8];
function getOffersByIndex(offers, liveOffersOrder) {
  return liveOffersOrder.map((index) => offers[index]);
}
