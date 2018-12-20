// @flow

import type { MFRDishFood } from './V1';

type DishFoodCalculatedInfo = {
  normalized: boolean,
  normalizedQuantity: number,
}

const multipliers = {
  f: 1E-15,
  p: 1E-12,
  n: 1E-9,
  µ: 1E-6,
  u: 1E-6,
  m: 1E-3,
  c: 1E-2,
  d: 1E-1,
  da: 1E1,
  h: 1E2,
  k: 1E3,
  M: 1E6,
  G: 1E9,
  T: 1E12,
};

const units = [
  'g', 'l', 'L', 'cal', 'Cal', 'J', 'm',
  'N', 'Å', 'K', '°C', '°F', 'Pa', 'bar',
];

const unitMultiplier = (symbol: string, exponent: number | string = 1) => {
  const res = multipliers[symbol];
  if (!res) throw new Error('Could not convert symbol to multiplier');
  let exp;
  if (typeof exponent === 'number') {
    exp = exponent;
  } else {
    exp = Number(exp);
  }
  switch (exp) {
    case 1: return res;
    case 2: case '²': return res * res;
    case 3: case '³': return res * res * res;
    default: return res ** exp;
  }
};

//  /^(n|µ|u|m|k)?((g|l|L|cal|Cal|J|m|N|Å|K|°C|°F|Pa|bar)(2|²|3|³)?)$/;
const unitre = new RegExp(`^(${Object.keys(multipliers).join('|')})?((${units.join('|')})(\\d|²|³)?)$`);

export const normalizeQuantity = (quantity: number, unit: string) => {
  const matches = unitre.exec(unit);
  if (matches && matches.length) {
    const [, multiplierSymbol, baseUnitExponent, baseUnit, exponent] = matches;
    let multiplier = 1;
    if (multiplierSymbol) {
      multiplier = unitMultiplier(multiplierSymbol, exponent);
    }
    return {
      quantity: quantity * multiplier,
      unit: baseUnitExponent,
      baseUnit,
      exponent,
    };
  }
  throw new Error('Could not normalize quantity');
};

export const calculateDishFoodInfo = (
  dishFood: MFRDishFood,
): DishFoodCalculatedInfo => {
  const {
    eaten_quantity: eatenQuantity,
    eaten_unit: eatenUnit,
    present_quantity: presentQuantity,
    present_unit: presentUnit,
  } = dishFood;

  let normalized = false;

  let normalizedQuantity = 0;
  if (eatenUnit === '%') {
    if (typeof presentQuantity === 'number'
      && typeof presentUnit === 'string'
      && typeof eatenQuantity === 'number') {
      const eQ = eatenQuantity;
      normalizedQuantity = normalizeQuantity(
        presentQuantity,
        presentUnit,
      ).quantity * eQ / 100;
      normalized = true;
    }
  } else if (typeof eatenQuantity === 'number'
      && typeof eatenUnit === 'string') {
    normalizedQuantity = normalizeQuantity(eatenQuantity, eatenUnit).quantity;
    normalized = true;
  }

  return {
    normalized,
    normalizedQuantity,
  };
};
