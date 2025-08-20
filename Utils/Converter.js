const gramsToPounds = (g) => g / 453.592;

const keepaToFlatGraphData = (graphData, opts = {}) => {
  const {
    priceDivisor = 100,
    locale = 'en-US',
    dateFormatOptions = { month: 'short', day: 'numeric' },
    forwardFill = true, // default: true -> fill nulls with previous non-null
    fillInitialWithFirst = false, // optional: fill leading nulls with first found non-null
  } = opts;

  // keepa minute -> unix ms
  const keepaToMs = (keepaMinute) => (Number(keepaMinute) + 21564000) * 60000;

  // parse pairs array [t, v, t, v, ...]
  const parsePairsToMap = (arr, transformValue = (v) => v) => {
    const map = new Map();
    if (!Array.isArray(arr)) return map;
    for (let i = 0; i < arr.length; i += 2) {
      const t = arr[i];
      const v = arr[i + 1];
      if (t == null) continue;
      map.set(Number(t), transformValue(v));
    }
    return map;
  };

  // parse triplets [t, v, flag, t, v, flag, ...] (used for buyboxHistory)
  const parseTripletsToMap = (arr, transformValue = (v) => v) => {
    const map = new Map();
    if (!Array.isArray(arr)) return map;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i];
      const v = arr[i + 1];
      if (t == null) continue;
      map.set(Number(t), transformValue(v));
    }
    return map;
  };

  // transform value helpers
  const priceTransform = (v) => {
    if (v == null || v === -1) return null;
    if (typeof v === 'number') return v / priceDivisor;
    const n = Number(v);
    return Number.isNaN(n) ? null : n / priceDivisor;
  };
  const rankTransform = (v) => {
    if (v == null || v === -1) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const buyBoxMap = parseTripletsToMap(graphData.buyboxHistory || [], priceTransform);
  const amazonMap = parsePairsToMap(graphData.amazonHistory || [], priceTransform);
  const rankMap = parsePairsToMap(graphData.salesRankHistory || [], rankTransform);
  const newMap = parsePairsToMap(graphData.newHistory || [], priceTransform);

  // union of all timestamps
  const tsSet = new Set([...buyBoxMap.keys(), ...amazonMap.keys(), ...rankMap.keys(), ...newMap.keys()]);
  const tsArray = Array.from(tsSet).sort((a, b) => a - b);

  // build final array
  const result = tsArray.map((keepaMinute) => {
    const ms = keepaToMs(keepaMinute);
    const date = new Date(ms).toLocaleDateString(locale, dateFormatOptions);
    return {
      date,
      amazon: amazonMap.has(keepaMinute) ? amazonMap.get(keepaMinute) : null,
      buyBox: buyBoxMap.has(keepaMinute) ? buyBoxMap.get(keepaMinute) : null,
      salesRank: rankMap.has(keepaMinute) ? rankMap.get(keepaMinute) : null,
      new: newMap.has(keepaMinute) ? newMap.get(keepaMinute) : null,
    };
  });

  // Forward-fill nulls (per-series) if requested.
  if (forwardFill && result.length) {
    const keys = ['amazon', 'buyBox', 'salesRank', 'new'];

    // Optionally fill leading nulls with first-found non-null value
    if (fillInitialWithFirst) {
      keys.forEach((k) => {
        let firstFound = null;
        for (let i = 0; i < result.length; i++) {
          const v = result[i][k];
          if (v !== null && v !== undefined) {
            firstFound = v;
            break;
          }
        }
        if (firstFound !== null) {
          for (let i = 0; i < result.length; i++) {
            if (result[i][k] === null || result[i][k] === undefined) {
              result[i][k] = firstFound;
            } else break; // stop once first real value encountered
          }
        }
      });
    }

    // Forward fill subsequent nulls with previous non-null (0 counts as valid)
    keys.forEach((k) => {
      let last = null;
      for (let i = 0; i < result.length; i++) {
        const v = result[i][k];
        if (v === null || v === undefined) {
          // keep null if we have no last known value
          if (last !== null && last !== undefined) {
            result[i][k] = last;
          } // else leave as null
        } else {
          last = v; // update last known (including 0)
        }
      }
    });
  }

  return result;
};


module.exports = { gramsToPounds , keepaToFlatGraphData };