const currencyByCountry = {
  "South Africa": {
    code: "ZAR",
    symbol: "R",
  },

  "United States": {
    code: "USD",
    symbol: "$",
  },

  "United Kingdom": {
    code: "GBP",
    symbol: "£",
  },

  Canada: {
    code: "CAD",
    symbol: "C$",
  },

  Australia: {
    code: "AUD",
    symbol: "A$",
  },

  Germany: {
    code: "EUR",
    symbol: "€",
  },

  France: {
    code: "EUR",
    symbol: "€",
  },

  India: {
    code: "INR",
    symbol: "₹",
  },

  Brazil: {
    code: "BRL",
    symbol: "R$",
  },

  Other: {
    code: "USD",
    symbol: "$",
  },
};

export function getCurrency(country) {
  return currencyByCountry[country] || currencyByCountry.Other;
}
