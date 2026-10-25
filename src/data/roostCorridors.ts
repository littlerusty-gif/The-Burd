import { FlightCorridor, RegionConfig } from '../types/bird';
import { ROOST_FLIGHT_PATHS } from './roosts';

/**
 * Calculates distance in miles between two latitude/longitude points via Haversine formula
 */
export function calculateDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 4 CONTINENTAL FLYWAY TRUNKS (Rendered in Nationwide "US" View)
 */
export const CONTINENTAL_FLYWAY_TRUNKS: FlightCorridor[] = [
  {
    id: 'trunk-pacific-flyway',
    name: 'Pacific Flyway Continental Trunk',
    corridorName: 'Northwest Coastal & Valley Arterial',
    timeWindow: 'Peak Migration: Spring & Autumn Dawn/Dusk',
    heading: 'Heading South along Cascade / Coast Ranges',
    headingDeg: 180,
    estFlockSize: 12000000,
    species: 'Waterfowl, Cranes, Swifts & Shorebirds',
    flyway: 'Pacific',
    isContinentalTrunk: true,
    description: 'Primary Pacific arterial running from Yukon & Alaska through Puget Sound, the Columbia River Basin, Klamath Basin, and California Central Valley.',
    color: '#38bdf8',
    stagingCoords: [49.00, -122.50],
    roostCoords: [33.15, -115.55],
    coordinates: [
      [49.00, -122.50], // Canadian Border / Fraser Delta
      [47.60, -122.33], // Puget Sound Staging
      [45.52, -122.68], // Columbia / Willamette Convergence
      [42.00, -121.75], // Klamath Basin Gateway
      [38.58, -121.49], // Central Valley Core
      [33.15, -115.55], // Salton Sea / Pacific Delta Terminal
    ],
  },
  {
    id: 'trunk-central-flyway',
    name: 'Central Flyway Continental Trunk',
    corridorName: 'Great Plains Migration Corridor',
    timeWindow: 'Spring (Mar-Apr) & Fall (Sep-Nov)',
    heading: 'Heading South across the High Plains',
    headingDeg: 175,
    estFlockSize: 15000000,
    species: 'Sandhill Cranes, Geese, Sparrows & Shorebirds',
    flyway: 'Central',
    isContinentalTrunk: true,
    description: 'Continental highway across the Great Plains: linking Arctic tundra and Prairie Potholes with the Platte River, Cheyenne Bottoms, and Texas Coastal Marshes.',
    color: '#f59e0b',
    stagingCoords: [49.00, -104.05],
    roostCoords: [28.25, -97.05],
    coordinates: [
      [49.00, -104.05], // Northern Plains Gateway
      [44.38, -100.35], // Missouri River Reservoir Stopover
      [40.67, -98.98],  // Platte River Staging Hub (NE)
      [38.45, -98.68],  // Cheyenne Bottoms / Quivira (KS)
      [33.50, -97.50],  // North Texas Crossing
      [28.25, -97.05],  // Aransas & Coastal Bend Terminal
    ],
  },
  {
    id: 'trunk-mississippi-flyway',
    name: 'Mississippi Flyway Continental Trunk',
    corridorName: 'Great River Navigational Spine',
    timeWindow: 'Autumn & Spring Migrations',
    heading: 'Heading South along Mississippi River Valley',
    headingDeg: 170,
    estFlockSize: 18000000,
    species: 'Ducks, Tundra Swans, Crows & Songbirds',
    flyway: 'Mississippi',
    isContinentalTrunk: true,
    description: 'Unbroken biological highway following the Mississippi River drainage system from Minnesota boreal headwaters down to the Gulf of Mexico delta marshes.',
    color: '#10b981',
    stagingCoords: [48.00, -94.50],
    roostCoords: [29.50, -89.50],
    coordinates: [
      [48.00, -94.50],  // Upper Minnesota Headwaters
      [44.98, -93.26],  // Twin Cities River Gorge
      [43.68, -91.27],  // Upper Mississippi River Pools 8 & 9
      [38.62, -90.19],  // St. Louis River Confluence
      [35.15, -90.05],  // Lower Mississippi Delta
      [29.50, -89.50],  // Gulf Coast Coastal Marshes
    ],
  },
  {
    id: 'trunk-atlantic-flyway',
    name: 'Atlantic Flyway Continental Trunk',
    corridorName: 'Appalachian Ridge & Eastern Seaboard',
    timeWindow: 'Spring (Apr-May) & Fall (Aug-Nov)',
    heading: 'Heading Southwest along Atlantic Coastal Plain',
    headingDeg: 210,
    estFlockSize: 14000000,
    species: 'Raptors, Martins, Swallows, Shorebirds & Waterfowl',
    flyway: 'Atlantic',
    isContinentalTrunk: true,
    description: 'Dual-vector Atlantic flight system: coastal shorebirds/waterfowl along barrier islands combined with raptors soaring thermals down Appalachian ridgelines.',
    color: '#d946ef',
    stagingCoords: [44.80, -68.80],
    roostCoords: [26.00, -80.50],
    coordinates: [
      [44.80, -68.80],  // Maine Coastal Staging
      [42.36, -71.06],  // Massachusetts Bay Transit
      [40.63, -75.99],  // Hawk Mountain Appalachian Ridge
      [38.93, -74.96],  // Cape May Migration Funnel
      [38.43, -76.11],  // Chesapeake Bay / Blackwater NWR
      [34.05, -81.32],  // Carolina Midlands Hub
      [26.00, -80.50],  // Florida Everglades Terminal
    ],
  },
];

/**
 * 12 ADDITIONAL REGIONAL MIGRATION FLYWAYS & STAGING GROUNDS
 */
export const ADDITIONAL_REGIONAL_CORRIDORS: FlightCorridor[] = [
  {
    id: 'corridor-sacramento-nwr',
    name: 'Sacramento NWR Waterfowl Super-Gathering',
    corridorName: 'Upper Valley Wetland Highway',
    timeWindow: 'Late Afternoon Flight',
    heading: 'Heading South into Marsh Basin',
    headingDeg: 175,
    estFlockSize: 80000,
    species: 'Snow Goose, White-fronted Goose & Pintail',
    state: 'CA',
    flyway: 'Pacific',
    description: 'Massive winter flocks of Snow Geese, Ross Geese, and Northern Pintails blanketing the rice fields and open wetlands of the Sacramento Valley complex.',
    color: '#14b8a6',
    stagingCoords: [39.5850, -122.1850],
    roostCoords: [39.2250, -122.1150],
    coordinates: [
      [39.5850, -122.1850], // Delevan NWR
      [39.4650, -122.1950], // Sacramento NWR Core Pool
      [39.3850, -122.1750], // Colusa NWR Flooded Marsh
      [39.2250, -122.1150], // Sutter Basin
    ],
  },
  {
    id: 'corridor-klamath-basin',
    name: 'Klamath Basin Waterfowl Gateway',
    corridorName: 'Tule Lake & Lower Klamath Highway',
    timeWindow: 'Autumn Peak (Oct-Nov) & Spring (Mar)',
    heading: 'Heading South across Border Marshlands',
    headingDeg: 185,
    estFlockSize: 1000000,
    species: 'Pintails, Mallards, Snow Geese & Bald Eagles',
    state: 'CA',
    flyway: 'Pacific',
    description: 'The premier Pacific Flyway crossroads: during peak migration, up to one million waterfowl congregate in the shallow volcanic marsh basins of Tule Lake and Lower Klamath NWR.',
    color: '#22c55e',
    stagingCoords: [42.0500, -121.8000],
    roostCoords: [41.8700, -121.5000],
    coordinates: [
      [42.0500, -121.8000], // Midland Klamath River Staging (OR)
      [41.9800, -121.6500], // Lower Klamath Refuge Core Basin (OR/CA)
      [41.9200, -121.5800], // Sheepy Ridge Overlook
      [41.8700, -121.5000], // Tule Lake National Wildlife Refuge
    ],
  },
  {
    id: 'corridor-cheyenne-bottoms',
    name: 'Cheyenne Bottoms & Quivira Flyway',
    corridorName: 'Great Plains Wetland Crossroads',
    timeWindow: 'All Day (Peak Dusk)',
    heading: 'Heading South through Central Kansas',
    headingDeg: 195,
    estFlockSize: 120000,
    species: 'Snow Goose, Sandhill Crane & Shorebirds',
    state: 'KS',
    flyway: 'Central',
    description: 'Crucial Central Flyway stopover: hundreds of thousands of shorebirds, cranes, and geese navigating between Cheyenne Bottoms basin and Quivira salt marshes.',
    color: '#eab308',
    stagingCoords: [38.5200, -98.7150],
    roostCoords: [38.1250, -98.4950],
    coordinates: [
      [38.5200, -98.7150], // Cheyenne Bottoms Pool 1
      [38.4500, -98.6850], // Cheyenne Bottoms Central Dike
      [38.2500, -98.5450], // Arkansas River Valley
      [38.1250, -98.4950], // Quivira NWR Big Salt Marsh
    ],
  },
  {
    id: 'corridor-texas-gulf-transgulf',
    name: 'Texas Gulf Trans-Gulf Fallouts',
    corridorName: 'High Island & Sabine Woods Arrival Vector',
    timeWindow: 'Spring (Mar-May) Midday / Afternoon Arrivals',
    heading: 'Heading North from Gulf of Mexico',
    headingDeg: 10,
    estFlockSize: 250000,
    species: 'Warblers, Tanagers, Orioles & Buntings',
    state: 'TX',
    flyway: 'Central',
    description: 'Spectacular trans-Gulf migration: exhausted songbirds making landfall in the coastal oak motts of High Island and Sabine Woods after an 18-hour non-stop flight across the Gulf.',
    color: '#06b6d4',
    stagingCoords: [29.3500, -94.2000],
    roostCoords: [29.7400, -93.9000],
    coordinates: [
      [29.3500, -94.2000], // Open Gulf of Mexico flight line
      [29.5600, -94.3800], // Bolivar Peninsula Shoreline
      [29.5700, -94.4000], // High Island Boy Scout Woods
      [29.7400, -93.9000], // Sabine Woods Oak Mott
    ],
  },
  {
    id: 'corridor-upper-mississippi-swans',
    name: 'Upper Mississippi Tundra Swan Corridor',
    corridorName: 'Pools 8 & 9 Waterfowl Highway',
    timeWindow: 'Midday to Dusk (Late Autumn Nov)',
    heading: 'Heading South along Navigation Pools',
    headingDeg: 175,
    estFlockSize: 55000,
    species: 'Tundra Swan & Canvasback',
    state: 'WI',
    flyway: 'Mississippi',
    description: 'Late autumn spectacle: over 50,000 Tundra Swans and 70% of North America’s Canvasbacks feed on wild celery roots in Upper Mississippi Pools 8 & 9.',
    color: '#38bdf8',
    stagingCoords: [43.8200, -91.2500],
    roostCoords: [43.5200, -91.2950],
    coordinates: [
      [43.8200, -91.2500], // La Crosse Pool 8 Staging
      [43.6800, -91.2700], // Stoddard Islands
      [43.5800, -91.2900], // Genoa Lock & Dam
      [43.5200, -91.2950], // Brownsville Overlook Pool 9 (MN/WI)
    ],
  },
  {
    id: 'corridor-terre-haute-crows',
    name: 'Terre Haute Crow Mega-Roost',
    corridorName: 'Wabash River Winter Roost',
    timeWindow: 'Dusk (4:45 PM - 6:00 PM)',
    heading: 'Heading South along Wabash Basin',
    headingDeg: 180,
    estFlockSize: 35000,
    species: 'American Crow',
    state: 'IN',
    flyway: 'Mississippi',
    description: 'Classic Midwestern winter roost: thousands of crows congregate in agricultural fields of Vigo County before streaming into sycamore canopies along the Wabash River.',
    color: '#6366f1',
    stagingCoords: [39.5200, -87.4000],
    roostCoords: [39.4300, -87.4200],
    coordinates: [
      [39.5200, -87.4000], // North Terre Haute cornfields
      [39.4900, -87.4100], // Fairbanks Park staging
      [39.4650, -87.4120], // Wabash River Island Canopy
      [39.4300, -87.4200], // South River Bend
    ],
  },
  {
    id: 'corridor-rockford-crows',
    name: 'Rockford Rock River Crow Roost',
    corridorName: 'Rock River Riparian Corridor',
    timeWindow: 'Dusk (4:30 PM - 5:30 PM)',
    heading: 'Heading South along Rock River',
    headingDeg: 190,
    estFlockSize: 40000,
    species: 'American Crow',
    state: 'IL',
    flyway: 'Mississippi',
    description: 'Major Illinois winter gathering: up to 40,000 crows converge from farm fields across Winnebago County into downtown riverfront trees.',
    color: '#818cf8',
    stagingCoords: [42.3200, -89.0700],
    roostCoords: [42.2450, -89.1050],
    coordinates: [
      [42.3200, -89.0700], // Machesney Park farmlands
      [42.2900, -89.0900], // North Rock River
      [42.2680, -89.0950], // Downtown Rockford Riverfront
      [42.2450, -89.1050], // South Rock River Woods
    ],
  },
  {
    id: 'corridor-louisiana-chenier',
    name: 'Louisiana Chenier Plain Waterfowl Roost',
    corridorName: 'Lacassine & Cameron Prairie Marshes',
    timeWindow: 'Dusk & Dawn (Winter Nov-Feb)',
    heading: 'Heading South into Freshwater Impoundments',
    headingDeg: 175,
    estFlockSize: 450000,
    species: 'Pintail, Teal, Snow Goose & White-fronted Goose',
    state: 'LA',
    flyway: 'Mississippi',
    description: 'The terminus of the Mississippi Flyway: over 400,000 ducks and geese roost in the expansive freshwater impoundments of Lacassine Pool and Cameron Prairie.',
    color: '#10b981',
    stagingCoords: [30.1500, -93.0500],
    roostCoords: [29.8500, -93.0000],
    coordinates: [
      [30.1500, -93.0500], // Welsh & Jennings Rice Prairies
      [30.0800, -93.1000], // Lacassine NWR North Boundary
      [29.9800, -93.0500], // Lacassine Pool Impoundment
      [29.8500, -93.0000], // Cameron Prairie Wetland Complex
    ],
  },
  {
    id: 'corridor-lake-murray-martins',
    name: 'Lake Murray Bomb Island Purple Martins',
    corridorName: 'Lake Murray Sanctuary Roost',
    timeWindow: 'Dusk (7:45 PM - 8:45 PM Summer)',
    heading: 'Converging from all directions into Island',
    headingDeg: 270,
    estFlockSize: 750000,
    species: 'Purple Martin',
    state: 'SC',
    flyway: 'Atlantic',
    description: 'First official Purple Martin sanctuary in North America: up to three-quarters of a million birds arrive in massive swirling cloud formations at Bomb Island.',
    color: '#d946ef',
    stagingCoords: [34.1200, -81.2500],
    roostCoords: [34.0250, -81.3500],
    coordinates: [
      [34.1200, -81.2500], // Dreher Island Staging
      [34.0850, -81.2950], // North Shore Approach
      [34.0550, -81.3250], // Bomb Island Center Sanctuary
      [34.0250, -81.3500], // South Shore Approach
    ],
  },
  {
    id: 'corridor-hawk-mountain',
    name: 'Hawk Mountain Appalachian Ridge',
    corridorName: 'Kittatinny Ridge Raptor Highway',
    timeWindow: 'Daytime Thermals (10:00 AM - 4:00 PM Autumn)',
    heading: 'Heading Southwest along Mountain Ridge',
    headingDeg: 220,
    estFlockSize: 30000,
    species: 'Broad-winged Hawk, Golden Eagle & Peregrine',
    state: 'PA',
    flyway: 'Atlantic',
    description: 'Legendary raptor migration lookout: thousands of hawks and eagles riding thermal updrafts southwest along the Kittatinny Ridge of the Appalachian Mountains.',
    color: '#e11d48',
    stagingCoords: [40.7500, -75.8500],
    roostCoords: [40.4800, -76.1500],
    coordinates: [
      [40.7500, -75.8500], // Bake Oven Knob
      [40.6800, -75.9200], // Pinnacle Overlook
      [40.6350, -75.9900], // Hawk Mountain North Lookout
      [40.4800, -76.1500], // Blue Mountain Gap
    ],
  },
  {
    id: 'corridor-cape-may-funnel',
    name: 'Cape May Migration Funnel',
    corridorName: 'Cape May Point Coastal Convergence',
    timeWindow: 'Dawn to Midday (Autumn Peak Sep-Nov)',
    heading: 'Funneling South toward Delaware Bay Crossing',
    headingDeg: 200,
    estFlockSize: 150000,
    species: 'Warblers, Merlins, Ospreys & Woodcocks',
    state: 'NJ',
    flyway: 'Atlantic',
    description: 'North America’s most celebrated birding migration funnel: birds navigating down the Atlantic coast are pinched into the Cape May peninsula before embarking across the 12-mile open waters of Delaware Bay.',
    color: '#f97316',
    stagingCoords: [39.1200, -74.8500],
    roostCoords: [38.9320, -74.9600],
    coordinates: [
      [39.1200, -74.8500], // Stone Harbor / Avalon marshes
      [39.0400, -74.8800], // Wildwood Crest coastal barrier
      [39.0000, -74.9000], // Cape May Harbor
      [38.9320, -74.9600], // Cape May Point State Park & Hawk Watch
    ],
  },
  {
    id: 'corridor-blackwater-delaware',
    name: 'Chesapeake Bay & Blackwater NWR Flyway',
    corridorName: 'Mid-Atlantic Waterfowl Highway',
    timeWindow: 'Dawn & Late Afternoon',
    heading: 'Heading Southwest into Coastal Marshes',
    headingDeg: 220,
    estFlockSize: 65000,
    species: 'Tundra Swan, Snow Goose & Bald Eagle',
    state: 'MD',
    flyway: 'Atlantic',
    description: 'High-density winter staging: thousands of Tundra Swans, Canada Geese, and one of the highest concentrations of nesting Bald Eagles on the Atlantic Coast.',
    color: '#059669',
    stagingCoords: [39.2650, -75.4550],
    roostCoords: [38.2250, -76.2850],
    coordinates: [
      [39.2650, -75.4550], // Bombay Hook NWR (Delaware Bay)
      [38.8550, -75.8250], // Choptank River Estuary
      [38.4350, -76.1150], // Blackwater NWR Tidal Marshes
      [38.2250, -76.2850], // Lower Chesapeake Wetlands
    ],
  },
];

/**
 * Complete nationwide catalog:
 * 4 Continental Flyway Trunks + 15 Premier Roost Flight Paths + 12 Regional Flyways = 31 Corridors
 */
export const NATIONWIDE_CORRIDORS: FlightCorridor[] = [
  ...CONTINENTAL_FLYWAY_TRUNKS,
  ...ROOST_FLIGHT_PATHS,
  ...ADDITIONAL_REGIONAL_CORRIDORS,
];

/**
 * Filter corridors dynamically matching a region:
 * - If Nationwide view: All 31 active corridors across all 15 Roosts and continental trunks
 * - If GPS: within 250 miles of user coordinates
 * - If State: matching corridor.state or within 250 miles of state center
 */
export function getCorridorsForRegion(region: RegionConfig, maxRadiusMiles: number = 250): FlightCorridor[] {
  if (!region) return NATIONWIDE_CORRIDORS;

  // 1. Nationwide View: Continental Flyway Trunks + All Active Corridors across all 15 Roosts
  if (region.category === 'nationwide' || region.regionCode === 'US' || region.id === 'nationwide') {
    return NATIONWIDE_CORRIDORS;
  }

  // 2. GPS Radius Filtering: within 250 miles of user coordinates
  if (region.category === 'gps' && region.lat && region.lng) {
    const userLat = region.lat;
    const userLng = region.lng;

    const nearby = NATIONWIDE_CORRIDORS.filter((c) => {
      if (c.isContinentalTrunk) return false;
      return c.coordinates.some(([lat, lng]) => calculateDistanceMiles(userLat, userLng, lat, lng) <= maxRadiusMiles);
    });

    if (nearby.length > 0) return nearby;

    // Fall back to closest 5 non-trunk corridors
    return [...NATIONWIDE_CORRIDORS.filter((c) => !c.isContinentalTrunk)]
      .sort((a, b) => {
        const distA = Math.min(...a.coordinates.map(([lat, lng]) => calculateDistanceMiles(userLat, userLng, lat, lng)));
        const distB = Math.min(...b.coordinates.map(([lat, lng]) => calculateDistanceMiles(userLat, userLng, lat, lng)));
        return distA - distB;
      })
      .slice(0, 5);
  }

  // 3. State Matching or 250-mile radius of state center
  if (region.category === 'state' || (region.regionCode && region.regionCode.startsWith('US-'))) {
    const stateCode = region.regionCode?.replace('US-', '').toUpperCase();
    const stateMatches = NATIONWIDE_CORRIDORS.filter(
      (c) => !c.isContinentalTrunk && c.state?.toUpperCase() === stateCode
    );

    const combinedMap = new Map<string, FlightCorridor>();
    stateMatches.forEach((c) => combinedMap.set(c.id, c));

    // Also include any corridors whose waypoints fall within 250 miles of state center
    if (region.center && Array.isArray(region.center) && region.center.length === 2) {
      const [cLat = 39.8283, cLng = -98.5795] = region.center || [];
      const nearby = NATIONWIDE_CORRIDORS.filter((c) => {
        if (c.isContinentalTrunk) return false;
        return c.coordinates.some(([lat, lng]) => calculateDistanceMiles(cLat, cLng, lat, lng) <= maxRadiusMiles);
      });
      nearby.forEach((c) => combinedMap.set(c.id, c));
    }

    if (combinedMap.size > 0) {
      return Array.from(combinedMap.values());
    }
  }

  // 4. Portland Metro Roost Focus
  if (region.id === 'portland' || region.regionCode === 'US-OR-051') {
    return NATIONWIDE_CORRIDORS.filter((c) => !c.isContinentalTrunk && (c.state === 'OR' || c.state === 'WA'));
  }

  return NATIONWIDE_CORRIDORS.filter((c) => !c.isContinentalTrunk);
}
