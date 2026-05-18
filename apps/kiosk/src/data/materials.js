export const CATEGORIES = [
  {
    id: 'flooring', label: 'Flooring', icon: '▦',
    filters: ['All', 'LVP', 'Carpet', 'Tile'],
    items: [
      { name: 'Driftwood Oak', brand: 'Shaw Contract', sku: 'SHW-5E283', type: 'LVP', finish: 'Matte', thickness: '5mm', badge: 'popular', colors: ['#c8b89a','#a8906c','#8a7254','#6b5540'], pat: 'wood' },
      { name: 'Coastal Fog', brand: 'Armstrong', sku: 'ARM-L3102', type: 'LVP', finish: 'Low Gloss', thickness: '6mm', badge: 'standard', colors: ['#d0cec8','#b8b4aa','#9a9690','#7c7870'], pat: 'wood' },
      { name: 'Harvest Wheat', brand: 'Shaw Contract', sku: 'SHW-6E219', type: 'LVP', finish: 'Satin', thickness: '5mm', badge: 'standard', colors: ['#d4b87a','#c0a060','#a88848','#906c34'], pat: 'wood' },
      { name: 'Charcoal Stone', brand: 'Armstrong', sku: 'ARM-T9801', type: 'Tile', finish: 'Matte', thickness: '4mm', badge: 'premium', colors: ['#787068','#605850','#4a403a','#363028'], pat: 'stone' },
      { name: 'Ivory Travertine', brand: 'Karndean', sku: 'KRN-VGT2101', type: 'Tile', finish: 'Natural', thickness: '4mm', badge: 'premium', colors: ['#e8dfc8','#d4c8a8','#bfae88','#a89870'], pat: 'marble' },
      { name: 'Morning Mist', brand: 'Mohawk', sku: 'MOH-2B441', type: 'Carpet', finish: 'Loop Pile', thickness: '—', badge: 'popular', colors: ['#c8ccd0','#b0b4bc','#989ca8','#808490'], pat: 'carpet' },
      { name: 'Sandstone Berber', brand: 'Shaw', sku: 'SHA-E9923', type: 'Carpet', finish: 'Berber Loop', thickness: '—', badge: 'standard', colors: ['#d4c4a4','#c0ae88','#a8986c','#908050'], pat: 'carpet' },
      { name: 'Classic White', brand: 'Daltile', sku: 'DAL-W880', type: 'Tile', finish: 'Gloss', thickness: '—', badge: 'standard', colors: ['#f0ede8','#e4e0d8','#d4d0c8','#c0bcb0'], pat: 'tile' },
      { name: 'Greige Porcelain', brand: 'Daltile', sku: 'DAL-P1245', type: 'Tile', finish: 'Matte', thickness: '—', badge: 'popular', colors: ['#c8c0b0','#b4a898','#9c9080','#847868'], pat: 'tile' },
    ],
  },
  {
    id: 'cabinets', label: 'Cabinets', icon: '⬜',
    filters: ['All', 'Shaker', 'Raised Panel', 'Flat'],
    items: [
      { name: 'Shaker White', brand: 'Aristokraft', sku: 'ARI-BIRCH-WH', type: 'Shaker', finish: 'Painted', hardware: 'Brushed Nickel', badge: 'popular', colors: ['#f0ede8','#e0ddd4','#d0cdc4','#c0bdb4'], pat: 'shaker' },
      { name: 'Shaker Linen', brand: 'Aristokraft', sku: 'ARI-BIRCH-LN', type: 'Shaker', finish: 'Painted', hardware: 'Brushed Nickel', badge: 'standard', colors: ['#e4d8c0','#d4c4a4','#c0ad88','#a8946c'], pat: 'shaker' },
      { name: 'Shaker Grey', brand: 'Aristokraft', sku: 'ARI-BIRCH-GY', type: 'Shaker', finish: 'Painted', hardware: 'Matte Black', badge: 'popular', colors: ['#b8b4ac','#a4a098','#909088','#7c7878'], pat: 'shaker' },
      { name: 'Raised Panel Cherry', brand: 'Kraftmaid', sku: 'KMD-RP-CH', type: 'Raised Panel', finish: 'Stained', hardware: 'Oil-Rubbed Bronze', badge: 'premium', colors: ['#8c4830','#7a3c28','#683020','#581c14'], pat: 'raised' },
      { name: 'Flat Panel White Oak', brand: 'Kraftmaid', sku: 'KMD-FP-WO', type: 'Flat', finish: 'Natural Stain', hardware: 'Matte Black', badge: 'premium', colors: ['#d4c8a8','#c0b490','#a89c78','#908460'], pat: 'wood' },
      { name: 'Thermofoil Almond', brand: 'Merillat', sku: 'MER-TF-AL', type: 'Flat', finish: 'Smooth', hardware: 'Satin Nickel', badge: 'standard', colors: ['#e8dcc8','#d8ccb4','#c4b89a','#b0a480'], pat: 'flat' },
    ],
  },
  {
    id: 'countertops', label: 'Countertops', icon: '◼',
    filters: ['All', 'Quartz', 'Granite', 'Laminate'],
    items: [
      { name: 'Calacatta Laza', brand: 'Silestone', sku: 'SIL-CL-4200', type: 'Quartz', finish: 'Polished', edge: 'Eased', badge: 'premium', colors: ['#f4f0ec','#e4d8d0','#ccc0b4','#b4a494'], pat: 'marble' },
      { name: 'Eternal Grigio', brand: 'Silestone', sku: 'SIL-EG-3390', type: 'Quartz', finish: 'Polished', edge: 'Eased', badge: 'popular', colors: ['#c8c4bc','#b0aca4','#989490','#84807c'], pat: 'granite' },
      { name: 'White Arabesque', brand: 'Cambria', sku: 'CAM-WA-710', type: 'Quartz', finish: 'Matte', edge: 'Beveled', badge: 'premium', colors: ['#f0ecec','#e0d4d0','#ccbcb4','#b4a498'], pat: 'marble' },
      { name: 'Linen Formica', brand: 'Formica', sku: 'FOR-7732-46', type: 'Laminate', finish: 'Matte', edge: 'Eased', badge: 'standard', colors: ['#d8ccb4','#c8bc9c','#b4a884','#a09070'], pat: 'flat' },
      { name: 'Black Mist Granite', brand: 'MSI', sku: 'MSI-BMG-3CM', type: 'Granite', finish: 'Polished', edge: 'Bullnose', badge: 'premium', colors: ['#3c3834','#2c2824','#1e1c18','#141210'], pat: 'granite' },
      { name: 'Typhoon Bordeaux', brand: 'MSI', sku: 'MSI-TB-3CM', type: 'Granite', finish: 'Polished', edge: 'Eased', badge: 'premium', colors: ['#784858','#603848','#4c2838','#381820'], pat: 'granite' },
      { name: 'Wilsonart Almond', brand: 'Wilsonart', sku: 'WIL-4862-38', type: 'Laminate', finish: 'Standard', edge: 'Eased', badge: 'standard', colors: ['#ddd0b0','#ccc09a','#b8ac84','#a4986e'], pat: 'flat' },
    ],
  },
  {
    id: 'paint', label: 'Paint', icon: '◕',
    filters: ['All', 'Light', 'Mid', 'Dark'],
    items: [
      { name: 'Accessible Beige', brand: 'Sherwin-Williams', sku: 'SW 7036', type: 'Light', finish: 'Eggshell', lrv: '58', badge: 'popular', colors: ['#d4c8a8'], pat: 'solid' },
      { name: 'Agreeable Gray', brand: 'Sherwin-Williams', sku: 'SW 7029', type: 'Mid', finish: 'Eggshell', lrv: '60', badge: 'popular', colors: ['#c8c0b0'], pat: 'solid' },
      { name: 'Alabaster', brand: 'Sherwin-Williams', sku: 'SW 7008', type: 'Light', finish: 'Eggshell', lrv: '82', badge: 'popular', colors: ['#f0e8d8'], pat: 'solid' },
      { name: 'Antique White', brand: 'Sherwin-Williams', sku: 'SW 6119', type: 'Light', finish: 'Eggshell', lrv: '75', badge: 'standard', colors: ['#e8dcca'], pat: 'solid' },
      { name: 'Repose Gray', brand: 'Sherwin-Williams', sku: 'SW 7015', type: 'Mid', finish: 'Eggshell', lrv: '58', badge: 'popular', colors: ['#bebab4'], pat: 'solid' },
      { name: 'Passive Gray', brand: 'Sherwin-Williams', sku: 'SW 7064', type: 'Mid', finish: 'Eggshell', lrv: '60', badge: 'standard', colors: ['#c4c2ba'], pat: 'solid' },
      { name: 'Balanced Beige', brand: 'Sherwin-Williams', sku: 'SW 7037', type: 'Mid', finish: 'Eggshell', lrv: '54', badge: 'standard', colors: ['#c8b898'], pat: 'solid' },
      { name: 'Naval', brand: 'Sherwin-Williams', sku: 'SW 6244', type: 'Dark', finish: 'Eggshell', lrv: '4', badge: 'premium', colors: ['#243048'], pat: 'solid' },
      { name: 'Cityscape', brand: 'Sherwin-Williams', sku: 'SW 7067', type: 'Dark', finish: 'Eggshell', lrv: '30', badge: 'premium', colors: ['#888478'], pat: 'solid' },
      { name: 'Comfort Gray', brand: 'Sherwin-Williams', sku: 'SW 6205', type: 'Mid', finish: 'Eggshell', lrv: '53', badge: 'standard', colors: ['#9cb0a8'], pat: 'solid' },
    ],
  },
  {
    id: 'fixtures', label: 'Fixtures', icon: '⬡',
    filters: ['All', 'Faucets', 'Lighting', 'Other'],
    items: [
      { name: 'Devonshire Faucet', brand: 'Kohler', sku: 'KOH-K-394-BN', type: 'Faucets', finish: 'Brushed Nickel', style: 'Traditional', badge: 'popular', colors: ['#d0ccc4','#b8b4a8','#a0a09a','#8a8880'], pat: 'metal' },
      { name: 'Forte Kitchen Faucet', brand: 'Kohler', sku: 'KOH-K-10430-BN', type: 'Faucets', finish: 'Brushed Nickel', style: 'Contemporary', badge: 'standard', colors: ['#c8c8c0','#b0b0a8','#989890','#808078'], pat: 'metal' },
      { name: 'Moen Genta Faucet', brand: 'Moen', sku: 'MOE-84753BN', type: 'Faucets', finish: 'Brushed Nickel', style: 'Modern', badge: 'standard', colors: ['#c8ccc8','#b0b4b0','#989c98','#808480'], pat: 'metal' },
      { name: 'P-Series Vanity Light', brand: 'Progress Lighting', sku: 'PRL-P2113-09', type: 'Lighting', finish: 'Brushed Nickel', bulbs: '2-Light', badge: 'popular', colors: ['#e0d8c8','#c8c0a8','#b0a888','#988c6c'], pat: 'metal' },
      { name: 'Halo 6" Recessed', brand: 'Halo', sku: 'HAL-H6T4', type: 'Lighting', finish: 'White', bulbs: 'LED 3000K', badge: 'standard', colors: ['#f0ece8','#e0dcd4','#d0ccc4','#beb8b0'], pat: 'flat' },
      { name: 'Delta Shower Trim', brand: 'Delta', sku: 'DEL-T14238-BN', type: 'Other', finish: 'Brushed Nickel', style: 'Traditional', badge: 'standard', colors: ['#ccccc4','#b4b4ac','#9c9c94','#84847c'], pat: 'metal' },
      { name: 'Caseta Fan/Light', brand: 'Lutron', sku: 'LUT-MRF2S-ON', type: 'Other', finish: 'White', cfm: '110 CFM', badge: 'popular', colors: ['#ece8e0','#dcd8d0','#ccc8c0','#bcb8b0'], pat: 'flat' },
    ],
  },
  {
    id: 'appliances', label: 'Appliances', icon: '▣',
    filters: ['All', 'Refrigerators', 'Ranges', 'Laundry', 'Other'],
    items: [
      { name: 'Profile French Door', brand: 'GE Profile', sku: 'GEP-PFE28KYNFS', type: 'Refrigerators', finish: 'Fingerprint Resistant S/S', capacity: '27.7 cu ft', badge: 'premium', colors: ['#c0c4c4','#a8acac','#909494','#787c7c'], pat: 'metal' },
      { name: 'GE Top-Freezer', brand: 'GE Appliances', sku: 'GEA-GTS18GSNRSS', type: 'Refrigerators', finish: 'Stainless Steel', capacity: '17.5 cu ft', badge: 'standard', colors: ['#c4c8c8','#acacb0','#949498','#7c7c80'], pat: 'metal' },
      { name: 'GE 30" Range', brand: 'GE Appliances', sku: 'GEA-JB645RKSS', type: 'Ranges', finish: 'Stainless Steel', burners: '5 Element', badge: 'popular', colors: ['#b8bcbc','#a0a4a4','#888c8c','#707474'], pat: 'metal' },
      { name: 'Over-Range Microwave', brand: 'GE Appliances', sku: 'GEA-JVM3160RFSS', type: 'Other', finish: 'Stainless Steel', watts: '1000W', badge: 'standard', colors: ['#bcc0c0','#a4a8a8','#8c9090','#747878'], pat: 'metal' },
      { name: 'GE Dishwasher', brand: 'GE Appliances', sku: 'GEA-GDT535PSRSS', type: 'Other', finish: 'Stainless Steel', dba: '52 dBA', badge: 'popular', colors: ['#c0c4c4','#a8acac','#909494','#787c7c'], pat: 'metal' },
      { name: 'Whirlpool Washer', brand: 'Whirlpool', sku: 'WHP-WTW4816FW', type: 'Laundry', finish: 'White', capacity: '3.5 cu ft', badge: 'standard', colors: ['#ece8e4','#dcd8d4','#ccc8c4','#bab4b0'], pat: 'flat' },
      { name: 'Whirlpool Dryer', brand: 'Whirlpool', sku: 'WHP-WED4815EW', type: 'Laundry', finish: 'White', capacity: '7.0 cu ft', badge: 'standard', colors: ['#ece8e4','#dcd8d4','#ccc8c4','#bab4b0'], pat: 'flat' },
    ],
  },
];

export const SPEC_LABELS = {
  finish: 'Finish', thickness: 'Thickness', hardware: 'Hardware',
  edge: 'Edge', lrv: 'LRV', bulbs: 'Bulbs', cfm: 'CFM',
  dba: 'Sound', capacity: 'Capacity', burners: 'Elements',
  watts: 'Wattage', style: 'Style',
};

export const BADGE_LABELS = {
  popular: 'Popular',
  premium: 'Premium',
  standard: 'Standard',
};
