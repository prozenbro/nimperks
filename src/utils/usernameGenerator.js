const nouns = [
  "Bitcoin", "Ether", "Nimiq", "Gold", "Luna", "Rocket", "Star", "Galaxy", "Nebula",
  "Perk", "Stamp", "Voucher", "Token", "Wallet", "Chain", "Block", "Node", "Miner",
  "Coffee", "Pizza", "Burger", "Store", "Shop", "Cafe", "Market", "Merchant", "Client"
];

const adjectives = [
  "Golden", "Shiny", "Fast", "Secure", "Crypto", "Loyal", "Smart", "Happy", "Sweet",
  "Fresh", "Tasty", "Quick", "Stellar", "Lunar", "Solar", "Decentral", "Grand", "Super",
  "Warm", "Bright", "Mega", "Micro", "Alpha", "Beta", "Neon", "Magic", "Glitch"
];

const adverbs = [
  "Swiftly", "Boldly", "Quickly", "Safely", "Happily", "Smartly", "Grandly", "Kindly",
  "Warmly", "Brightly", "Locally", "Globally", "Daily", "Weekly", "Monthly", "Yearly",
  "Instantly", "Proudly", "Loyally", "Fully", "Always", "Often", "Quietly", "Loudly"
];

// Helper to generate a deterministic pseudo-random number based on a seed
function seedRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateSuggestedUsername(seed, attempt = 0) {
  // Combine timestamp seed and attempt number to create a unique hash seed
  const uniqueSeed = seed + attempt * 1337;
  
  const nounIdx = Math.floor(seedRandom(uniqueSeed) * nouns.length);
  const adjIdx = Math.floor(seedRandom(uniqueSeed + 1) * adjectives.length);
  const advIdx = Math.floor(seedRandom(uniqueSeed + 2) * adverbs.length);
  
  // Noun (1st) + Adjective (2nd) + Adverb (3rd)
  // e.g. NimiqGoldenSwiftly
  return `${nouns[nounIdx]}${adjectives[adjIdx]}${adverbs[advIdx]}`;
}
