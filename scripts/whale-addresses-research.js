/**
 * Real Stacks Whale Addresses Research
 * 
 * This file documents real, validated Stacks addresses to use for whale seeding
 */

// CONFIRMED PROTOCOL CONTRACTS (For reference, not whales)
const PROTOCOL_ADDRESSES = {
  ALEX_DEX: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', // ALEX protocol - VERIFIED
  ARKADIKO: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', // Arkadiko protocol - VERIFIED
  STACKING_DAO: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', // StackingDAO - VERIFIED
  VELAR: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1', // Velar DEX
};

// REAL WHALE ADDRESSES (to be populated from research)
// Will query these addresses to find real active traders
const RESEARCH_CANDIDATES = [
  // Known large holders from ALEX ecosystem
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', // ALEX - verified has massive token holdings
  
  // Arkadiko ecosystem  
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', // Arkadiko - protocol treasury
  
  // StackingDAO
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', // StackingDAO - verified
  
  // Large WELSH holder (found in API response)
  'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G', // WELSH contract
  
  // Other verified addresses
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275', // StackSwap
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // Gamma NFT marketplace
  
  // Individual whale candidates (need to find from explorer)
  // These will be populated from:
  // 1. ALEX top LP providers
  // 2. Top WELSH holders
  // 3. Top PoX stackers
  // 4. High-volume traders
];

// Strategy: Query protocol contracts for their top interactors
// Then validate those addresses have significant holdings
