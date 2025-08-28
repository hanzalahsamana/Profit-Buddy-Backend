const { KEEPA_EPOCH_START_MINUTES } = require('../Enums/KeepaConstant');

const keepaToMs = (keepaMinute) => (Number(keepaMinute) + KEEPA_EPOCH_START_MINUTES) * 60000;

const parseToMap = (arr, step, transformValue = (v) => v) => {
  const map = new Map();
  if (!Array.isArray(arr)) return map;
  for (let i = 0; i < arr.length; i += step) {
    const t = arr[i];
    const v = arr[i + 1];
    if (t == null) continue;
    map.set(Number(t), transformValue(v));
  }
  return map;
};

const priceTransform = (v, divisor = 100) => {
  if (v == null || v === -1) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n / divisor;
};

const rankTransform = (v) => {
  if (v == null || v === -1) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const clamp90DaysData = (data) => {
  const today = new Date('2025-08-28'); // <-- replace with new Date()
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 90);

  // Normalize dates to Date objects
  let normalized = data.map((d) => ({ ...d, date: new Date(d.date) }));

  // Step 1: filter only inside the 90-day window
  normalized = normalized.filter((d) => d.date >= startDate && d.date <= today);

  // Step 2: ensure startDate exists (30 May)
  let first = normalized.find((d) => d.date.getTime() === startDate.getTime());
  if (!first) {
    // find nearest future record
    const nearest = normalized.find((d) => d.date > startDate);
    if (nearest) {
      first = { ...nearest, date: new Date(startDate) };
      normalized.unshift(first); // insert at beginning
    }
  }

  // Step 3: ensure today exists (28 Aug)
  let last = normalized.find((d) => d.date.getTime() === today.getTime());
  if (!last) {
    // find nearest past record
    const nearest = [...normalized].reverse().find((d) => d.date < today);
    if (nearest) {
      last = { ...nearest, date: new Date(today) };
      normalized.push(last); // insert at end
    }
  }

  return normalized;
};

const forwardFillSeries = (result, keys, fillInitialWithFirst = false) => {
  if (!Array.isArray(result) || result.length === 0) return;

  // 1) Fill leading nulls from the first forward non-null (only if requested)
  if (fillInitialWithFirst) {
    keys.forEach((k) => {
      // find first non-null value for this key
      let firstFound = null;
      for (let i = 0; i < result.length; i++) {
        const v = result[i][k];
        if (v !== null && v !== undefined) {
          firstFound = v;
          break;
        }
      }

      // if found, fill all leading null/undefined entries up to the first real value
      if (firstFound !== null) {
        for (let i = 0; i < result.length; i++) {
          if (result[i][k] === null || result[i][k] === undefined) {
            result[i][k] = firstFound;
          } else {
            // once we hit a real value, stop filling leading section
            break;
          }
        }
      }
    });
  }

  // 2) Backward fill the rest of the series (propagate last seen value forward)
  keys.forEach((k) => {
    let last = null;
    for (let i = 0; i < result.length; i++) {
      const v = result[i][k];
      if (v === null || v === undefined) {
        if (last !== null && last !== undefined) {
          result[i][k] = last;
        }
      } else {
        last = result[i][k];
      }
    }
  });
};

const buildFlatGraphData = (graphData, seriesConfigs, opts = {}) => {
  // NOTE: changed default fillInitialWithFirst to true so the first element
  // will take the next available value if it is null.
  const {
    priceDivisor = 100,
    forwardFill = true,
    fillInitialWithFirst = true, // <-- changed default to true
  } = opts;

  const seriesMaps = {};
  const tsSet = new Set();

  seriesConfigs.forEach(({ key, source, step, transform }) => {
    const arr = graphData[source] || [];
    const map = parseToMap(arr, step, (v) => transform(v, priceDivisor));
    seriesMaps[key] = map;
    map.forEach((_, t) => tsSet.add(t));
  });

  const tsArray = Array.from(tsSet).sort((a, b) => a - b);

  let result = tsArray.map((keepaMinute) => {
    const ms = keepaToMs(keepaMinute);
    const date = new Date(ms);
    const entry = { date };
    for (const key in seriesMaps) {
      entry[key] = seriesMaps[key].get(keepaMinute) ?? null;
    }
    return entry;
  });

  if (forwardFill) {
    forwardFillSeries(result, Object.keys(seriesMaps), fillInitialWithFirst);
  }

  result = clamp90DaysData(result);

  result = result.filter((entry) => Object.keys(seriesMaps).some((k) => entry[k] !== null));

  if (result.length === 1) {
    result.push({ ...result[0] });
  }

  return result;
};

const extractGraphData = (csv, config) => {
  const graphData = {};
  for (const [key, constant] of Object.entries(config.keys)) {
    if (csv[constant]?.length) {
      graphData[key] = csv[constant];
    }
  }
  return graphData;
};

module.exports = { extractGraphData, buildFlatGraphData, priceTransform, rankTransform };
