import { RoostSite, FlightCorridor, Observation } from '../types/bird';

/**
 * 15 Premier Communal Roost Sites in The Burd
 * Each roost site represents a documented, high-density communal roosting aggregation.
 */
export const ROOST_SITES: RoostSite[] = [
  // 1. Portland Downtown Crow Mega-Roost (OR)
  {
    id: 'roost-portland-downtown',
    roostId: 'roost-portland-downtown',
    name: 'Portland Downtown South Park Blocks Crow Mega-Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 45.5140,
    lng: -122.6825,
    count: 18500,
    locName: 'South Park Blocks & Waterfront Park, Portland, OR',
    stagingAreaName: 'Lloyd Center & Central Eastside Rooftops',
    stagingCoords: [45.5322, -122.6534],
    peakTime: 'Dusk (4:45 PM - 6:15 PM)',
    season: 'Autumn - Winter (Oct - Mar)',
    description: 'Tens of thousands of crows converge from Lloyd Center rooftops across the Hawthorne & Morrison bridges into the Dutch elm canopy.',
    state: 'OR',
    flyway: 'Pacific',
    corridorId: 'corridor-portland-downtown',
  },

  // 2. Chapman Elementary Swift Chimney (OR)
  {
    id: 'roost-chapman-swifts',
    roostId: 'roost-chapman-swifts',
    name: "Chapman Elementary Vaux's Swift Chimney Vortex",
    species: "Vaux's Swift",
    speciesCode: 'vauxsw',
    lat: 45.5338,
    lng: -122.7092,
    count: 16500,
    locName: 'Chapman Elementary School, NW Portland, OR',
    stagingAreaName: 'Forest Park Skyline Ridgeline & Macleay Park',
    stagingCoords: [45.5420, -122.7240],
    peakTime: 'Sunset (6:00 PM - 7:15 PM)',
    season: 'Fall Migration (Late Aug - Late Sep)',
    description: "Famous Vaux's Swift migration staging: thousands of swifts swirl in a hypnotic vortex over northwest Portland before spiraling down into the historic school brick chimney.",
    state: 'OR',
    flyway: 'Pacific',
    corridorId: 'corridor-chapman-swifts',
  },

  // 3. Sauvie Island Sturgeon Lake Crane & Waterfowl Roost (OR)
  {
    id: 'roost-sauvie-waterfowl',
    roostId: 'roost-sauvie-waterfowl',
    name: 'Sauvie Island Sturgeon Lake Waterfowl Roost',
    species: 'Sandhill Crane & Cackling Goose',
    speciesCode: 'sancra',
    lat: 45.5920,
    lng: -122.7350,
    count: 14000,
    locName: 'Multnomah Channel & Columbia Slough, Sauvie Island, OR',
    stagingAreaName: 'Sturgeon Lake Wildlife Sanctuary Basin',
    stagingCoords: [45.6980, -122.8150],
    peakTime: 'Dawn & Dusk (7:00 AM / 5:30 PM)',
    season: 'Wintering (Oct - Feb)',
    description: 'Pacific Flyway staging: Sandhill Cranes, Cackling Geese, and Tundra Swans navigating from Sturgeon Lake southeast along Multnomah Channel.',
    state: 'OR',
    flyway: 'Pacific',
    corridorId: 'corridor-sauvie-waterfowl',
  },

  // 4. Oaks Bottom & Ross Island Wetland Heronry (OR)
  {
    id: 'roost-oaks-bottom',
    roostId: 'roost-oaks-bottom',
    name: 'Ross Island & Oaks Bottom Wetland Heronry',
    species: 'Great Blue Heron & Double-crested Cormorant',
    speciesCode: 'grbher3',
    lat: 45.5020,
    lng: -122.6690,
    count: 9500,
    locName: 'Ross Island River Sanctuary, Willamette River, OR',
    stagingAreaName: 'Sellwood Riverfront & Oaks Bottom Lagoon',
    stagingCoords: [45.4720, -122.6550],
    peakTime: 'Evening (5:00 PM - 6:30 PM)',
    season: 'Year-Round (Peak Wintering)',
    description: 'Vital urban wetland flyway linking Oaks Bottom wildlife refuge and Ross Island heronries along the Willamette River corridor.',
    state: 'OR',
    flyway: 'Pacific',
    corridorId: 'corridor-oaks-bottom',
  },

  // 5. UW Bothell Campus Wetlands Crow Mega-Roost (WA)
  {
    id: 'roost-uw-bothell',
    roostId: 'roost-uw-bothell',
    name: 'UW Bothell Campus Wetlands Crow Mega-Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 47.7590,
    lng: -122.1910,
    count: 16000,
    locName: 'North Creek Restored Wetlands, UW Bothell, WA',
    stagingAreaName: 'Marymoor Park & Sammamish River Valley',
    stagingCoords: [47.6740, -122.1240],
    peakTime: 'Dusk (4:30 PM - 5:45 PM)',
    season: 'Autumn - Winter (Oct - Mar)',
    description: 'Massive Pacific Northwest crow roost: flocks stream northwest from Marymoor Park, Kirkland, and Redmond into the protected North Creek wetland canopy.',
    state: 'WA',
    flyway: 'Pacific',
    corridorId: 'corridor-uw-bothell',
  },

  // 6. Skagit Bay & Fir Island Snow Goose Marine Roost (WA)
  {
    id: 'roost-skagit-snowgeese',
    roostId: 'roost-skagit-snowgeese',
    name: 'Skagit Bay & Fir Island Snow Goose Marine Roost',
    species: 'Snow Goose & Trumpeter Swan',
    speciesCode: 'snogoo',
    lat: 48.3450,
    lng: -122.3850,
    count: 55000,
    locName: 'Skagit Bay Estuary & Fir Island Marshes, WA',
    stagingAreaName: 'Burlington & Mount Vernon Farmland Grainfields',
    stagingCoords: [48.4550, -122.3350],
    peakTime: 'Late Afternoon (3:45 PM - 5:15 PM)',
    season: 'Winter Migration (Nov - Mar)',
    description: 'Spectacular white blizzard of Snow Geese foraging across Skagit agricultural flats before retreating south into coastal tidal flats of Skagit Bay.',
    state: 'WA',
    flyway: 'Pacific',
    corridorId: 'corridor-skagit-snowgeese',
  },

  // 7. Discovery Park & Puget Sound Marine Roost (WA)
  {
    id: 'roost-discovery-park',
    roostId: 'roost-discovery-park',
    name: 'Discovery Park & West Point Marine Bird Roost',
    species: 'Glaucous-winged Gull & Western Grebe',
    speciesCode: 'gwgull',
    lat: 47.6620,
    lng: -122.4280,
    count: 12500,
    locName: 'West Point Lighthouse Shoals, Discovery Park, Seattle, WA',
    stagingAreaName: 'Shilshole Bay Breakwater & Salmon Bay',
    stagingCoords: [47.6850, -122.4050],
    peakTime: 'Twilight (5:00 PM - 6:15 PM)',
    season: 'Year-Round Coastal Roost',
    description: 'Marine tidal roost where gulls, grebes, and cormorants depart Puget Sound feeding banks to roost along the rocky shallows of West Point Lighthouse.',
    state: 'WA',
    flyway: 'Pacific',
    corridorId: 'corridor-discovery-park',
  },

  // 8. Staten Island & Cosumnes River Sandhill Crane Roost (CA)
  {
    id: 'roost-central-valley-cranes',
    roostId: 'roost-central-valley-cranes',
    name: 'Staten Island & Cosumnes River Crane Roost',
    species: 'Sandhill Crane',
    speciesCode: 'sancra',
    lat: 38.1950,
    lng: -121.5150,
    count: 28000,
    locName: 'Staten Island Flooded Roost Ponds, Central Valley, CA',
    stagingAreaName: 'Stone Lakes NWR & Sacramento Delta Grainfields',
    stagingCoords: [38.3850, -121.3950],
    peakTime: 'Sunset (5:15 PM - 6:30 PM)',
    season: 'Wintering (Oct - Mar)',
    description: 'Iconic California winter roost: thousands of cranes bugling as they descend into the shallow flooded grain fields of Staten Island and Cosumnes River Preserve.',
    state: 'CA',
    flyway: 'Pacific',
    corridorId: 'corridor-central-valley-cranes',
  },

  // 9. Platte River Crane Sanctuary Braided Sandbars Roost (NE)
  {
    id: 'roost-platte-river',
    roostId: 'roost-platte-river',
    name: 'Platte River Braided Sandbars Crane Mega-Roost',
    species: 'Sandhill Crane',
    speciesCode: 'sancra',
    lat: 40.6994,
    lng: -99.0817,
    count: 120000,
    locName: 'Rowe Sanctuary Braided Sandbars, Kearney, NE',
    stagingAreaName: 'Kearney High Plains Cornfield Staging Belt',
    stagingCoords: [40.7650, -99.0450],
    peakTime: 'Sunset (6:15 PM - 7:30 PM Spring)',
    season: 'Spring Migration (Late Feb - Mid Apr)',
    description: 'The largest crane concentration on Earth: over 500,000 Sandhill Cranes roosting on shallow braided sandbars of the central Platte River.',
    state: 'NE',
    flyway: 'Central',
    corridorId: 'corridor-platte-river',
  },

  // 10. Capital Plaza Highland Mall Purple Martin Mega-Roost (TX)
  {
    id: 'roost-austin-martins',
    roostId: 'roost-austin-martins',
    name: 'Capital Plaza Highland Mall Purple Martin Mega-Roost',
    species: 'Purple Martin',
    speciesCode: 'purmar',
    lat: 30.3250,
    lng: -97.7150,
    count: 100000,
    locName: 'Capital Plaza & Highland Live Oak Canopy, Austin, TX',
    stagingAreaName: 'North Austin Greenbelt & Lady Bird Lake Feeding Zone',
    stagingCoords: [30.4150, -97.6850],
    peakTime: 'Sunset (8:15 PM - 9:00 PM Summer)',
    season: 'Summer Premigratory (Jul - Aug)',
    description: 'Massive summer roost: over 100,000 Purple Martins swirl like a dark tornado over urban parking lots in central Austin before settling into trees for the night.',
    state: 'TX',
    flyway: 'Central',
    corridorId: 'corridor-austin-martins',
  },

  // 11. Lake of the Isles & Mississippi River Crow Roost (MN)
  {
    id: 'roost-minneapolis-crows',
    roostId: 'roost-minneapolis-crows',
    name: 'Lake of the Isles & Mississippi River Crow Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 44.9750,
    lng: -93.2350,
    count: 32000,
    locName: 'University of Minnesota River Bluffs, Minneapolis, MN',
    stagingAreaName: 'Lake of the Isles, Loring Park & Chain of Lakes',
    stagingCoords: [44.9550, -93.3050],
    peakTime: 'Dusk (4:15 PM - 5:30 PM)',
    season: 'Wintering (Nov - Mar)',
    description: 'Twin Cities winter spectacle: crows gather near Lake of the Isles and Loring Park before flying into dense roosting stands along the Mississippi River gorge.',
    state: 'MN',
    flyway: 'Mississippi',
    corridorId: 'corridor-minneapolis-crows',
  },

  // 12. Hiwassee Island River Confluence Crane Roost (TN)
  {
    id: 'roost-hiwassee-cranes',
    roostId: 'roost-hiwassee-cranes',
    name: 'Hiwassee Island River Confluence Crane Roost',
    species: 'Sandhill Crane',
    speciesCode: 'sancra',
    lat: 35.4150,
    lng: -84.9950,
    count: 24000,
    locName: 'Hiwassee Wildlife Refuge & Island River Confluence, Birchwood, TN',
    stagingAreaName: 'Cherokee County Agricultural Feeding Plains',
    stagingCoords: [35.5250, -84.9150],
    peakTime: 'Sunset (5:00 PM - 6:15 PM)',
    season: 'Winter Migration (Dec - Feb)',
    description: 'Premier Southeast crane wintering refuge: over 20,000 Sandhill Cranes roost in the shallow waters where the Hiwassee and Tennessee rivers meet.',
    state: 'TN',
    flyway: 'Mississippi',
    corridorId: 'corridor-hiwassee-cranes',
  },

  // 13. Merrimack River Lawrence Hospital Grove Crow Roost (MA)
  {
    id: 'roost-lawrence-crows',
    roostId: 'roost-lawrence-crows',
    name: 'Merrimack River Lawrence Hospital Grove Crow Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 42.7050,
    lng: -71.1650,
    count: 25000,
    locName: 'Lawrence General Hospital Pine Groves, Lawrence, MA',
    stagingAreaName: 'Andover Shawsheen River Meadows & Cemeteries',
    stagingCoords: [42.6550, -71.1450],
    peakTime: 'Dusk (4:00 PM - 5:15 PM)',
    season: 'Wintering (Nov - Mar)',
    description: 'Historic New England winter roost: 25,000+ crows congregate along the Merrimack River mills and hospital groves in Lawrence and Andover.',
    state: 'MA',
    flyway: 'Atlantic',
    corridorId: 'corridor-lawrence-crows',
  },

  // 14. Conestoga River Lancaster Amish Country Crow Roost (PA)
  {
    id: 'roost-lancaster-crows',
    roostId: 'roost-lancaster-crows',
    name: 'Conestoga River Lancaster Amish Country Crow Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 40.0380,
    lng: -76.3050,
    count: 35000,
    locName: 'Lancaster Conestoga River Parklands, Lancaster, PA',
    stagingAreaName: 'Upper Leacock & Manheim Amish Farmland Basin',
    stagingCoords: [40.0850, -76.1950],
    peakTime: 'Sunset (4:30 PM - 5:45 PM)',
    season: 'Wintering (Nov - Mar)',
    description: 'Famous Pennsylvania mega-roost: crows foraging across rich Amish farmland stream by the tens of thousands into downtown Lancaster and Conestoga River trees.',
    state: 'PA',
    flyway: 'Atlantic',
    corridorId: 'corridor-lancaster-crows',
  },

  // 15. Auburn Owasco River Finger Lakes Crow Super-Roost (NY)
  {
    id: 'roost-auburn-crows',
    roostId: 'roost-auburn-crows',
    name: 'Auburn Owasco River Finger Lakes Crow Super-Roost',
    species: 'American Crow',
    speciesCode: 'amecro',
    lat: 42.9350,
    lng: -76.5650,
    count: 60000,
    locName: 'Owasco River Downtown Canal Corridor, Auburn, NY',
    stagingAreaName: 'Skaneateles & Cayuga Lake Farmland Ridges',
    stagingCoords: [42.9850, -76.4750],
    peakTime: 'Dusk (4:15 PM - 5:30 PM)',
    season: 'Wintering (Late Oct - Mar)',
    description: 'One of the largest crow roosts in North America: over 60,000 crows descend from across the Finger Lakes dairy farmlands into downtown Auburn and Owasco River parklands.',
    state: 'NY',
    flyway: 'Atlantic',
    corridorId: 'corridor-auburn-crows',
  },
];

/**
 * 15 Flight Corridor Vectors - Exactly one primary active corridor connecting
 * each of the 15 Roosts from its staging ground directly to the roost centroid.
 */
export const ROOST_FLIGHT_PATHS: FlightCorridor[] = [
  // 1. Portland Downtown
  {
    id: 'corridor-portland-downtown',
    roostId: 'roost-portland-downtown',
    name: 'Portland Downtown Crow Roost Corridor',
    corridorName: 'Eastside & Hawthorne River Vector',
    timeWindow: 'Dusk (4:45 PM - 6:15 PM)',
    heading: 'Heading West across Willamette River',
    headingDeg: 270,
    estFlockSize: 18500,
    species: 'American Crow',
    state: 'OR',
    flyway: 'Pacific',
    description: 'Flocks aggregate on Lloyd Center roofs and Sullivan Gulch before cutting southwest across the river into South Park Blocks canopy.',
    color: '#38bdf8',
    stagingCoords: [45.5322, -122.6534],
    roostCoords: [45.5140, -122.6825],
    coordinates: [
      [45.5322, -122.6534], // Staging: Lloyd Center
      [45.5225, -122.6610], // Central Eastside / Burnside
      [45.5132, -122.6685], // Hawthorne Bridge
      [45.5150, -122.6730], // Waterfront Park
      [45.5140, -122.6825], // Roost Centroid: South Park Blocks
    ],
  },

  // 2. Chapman Swifts
  {
    id: 'corridor-chapman-swifts',
    roostId: 'roost-chapman-swifts',
    name: "Chapman Elementary Vaux's Swift Vortex",
    corridorName: 'Forest Park to Chapman Chimney',
    timeWindow: 'Sunset (6:00 PM - 7:15 PM)',
    heading: 'Heading Southeast into School Chimney',
    headingDeg: 135,
    estFlockSize: 16500,
    species: "Vaux's Swift",
    state: 'OR',
    flyway: 'Pacific',
    description: "Swifts foraging over the Coast Range descend over Forest Park, forming an immense funnel before plunging into Chapman Elementary brick chimney.",
    color: '#f43f5e',
    stagingCoords: [45.5420, -122.7240],
    roostCoords: [45.5338, -122.7092],
    coordinates: [
      [45.5420, -122.7240], // Staging: Forest Park Skyline
      [45.5375, -122.7160], // Macleay Park
      [45.5342, -122.7100], // NW 25th & Pettygrove
      [45.5338, -122.7092], // Roost Centroid: Chapman School Chimney
    ],
  },

  // 3. Sauvie Island Waterfowl
  {
    id: 'corridor-sauvie-waterfowl',
    roostId: 'roost-sauvie-waterfowl',
    name: 'Sauvie Island Sturgeon Lake Flyway',
    corridorName: 'Multnomah Channel Influx',
    timeWindow: 'Dawn & Dusk (7:00 AM / 5:30 PM)',
    heading: 'Heading Southeast along Multnomah Channel',
    headingDeg: 140,
    estFlockSize: 14000,
    species: 'Sandhill Crane & Cackling Goose',
    state: 'OR',
    flyway: 'Pacific',
    description: 'Flocks departing Sturgeon Lake wildlife refuge transit southeast along Multnomah Channel into Columbia Slough roost grounds.',
    color: '#06b6d4',
    stagingCoords: [45.6980, -122.8150],
    roostCoords: [45.5920, -122.7350],
    coordinates: [
      [45.6980, -122.8150], // Staging: Sturgeon Lake
      [45.6520, -122.8020], // Central Sauvie Island
      [45.6180, -122.7750], // Sauvie Island Bridge
      [45.5920, -122.7350], // Roost Centroid: Multnomah Channel
    ],
  },

  // 4. Oaks Bottom & Ross Island
  {
    id: 'corridor-oaks-bottom',
    roostId: 'roost-oaks-bottom',
    name: 'Oaks Bottom & Ross Island Heronry Flyway',
    corridorName: 'Willamette Riparian Corridor',
    timeWindow: 'Evening (5:00 PM - 6:30 PM)',
    heading: 'Heading North along Willamette River',
    headingDeg: 350,
    estFlockSize: 9500,
    species: 'Great Blue Heron & Bald Eagle',
    state: 'OR',
    flyway: 'Pacific',
    description: 'Herons and waterbirds departing Sellwood and Oaks Bottom Wildlife Refuge following river thermals into the Ross Island sanctuary.',
    color: '#10b981',
    stagingCoords: [45.4720, -122.6550],
    roostCoords: [45.5020, -122.6690],
    coordinates: [
      [45.4720, -122.6550], // Staging: Sellwood Riverfront Park
      [45.4850, -122.6620], // Oaks Bottom Wetland Basin
      [45.4950, -122.6660], // Holgate Slough
      [45.5020, -122.6690], // Roost Centroid: Ross Island
    ],
  },

  // 5. UW Bothell Campus Wetlands
  {
    id: 'corridor-uw-bothell',
    roostId: 'roost-uw-bothell',
    name: 'UW Bothell Crow Roost Vector',
    corridorName: 'Sammamish River to North Creek',
    timeWindow: 'Dusk (4:30 PM - 5:45 PM)',
    heading: 'Heading Northwest into Wetlands',
    headingDeg: 315,
    estFlockSize: 16000,
    species: 'American Crow',
    state: 'WA',
    flyway: 'Pacific',
    description: 'Crows foraging across the Eastside congregate at Marymoor Park before flying northwest along the Sammamish River into UW Bothell wetlands.',
    color: '#8b5cf6',
    stagingCoords: [47.6740, -122.1240],
    roostCoords: [47.7590, -122.1910],
    coordinates: [
      [47.6740, -122.1240], // Staging: Marymoor Park, Redmond
      [47.7010, -122.1550], // Woodinville Wine Country
      [47.7320, -122.1750], // Sammamish River Trail
      [47.7590, -122.1910], // Roost Centroid: UW Bothell Wetlands
    ],
  },

  // 6. Skagit Bay Snow Geese
  {
    id: 'corridor-skagit-snowgeese',
    roostId: 'roost-skagit-snowgeese',
    name: 'Skagit Flats Snow Goose Corridor',
    corridorName: 'Fir Island Estuary Influx',
    timeWindow: 'Late Afternoon (3:45 PM - 5:15 PM)',
    heading: 'Heading Southwest into Skagit Bay',
    headingDeg: 215,
    estFlockSize: 55000,
    species: 'Snow Goose',
    state: 'WA',
    flyway: 'Pacific',
    description: 'Tens of thousands of Snow Geese lift off in roaring waves from farm fields near Burlington, flying south across Fir Island into coastal bay shallows.',
    color: '#38bdf8',
    stagingCoords: [48.4550, -122.3350],
    roostCoords: [48.3450, -122.3850],
    coordinates: [
      [48.4550, -122.3350], // Staging: Burlington Grainfields
      [48.4120, -122.3550], // Mount Vernon Riverbends
      [48.3750, -122.3700], // North Fir Island
      [48.3450, -122.3850], // Roost Centroid: Skagit Bay Estuary
    ],
  },

  // 7. Discovery Park Marine Roost
  {
    id: 'corridor-discovery-park',
    roostId: 'roost-discovery-park',
    name: 'Puget Sound Marine Gull Flyway',
    corridorName: 'Shilshole to West Point Vector',
    timeWindow: 'Twilight (5:00 PM - 6:15 PM)',
    heading: 'Heading Southwest to West Point Shoals',
    headingDeg: 220,
    estFlockSize: 12500,
    species: 'Glaucous-winged Gull',
    state: 'WA',
    flyway: 'Pacific',
    description: 'Marine birds staging along the Ballard Locks and Shilshole Marina breakwater flight-line south into the sand shoals of West Point Lighthouse.',
    color: '#06b6d4',
    stagingCoords: [47.6850, -122.4050],
    roostCoords: [47.6620, -122.4280],
    coordinates: [
      [47.6850, -122.4050], // Staging: Shilshole Breakwater
      [47.6740, -122.4180], // Meadow Point / Golden Gardens
      [47.6620, -122.4280], // Roost Centroid: West Point Lighthouse
    ],
  },

  // 8. Central Valley Staten Island Cranes
  {
    id: 'corridor-central-valley-cranes',
    roostId: 'roost-central-valley-cranes',
    name: 'Cosumnes River Crane Roost Vector',
    corridorName: 'Sacramento Delta Inbound Corridor',
    timeWindow: 'Sunset (5:15 PM - 6:30 PM)',
    heading: 'Heading Southwest into Staten Island',
    headingDeg: 210,
    estFlockSize: 28000,
    species: 'Sandhill Crane',
    state: 'CA',
    flyway: 'Pacific',
    description: 'Sandhill Cranes staging across Stone Lakes NWR converge southwest over Cosumnes River preserve into the flooded cornfields of Staten Island.',
    color: '#f59e0b',
    stagingCoords: [38.3850, -121.3950],
    roostCoords: [38.1950, -121.5150],
    coordinates: [
      [38.3850, -121.3950], // Staging: Stone Lakes NWR
      [38.3150, -121.4450], // Cosumnes River Preserve
      [38.2550, -121.4850], // Walnut Grove Riverbend
      [38.1950, -121.5150], // Roost Centroid: Staten Island Roost Ponds
    ],
  },

  // 9. Platte River Crane Mega-Roost
  {
    id: 'corridor-platte-river',
    roostId: 'roost-platte-river',
    name: 'Platte River Crane Sanctuary Vector',
    corridorName: 'Central Plains River Sandbar Convergence',
    timeWindow: 'Sunset (6:15 PM - 7:30 PM Spring)',
    heading: 'Heading South from Cornfields to Riverbed',
    headingDeg: 195,
    estFlockSize: 120000,
    species: 'Sandhill Crane',
    state: 'NE',
    flyway: 'Central',
    description: 'Half a million cranes foraging in the central Nebraska cornfields assemble in massive staging bands before dropping into the braided sandbars of the Platte River.',
    color: '#eab308',
    stagingCoords: [40.7650, -99.0450],
    roostCoords: [40.6994, -99.0817],
    coordinates: [
      [40.7650, -99.0450], // Staging: Kearney High Plains Cornfields
      [40.7320, -99.0620], // Gibbon Valley Overlook
      [40.6994, -99.0817], // Roost Centroid: Rowe Sanctuary River Sandbars
    ],
  },

  // 10. Austin Capital Plaza Purple Martins
  {
    id: 'corridor-austin-martins',
    roostId: 'roost-austin-martins',
    name: 'Austin Purple Martin Urban Swarm',
    corridorName: 'Highland Mall Canopy Influx',
    timeWindow: 'Sunset (8:15 PM - 9:00 PM Summer)',
    heading: 'Heading South into Capital Plaza Live Oaks',
    headingDeg: 195,
    estFlockSize: 100000,
    species: 'Purple Martin',
    state: 'TX',
    flyway: 'Central',
    description: 'Over 100,000 Purple Martins stream from the Colorado River and northern greenbelts, forming an immense swirling vortex before diving into parking lot live oak trees.',
    color: '#ec4899',
    stagingCoords: [30.4150, -97.6850],
    roostCoords: [30.3250, -97.7150],
    coordinates: [
      [30.4150, -97.6850], // Staging: North Austin Greenbelt
      [30.3750, -97.7020], // Crestview / Midtown
      [30.3250, -97.7150], // Roost Centroid: Capital Plaza Live Oaks
    ],
  },

  // 11. Minneapolis Mississippi River Crow Roost
  {
    id: 'corridor-minneapolis-crows',
    roostId: 'roost-minneapolis-crows',
    name: 'Twin Cities River Gorge Crow Roost Vector',
    corridorName: 'Lake of the Isles to River Bluffs',
    timeWindow: 'Dusk (4:15 PM - 5:30 PM)',
    heading: 'Heading East toward Mississippi Gorge',
    headingDeg: 105,
    estFlockSize: 32000,
    species: 'American Crow',
    state: 'MN',
    flyway: 'Mississippi',
    description: 'Crows across the Minneapolis Chain of Lakes congregate near Lake of the Isles and Loring Park before flying east into dense roost stands along the river bluffs.',
    color: '#10b981',
    stagingCoords: [44.9550, -93.3050],
    roostCoords: [44.9750, -93.2350],
    coordinates: [
      [44.9550, -93.3050], // Staging: Lake of the Isles
      [44.9680, -93.2750], // Loring Park & Downtown South
      [44.9750, -93.2350], // Roost Centroid: U of M Mississippi River Bluffs
    ],
  },

  // 12. Hiwassee Confluence Crane Roost
  {
    id: 'corridor-hiwassee-cranes',
    roostId: 'roost-hiwassee-cranes',
    name: 'Hiwassee Refuge Crane Influx',
    corridorName: 'Tennessee Valley River Confluence Vector',
    timeWindow: 'Sunset (5:00 PM - 6:15 PM)',
    heading: 'Heading Southwest toward River Shallows',
    headingDeg: 215,
    estFlockSize: 24000,
    species: 'Sandhill Crane',
    state: 'TN',
    flyway: 'Mississippi',
    description: 'Sandhill Cranes foraging in Cherokee County farmlands fly southwest across the Hiwassee and Tennessee river confluence onto protected shallow sandbars.',
    color: '#f97316',
    stagingCoords: [35.5250, -84.9150],
    roostCoords: [35.4150, -84.9950],
    coordinates: [
      [35.5250, -84.9150], // Staging: Cherokee County Plains
      [35.4750, -84.9550], // Rogers Creek Estuary
      [35.4150, -84.9950], // Roost Centroid: Hiwassee Island Sandbars
    ],
  },

  // 13. Lawrence Merrimack River Crow Roost
  {
    id: 'corridor-lawrence-crows',
    roostId: 'roost-lawrence-crows',
    name: 'Merrimack River Crow Roost Vector',
    corridorName: 'Andover to Lawrence Hospital Groves',
    timeWindow: 'Dusk (4:00 PM - 5:15 PM)',
    heading: 'Heading North toward Merrimack River',
    headingDeg: 345,
    estFlockSize: 25000,
    species: 'American Crow',
    state: 'MA',
    flyway: 'Atlantic',
    description: 'Over 25,000 crows assemble across Andover fields and Shawsheen River meadows before streaming north into pine groves behind Lawrence General Hospital.',
    color: '#8b5cf6',
    stagingCoords: [42.6550, -71.1450],
    roostCoords: [42.7050, -71.1650],
    coordinates: [
      [42.6550, -71.1450], // Staging: Andover Meadows
      [42.6820, -71.1550], // Shawsheen Village
      [42.7050, -71.1650], // Roost Centroid: Lawrence Hospital Pine Groves
    ],
  },

  // 14. Lancaster Conestoga River Crow Roost
  {
    id: 'corridor-lancaster-crows',
    roostId: 'roost-lancaster-crows',
    name: 'Lancaster County Amish Farmland Crow Vector',
    corridorName: 'Leacock Basin to Conestoga River',
    timeWindow: 'Sunset (4:30 PM - 5:45 PM)',
    heading: 'Heading West into Lancaster River Canopy',
    headingDeg: 255,
    estFlockSize: 35000,
    species: 'American Crow',
    state: 'PA',
    flyway: 'Atlantic',
    description: 'Tens of thousands of crows feeding on Amish corn and dairy farms assemble along Upper Leacock ridges before streaming west into Conestoga River trees.',
    color: '#06b6d4',
    stagingCoords: [40.0850, -76.1950],
    roostCoords: [40.0380, -76.3050],
    coordinates: [
      [40.0850, -76.1950], // Staging: Upper Leacock Farmlands
      [40.0620, -76.2450], // Bridgeport Conestoga Crossing
      [40.0380, -76.3050], // Roost Centroid: Lancaster River Parklands
    ],
  },

  // 15. Auburn Finger Lakes Crow Super-Roost
  {
    id: 'corridor-auburn-crows',
    roostId: 'roost-auburn-crows',
    name: 'Auburn Finger Lakes Crow Super-Roost Vector',
    corridorName: 'Skaneateles Ridges to Owasco River Canal',
    timeWindow: 'Dusk (4:15 PM - 5:30 PM)',
    heading: 'Heading West toward Owasco Canal',
    headingDeg: 255,
    estFlockSize: 60000,
    species: 'American Crow',
    state: 'NY',
    flyway: 'Atlantic',
    description: 'Up to 60,000 crows foraging across the Finger Lakes dairy farms gather along Skaneateles ridges before diving into the Owasco River canal trees.',
    color: '#ef4444',
    stagingCoords: [42.9850, -76.4750],
    roostCoords: [42.9350, -76.5650],
    coordinates: [
      [42.9850, -76.4750], // Staging: Skaneateles Ridges
      [42.9550, -76.5150], // East Auburn Perimeters
      [42.9350, -76.5650], // Roost Centroid: Owasco River Downtown Canal
    ],
  },
];

/**
 * Procedurally generates a feeder flight path for any roost that doesn't have an explicit entry
 */
export function generateProceduralFlightPath(
  roostId: string,
  roostCoords: [number, number],
  roostName: string,
  species: string,
  count: number = 2500
): FlightCorridor {
  const [lat, lng] = roostCoords;
  // Compute a realistic staging ground 3 to 5 miles east/northeast of the roost
  const stagingLat = lat + 0.04;
  const stagingLng = lng + 0.06;

  return {
    id: `corridor-${roostId}`,
    roostId,
    name: `${roostName} Inbound Flight Vector`,
    corridorName: `Local Staging to ${roostName}`,
    timeWindow: 'Dusk / Sunset (30m before dusk)',
    heading: 'Heading West/Southwest toward Roost Centroid',
    headingDeg: 240,
    estFlockSize: count,
    species,
    description: `Feeder flight vector connecting regional staging grounds directly into ${roostName}.`,
    color: '#38bdf8',
    stagingCoords: [stagingLat, stagingLng],
    roostCoords,
    coordinates: [
      [stagingLat, stagingLng],
      [lat + 0.02, lng + 0.03],
      [lat, lng],
    ],
  };
}

/**
 * Finds or synthesizes an active flight path for any given roost
 */
export function getFlightPathForRoost(roost: {
  id?: string;
  roostId?: string;
  lat: number;
  lng: number;
  name?: string;
  comName?: string;
  species?: string;
  howMany?: number;
  count?: number;
}): FlightCorridor {
  const targetId = roost.roostId || roost.id;

  // 1. Direct ID match
  if (targetId) {
    const directMatch = ROOST_FLIGHT_PATHS.find(
      (p) => p.roostId === targetId || p.id === targetId || p.id === `corridor-${targetId}`
    );
    if (directMatch) return directMatch;
  }

  // 2. Coordinate proximity match (< 3 miles)
  const proximityMatch = ROOST_FLIGHT_PATHS.find((p) => {
    const rCoords = p.roostCoords || p.coordinates[p.coordinates.length - 1];
    const dLat = Math.abs(rCoords[0] - roost.lat);
    const dLng = Math.abs(rCoords[1] - roost.lng);
    return dLat < 0.05 && dLng < 0.05;
  });
  if (proximityMatch) return proximityMatch;

  // 3. Procedural feeder corridor fallback so ZERO roosts are left without a flight path
  return generateProceduralFlightPath(
    targetId || `roost-${Math.round(roost.lat * 100)}-${Math.round(roost.lng * 100)}`,
    [roost.lat, roost.lng],
    roost.name || roost.comName || 'Roost Concentration',
    roost.species || roost.comName || 'Flock Species',
    roost.count || roost.howMany || 2500
  );
}

/**
 * Converts the 15 Roost Sites into clean Observation objects for map/sidebar compatibility
 */
export function getRoostsAsObservations(): Observation[] {
  return ROOST_SITES.map((r) => ({
    id: r.id,
    speciesCode: r.speciesCode,
    comName: r.species,
    sciName: '',
    locId: `ROOST_${r.id}`,
    locName: r.locName,
    obsDt: r.peakTime,
    howMany: r.count,
    lat: r.lat,
    lng: r.lng,
    obsReviewed: true,
    subId: 'ROOST_TELEMETRY',
    direction: `Inbound from ${r.stagingAreaName}`,
    isCrowRoost: true,
    notes: `${r.name}: ${r.description} Staging: ${r.stagingAreaName}. Peak: ${r.peakTime}`,
    originStagingArea: r.stagingAreaName,
    flightHeadingDeg: 270,
    trajectoryCoords: [r.stagingCoords, [r.lat, r.lng]],
  }));
}
