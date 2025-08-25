const { OunceToPound } = require('./Converter');

const fbaInboundPlacementFees = {
  smallStandard: {
    maxDimensions: [15, 12, 0.75],
    weightLimits: {
      '16 oz or less': {
        minimal: 0.3,
        optimized: 0,
      },
    },
  },
  largeStandard: {
    maxDimensions: [18, 14, 8],
    weightLimits: {
      '12 oz or less': {
        minimal: 0.34,
      },
      '12+ oz to 1.5 lb': {
        minimal: 0.41,
      },
      '1.5+ lb to 3 lb': {
        minimal: 0.49,
      },
      '3+ lb to 20 lb': {
        minimal: 0.68,
      },
    },
  },
  largeBulky: {
    maxDimensions: [59, 33, 33],
    weightLimits: {
      '5 lb or less': {
        minimal: 1.6,
        partial: 1.1,
        optimized: 0,
      },
      '5+ lb to 12 lb': {
        minimal: 2.4,
        partial: 1.75,
      },
      '12+ lb to 28 lb': {
        minimal: 3.5,
        partial: 2.19,
      },
      '28+ lb to 42 lb': {
        minimal: 4.95,
        partial: 2.83,
      },
      '42+ lb to 50 lb': {
        minimal: 5.95,
        partial: 3.32,
      },
    },
  },
};

const getFBAInboundPlacementFees = (width, length, height, weightOz) => {
  if (!width || !length || !height || !weightOz || weightOz <= 0) {
    const defaultFees = fbaInboundPlacementFees.smallStandard.weightLimits['16 oz or less'];
    return {
      minimal: defaultFees?.minimal ?? 0,
      partial: defaultFees?.partial ?? 0,
      optimized: defaultFees?.optimized ?? 0,
    };
  }

  const weightLb = OunceToPound(weightOz);
  const dims = [width, length, height].sort((a, b) => b - a);

  function fits(maxDims) {
    const sorted = [...maxDims].sort((a, b) => b - a);
    return dims[0] <= sorted[0] && dims[1] <= sorted[1] && dims[2] <= sorted[2];
  }

  let category = null;

  if (fits(fbaInboundPlacementFees.smallStandard.maxDimensions) && weightOz <= 16) {
    category = 'smallStandard';
  } else if (fits(fbaInboundPlacementFees.largeStandard.maxDimensions) && weightLb <= 20) {
    category = 'largeStandard';
  } else if (fits(fbaInboundPlacementFees.largeBulky.maxDimensions) && weightLb <= 50) {
    category = 'largeBulky';
  }

  if (!category) {
    return { minimal: null, partial: null, optimized: null };
  }

  const limits = fbaInboundPlacementFees[category].weightLimits;
  let matched = null;

  for (const [range, fees] of Object.entries(limits)) {
    if (category === 'smallStandard' && weightOz <= 16) matched = fees;
    if (category === 'largeStandard') {
      if (range.includes('12 oz or less') && weightOz <= 12) matched = fees;
      if (range.includes('12+ oz to 1.5 lb') && weightOz > 12 && weightLb <= 1.5) matched = fees;
      if (range.includes('1.5+ lb to 3 lb') && weightLb > 1.5 && weightLb <= 3) matched = fees;
      if (range.includes('3+ lb to 20 lb') && weightLb > 3 && weightLb <= 20) matched = fees;
    }
    if (category === 'largeBulky') {
      if (range.includes('5 lb or less') && weightLb <= 5) matched = fees;
      if (range.includes('5+ lb to 12 lb') && weightLb > 5 && weightLb <= 12) matched = fees;
      if (range.includes('12+ lb to 28 lb') && weightLb > 12 && weightLb <= 28) matched = fees;
      if (range.includes('28+ lb to 42 lb') && weightLb > 28 && weightLb <= 42) matched = fees;
      if (range.includes('42+ lb to 50 lb') && weightLb > 42 && weightLb <= 50) matched = fees;
    }
  }

  return {
    minimal: matched?.minimal ?? 0,
    partial: matched?.partial ?? 0,
    optimized: matched?.optimized ?? 0,
  };
};

module.exports = { getFBAInboundPlacementFees };
