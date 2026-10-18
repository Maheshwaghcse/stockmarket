/**
 * Curated Indian Benchmark Indices & Top NSE/BSE Stocks Catalog
 * Used for Symbol Autocomplete, Company Name resolution, and Quick Slicers.
 */

/**
 * Official default lot sizes for major Indian indices and derivatives
 */
export const DEFAULT_STOCK_LOT_SIZES = {
  NIFTY: 65,
  NIFTY50: 65,
  BANKNIFTY: 30,
  FINNIFTY: 60,
  MIDCPNIFTY: 120,
  NIFTYMIDCAP: 120,
}

export const STOCK_CATALOG = [
  // Primary Benchmark Indices & Derivatives
  { symbol: 'NIFTY', name: 'Nifty 50 Index', type: 'Index', sector: 'Benchmark', defaultLotSize: 65 },
  { symbol: 'NIFTY50', name: 'Nifty 50 Index', type: 'Index', sector: 'Benchmark', defaultLotSize: 65 },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank (Bank Nifty)', type: 'Index', sector: 'Banking', defaultLotSize: 30 },
  { symbol: 'FINNIFTY', name: 'Nifty Financial Services', type: 'Index', sector: 'Financials', defaultLotSize: 60 },
  { symbol: 'MIDCPNIFTY', name: 'Nifty Midcap Select', type: 'Index', sector: 'Midcap', defaultLotSize: 120 },
  { symbol: 'NIFTYMIDCAP', name: 'Nifty Midcap Select', type: 'Index', sector: 'Midcap', defaultLotSize: 120 },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', type: 'Index', sector: 'Benchmark', defaultLotSize: 10 },
  { symbol: 'NIFTYIT', name: 'Nifty IT Index', type: 'Index', sector: 'IT' },
  { symbol: 'NIFTYAUTO', name: 'Nifty Auto Index', type: 'Index', sector: 'Auto' },
  { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma Index', type: 'Index', sector: 'Pharma' },

  // Banking & Financial Services
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'Stock', sector: 'Banking' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', type: 'Stock', sector: 'Banking' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', type: 'Stock', sector: 'Banking' },
  { symbol: 'PNB', name: 'Punjab National Bank', type: 'Stock', sector: 'Banking' },
  { symbol: 'CANBK', name: 'Canara Bank', type: 'Stock', sector: 'Banking' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', type: 'Stock', sector: 'Banking' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', type: 'Stock', sector: 'Financials' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', type: 'Stock', sector: 'Financials' },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment', type: 'Stock', sector: 'Financials' },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', type: 'Stock', sector: 'Financials' },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', type: 'Stock', sector: 'Financials' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', type: 'Stock', sector: 'Financials' },

  // IT & Technology
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'Stock', sector: 'IT' },
  { symbol: 'INFY', name: 'Infosys Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'TATAELXSI', name: 'Tata Elxsi Ltd', type: 'Stock', sector: 'IT' },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', type: 'Stock', sector: 'IT' },

  // Energy, Oil, Gas & Power
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'NTPC', name: 'NTPC Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', type: 'Stock', sector: 'Energy' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', type: 'Stock', sector: 'Energy' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', type: 'Stock', sector: 'Energy' },
  { symbol: 'IOC', name: 'Indian Oil Corporation', type: 'Stock', sector: 'Energy' },
  { symbol: 'GAIL', name: 'GAIL (India) Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'TATAPOWER', name: 'Tata Power Company Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd', type: 'Stock', sector: 'Energy' },
  { symbol: 'ADANIPOWER', name: 'Adani Power Ltd', type: 'Stock', sector: 'Energy' },

  // Auto & Mobility
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', type: 'Stock', sector: 'Auto' },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson', type: 'Stock', sector: 'Auto' },
  { symbol: 'TMPV', name: 'Tata Motors Passenger Veh', type: 'Stock', sector: 'Auto' },

  // FMCG & Consumer Goods
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', type: 'Stock', sector: 'FMCG' },
  { symbol: 'ITC', name: 'ITC Limited', type: 'Stock', sector: 'FMCG' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', type: 'Stock', sector: 'FMCG' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', type: 'Stock', sector: 'FMCG' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', type: 'Stock', sector: 'FMCG' },
  { symbol: 'VBL', name: 'Varun Beverages Ltd', type: 'Stock', sector: 'FMCG' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products', type: 'Stock', sector: 'FMCG' },
  { symbol: 'DABUR', name: 'Dabur India Ltd', type: 'Stock', sector: 'FMCG' },
  { symbol: 'MARICO', name: 'Marico Limited', type: 'Stock', sector: 'FMCG' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive India', type: 'Stock', sector: 'FMCG' },

  // Pharma & Healthcare
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', type: 'Stock', sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla Limited', type: 'Stock', sector: 'Pharma' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy Laboratories', type: 'Stock', sector: 'Pharma' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', type: 'Stock', sector: 'Pharma' },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', type: 'Stock', sector: 'Pharma' },
  { symbol: 'LUPIN', name: 'Lupin Limited', type: 'Stock', sector: 'Pharma' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', type: 'Stock', sector: 'Pharma' },
  { symbol: 'ZYDUSLIFE', name: 'Zydus Lifesciences Ltd', type: 'Stock', sector: 'Pharma' },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd', type: 'Stock', sector: 'Pharma' },
  { symbol: 'MANKIND', name: 'Mankind Pharma Ltd', type: 'Stock', sector: 'Pharma' },

  // Metals & Mining
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', type: 'Stock', sector: 'Metals' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', type: 'Stock', sector: 'Metals' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', type: 'Stock', sector: 'Metals' },
  { symbol: 'VEDL', name: 'Vedanta Limited', type: 'Stock', sector: 'Metals' },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', type: 'Stock', sector: 'Metals' },
  { symbol: 'NMDC', name: 'NMDC Limited', type: 'Stock', sector: 'Metals' },
  { symbol: 'SAIL', name: 'Steel Authority of India', type: 'Stock', sector: 'Metals' },

  // Infrastructure, Capital Goods, Defence & Telecom
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', type: 'Stock', sector: 'Infra' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', type: 'Stock', sector: 'Retail' },
  { symbol: 'TRENT', name: 'Trent Ltd', type: 'Stock', sector: 'Retail' },
  { symbol: 'DMART', name: 'Avenue Supermarts (DMart)', type: 'Stock', sector: 'Retail' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', type: 'Stock', sector: 'Telecom' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', type: 'Stock', sector: 'Defence' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', type: 'Stock', sector: 'Defence' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', type: 'Stock', sector: 'Defence' },
  { symbol: 'COCHINSHIP', name: 'Cochin Shipyard Ltd', type: 'Stock', sector: 'Defence' },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation', type: 'Stock', sector: 'Travel' },
  { symbol: 'IRCTC', name: 'IRCTC Ltd', type: 'Stock', sector: 'Travel' },
  { symbol: 'DLF', name: 'DLF Ltd', type: 'Stock', sector: 'Realty' },
  { symbol: 'LODHA', name: 'Macrotech Developers (Lodha)', type: 'Stock', sector: 'Realty' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', type: 'Stock', sector: 'Realty' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', type: 'Stock', sector: 'Cement' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd', type: 'Stock', sector: 'Cement' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', type: 'Stock', sector: 'Cement' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', type: 'Stock', sector: 'Paints' },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India', type: 'Stock', sector: 'Paints' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', type: 'Stock', sector: 'Chemicals' },
  { symbol: 'SRF', name: 'SRF Limited', type: 'Stock', sector: 'Chemicals' },
  { symbol: 'DIXON', name: 'Dixon Technologies', type: 'Stock', sector: 'Tech' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', type: 'Stock', sector: 'Tech' },
  { symbol: 'PAYTM', name: 'One97 Communications (Paytm)', type: 'Stock', sector: 'Tech' },
  { symbol: 'POLICYBZR', name: 'PB Fintech (Policybazaar)', type: 'Stock', sector: 'Tech' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', type: 'Stock', sector: 'Tech' },
]

/**
 * Find matching stocks and indices by symbol prefix or name match.
 */
export function searchStockCatalog(query, limit = 8) {
  if (!query || typeof query !== 'string') return []
  const q = query.trim().toUpperCase()
  if (!q) return []

  const startsWithSymbol = []
  const containsSymbol = []
  const containsName = []

  for (const item of STOCK_CATALOG) {
    const sym = item.symbol.toUpperCase()
    const nm = item.name.toUpperCase()

    if (sym.startsWith(q)) {
      startsWithSymbol.push(item)
    } else if (sym.includes(q)) {
      containsSymbol.push(item)
    } else if (nm.includes(q)) {
      containsName.push(item)
    }
  }

  return [...startsWithSymbol, ...containsSymbol, ...containsName].slice(0, limit)
}
