import json
import requests
import logging
import time  # optional, for rate limit delays

# Configure logging for debug-level messages
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# Base URL for the ClimateTRACE API
BASE_URL = "https://api.climatetrace.org"

# -------------------------------
# Step 1: Retrieve definitions (sectors and subsectors)
# -------------------------------
logging.info("Fetching sectors definitions from API")
sectors_url = f"{BASE_URL}/v6/definitions/sectors"
sectors_response = requests.get(sectors_url)
sectors_response.raise_for_status()
sectors_data = sectors_response.json()  # Expected: list of strings
logging.debug(f"Sectors data: {sectors_data}")

logging.info("Fetching subsectors definitions from API")
subsectors_url = f"{BASE_URL}/v6/definitions/subsectors"
subsectors_response = requests.get(subsectors_url)
subsectors_response.raise_for_status()
subsectors_data = subsectors_response.json()  # Expected: list of strings
logging.debug(f"Subsectors data: {subsectors_data}")

# -------------------------------
# Step 2: Build mapping from sectors to subsectors using a manual parent mapping
# -------------------------------
# Initialize mapping: each sector maps to an empty list
sector_subsector_mapping = {sector: [] for sector in sectors_data}
logging.info("Built initial sector mapping.")
logging.debug(f"Sector mapping after initialization: {sector_subsector_mapping}")

# Manual mapping of subsector to its parent sector.
# Adjust or expand this mapping as needed.
parent_mapping = {
    # manufacturing
    'aluminum': 'manufacturing',
    'cement': 'manufacturing',
    'chemicals': 'manufacturing',
    'pulp-and-paper': 'manufacturing',
    'iron-and-steel': 'manufacturing',
    'glass': 'manufacturing',
    'textiles-leather-apparel': 'manufacturing',
    'other-chemicals': 'manufacturing',
    'other-energy-use': 'manufacturing',
    'other-manufacturing': 'manufacturing',
    'other-metals': 'manufacturing',
    'petrochemical-steam-cracking': 'manufacturing',
    
    # mineral-extraction
    'bauxite-mining': 'mineral-extraction',
    'coal-mining': 'mineral-extraction',
    'copper-mining': 'mineral-extraction',
    'iron-mining': 'mineral-extraction',
    'rock-quarrying': 'mineral-extraction',
    'sand-quarrying': 'mineral-extraction',
    'other-mining-quarrying': 'mineral-extraction',
    'lime': 'mineral-extraction',
    
    # power
    'electricity-generation': 'power',
    'heat-plants': 'power',
    
    # transportation
    'domestic-aviation': 'transportation',
    'international-aviation': 'transportation',
    'domestic-shipping': 'transportation',
    # 'domestic-shipping-ship': no mapping provided
    'railways': 'transportation',
    'road-transportation': 'transportation',
    'road-transportation-road-segment': 'transportation',
    'other-transport': 'transportation',
    'international-shipping': 'transportation',
    # 'international-shipping-ship': no mapping provided
    
    # fossil-fuel-operations
    'oil-and-gas-production': 'fossil-fuel-operations',
    'oil-and-gas-refining': 'fossil-fuel-operations',
    'oil-and-gas-transport': 'fossil-fuel-operations',
    'other-fossil-fuel-operations': 'fossil-fuel-operations',
    
    # agriculture
    'rice-cultivation': 'agriculture',
    'enteric-fermentation-cattle-operation': 'agriculture',
    'enteric-fermentation-cattle-pasture': 'agriculture',
    'enteric-fermentation-other': 'agriculture',
    'manure-applied-to-soils': 'agriculture',
    'manure-management-cattle-operation': 'agriculture',
    'manure-management-other': 'agriculture',
    'other-agricultural-soil-emissions': 'agriculture',
    'crop-residues': 'agriculture',
    'cropland-fires': 'agriculture',
    'manure-left-on-pasture-cattle': 'agriculture',
    
    # forestry-and-land-use
    'forest-land-clearing': 'forestry-and-land-use',
    'forest-land-degradation': 'forestry-and-land-use',
    'forest-land-fires': 'forestry-and-land-use',
    'net-forest-land': 'forestry-and-land-use',
    'net-shrubgrass': 'forestry-and-land-use',
    'net-wetland': 'forestry-and-land-use',
    'shrubgrass-fires': 'forestry-and-land-use',
    'soil-organic-carbon': 'forestry-and-land-use',
    'wetland-fires': 'forestry-and-land-use',
    'water-reservoirs': 'forestry-and-land-use',
    'wood-and-wood-products': 'forestry-and-land-use',
    'removals': 'forestry-and-land-use',
    
    # waste
    'biological-treatment-of-solid-waste-and-biogenic': 'waste',
    'incineration-and-open-burning-of-waste': 'waste',
    'solid-waste-disposal': 'waste',
    'domestic-wastewater-treatment-and-discharge': 'waste',
    'residential-onsite-fuel-usage': 'waste',
    'industrial-wastewater-treatment-and-discharge': 'waste',
    
    # fluorinated-gases
    'fluorinated-gases': 'fluorinated-gases',
    
    # buildings (if applicable)
    'non-residential-onsite-fuel-usage': 'buildings'
}

# Process each subsector from the API data
for sub in subsectors_data:
    if not isinstance(sub, str):
        logging.warning("Skipping subsector since it's not a string: %s", sub)
        continue
    parent = parent_mapping.get(sub)
    if parent and parent in sector_subsector_mapping:
        sector_subsector_mapping[parent].append(sub)
        logging.debug("Assigned subsector '%s' to sector '%s'.", sub, parent)
    else:
        logging.warning("No parent sector found for subsector '%s'.", sub)

logging.info("Completed updating sector mapping with subsectors.")
logging.debug(f"Final sector mapping: {sector_subsector_mapping}")

# -------------------------------
# Step 3: Build nested emission data per country/sector/subsector
# -------------------------------
# Define the countries of interest (mapping country name to its 3-letter code)
# countries = {
#     "China": "CHN",
#     "United States": "USA",
#     "India": "IND",
#     "Brazil": "BRA",
#     "Russia": "RUS"
# }

countries = {
    "Afghanistan": "AFG",
    "Albania": "ALB",
    "Algeria": "DZA",
    "Andorra": "AND",
    "Angola": "AGO",
    "Antigua and Barbuda": "ATG",
    "Argentina": "ARG",
    "Armenia": "ARM",
    "Australia": "AUS",
    "Austria": "AUT",
    "Azerbaijan": "AZE",
    "Bahamas": "BHS",
    "Bahrain": "BHR",
    "Bangladesh": "BGD",
    "Barbados": "BRB",
    "Belarus": "BLR",
    "Belgium": "BEL",
    "Belize": "BLZ",
    "Benin": "BEN",
    "Bhutan": "BTN",
    "Bolivia": "BOL",
    "Bosnia and Herzegovina": "BIH",
    "Botswana": "BWA",
    "Brazil": "BRA",
    "Brunei": "BRN",
    "Bulgaria": "BGR",
    "Burkina Faso": "BFA",
    "Burundi": "BDI",
    "Cambodia": "KHM",
    "Cameroon": "CMR",
    "Canada": "CAN",
    "Cape Verde": "CPV",
    "Central African Republic": "CAF",
    "Chad": "TCD",
    "Chile": "CHL",
    "China": "CHN",
    "Colombia": "COL",
    "Comoros": "COM",
    "Cook Islands": "COK",
    "Costa Rica": "CRI",
    "Côte d'Ivoire": "CIV",
    # "ISO" omitted – not a recognized country code
    "Croatia": "HRV",
    "Cuba": "CUB",
    "Cyprus": "CYP",
    "Czechia": "CZE",
    "Democratic Republic of the Congo": "COD",
    "Denmark": "DNK",
    "Djibouti": "DJI",
    "Dominica": "DMA",
    "Dominican Republic": "DOM",
    "Ecuador": "ECU",
    "Egypt": "EGY",
    "El Salvador": "SLV",
    "Equatorial Guinea": "GNQ",
    "Eritrea": "ERI",
    "Estonia": "EST",
    "Eswatini": "SWZ",
    "Ethiopia": "ETH",
    "Fiji": "FJI",
    "Finland": "FIN",
    "France": "FRA",
    "Gabon": "GAB",
    "Gambia": "GMB",
    "Georgia": "GEO",
    "Germany": "DEU",
    "Ghana": "GHA",
    "Greece": "GRC",
    "Grenada": "GRD",
    "Guatemala": "GTM",
    "Guinea": "GIN",
    "Guinea-Bissau": "GNB",
    "Guyana": "GUY",
    "Haiti": "HTI",
    "Honduras": "HND",
    "Hungary": "HUN",
    "Iceland": "ISL",
    "India": "IND",
    "Indonesia": "IDN",
    "Iran": "IRN",
    "Iraq": "IRQ",
    "Ireland": "IRL",
    "Israel": "ISR",
    "Italy": "ITA",
    "Jamaica": "JAM",
    "Japan": "JPN",
    "Jordan": "JOR",
    "Kazakhstan": "KAZ",
    "Kenya": "KEN",
    "Kiribati": "KIR",
    "Kuwait": "KWT",
    "Kyrgyzstan": "KGZ",
    "Laos": "LAO",
    "Latvia": "LVA",
    "Lebanon": "LBN",
    "Lesotho": "LSO",
    "Liberia": "LBR",
    "Libya": "LBY",
    "Liechtenstein": "LIE",
    "Lithuania": "LTU",
    "Luxembourg": "LUX",
    "North Macedonia": "MKD",
    "Madagascar": "MDG",
    "Malawi": "MWI",
    "Malaysia": "MYS",
    "Maldives": "MDV",
    "Mali": "MLI",
    "Malta": "MLT",
    "Marshall Islands": "MHL",
    "Mauritania": "MRT",
    "Mauritius": "MUS",
    "Mexico": "MEX",
    "Micronesia": "FSM",
    "Moldova": "MDA",
    "Mongolia": "MNG",
    "Montenegro": "MNE",
    "Morocco": "MAR",
    "Mozambique": "MOZ",
    "Myanmar": "MMR",
    "Namibia": "NAM",
    "Nauru": "NRU",
    "Nepal": "NPL",
    "Netherlands": "NLD",
    "New Zealand": "NZL",
    "Nicaragua": "NIC",
    "Niger": "NER",
    "Nigeria": "NGA",
    "Niue": "NIU",
    "North Korea": "PRK",
    "Norway": "NOR",
    "Oman": "OMN",
    "Pakistan": "PAK",
    "Palau": "PLW",
    "Panama": "PAN",
    "Papua New Guinea": "PNG",
    "Paraguay": "PRY",
    "Peru": "PER",
    "Philippines": "PHL",
    "Poland": "POL",
    "Portugal": "PRT",
    "Qatar": "QAT",
    "Republic of the Congo": "COG",
    "Romania": "ROU",
    "Russia": "RUS",
    "Rwanda": "RWA",
    "Saint Kitts and Nevis": "KNA",
    "Saint Lucia": "LCA",
    "Saint Vincent and the Grenadines": "VCT",
    "Samoa": "WSM",
    "Sao Tome and Principe": "STP",
    "Saudi Arabia": "SAU",
    "Senegal": "SEN",
    "Serbia": "SRB",
    "Seychelles": "SYC",
    "Sierra Leone": "SLE",
    "Singapore": "SGP",
    "Slovakia": "SVK",
    "Slovenia": "SVN",
    "Solomon Islands": "SLB",
    "Somalia": "SOM",
    "South Africa": "ZAF",
    "South Korea": "KOR",
    "South Sudan": "SSD",
    "Spain": "ESP",
    "Sri Lanka": "LKA",
    "Sudan": "SDN",
    "Suriname": "SUR",
    "Sweden": "SWE",
    "Switzerland": "CHE",
    "Syria": "SYR",
    "Tajikistan": "TJK",
    "Tanzania": "TZA",
    "Thailand": "THA",
    "Timor-Leste": "TLS",
    "Togo": "TGO",
    "Tonga": "TON",
    "Trinidad and Tobago": "TTO",
    "Tunisia": "TUN",
    "Turkey": "TUR",
    "Turkmenistan": "TKM",
    "Tuvalu": "TUV",
    "Uganda": "UGA",
    "Ukraine": "UKR",
    "United Arab Emirates": "ARE",
    "United Kingdom": "GBR",
    "United States": "USA",
    "Uruguay": "URY",
    "Uzbekistan": "UZB",
    "Vanuatu": "VUT",
    "Venezuela": "VEN",
    "Vietnam": "VNM",
    "Yemen": "YEM",
    "Zambia": "ZMB",
    "Zimbabwe": "ZWE"
}


logging.info("Countries selected: %s", countries)

# Prepare the final nested structure:
# Structure: { country: { sector: { subsector: <emission_data> } } }
result = {}

for country, country_code in countries.items():
    result[country] = {}
    for sector, subsectors in sector_subsector_mapping.items():
        result[country][sector] = {}
        for subsector in subsectors:
            params = {
                "countries": country_code,
                "sectors": sector,
                "subsectors": subsector,
                "year": 2022,
                "limit": 1000
            }
            logging.info(f"Fetching emission data for {country} (code {country_code}), sector '{sector}', subsector '{subsector}'")
            try:
                response = requests.get(f"{BASE_URL}/v6/assets/emissions", params=params)
                response.raise_for_status()
                emission_data = response.json()  # Expected: list of emission objects
                logging.debug(f"Emission data for {country} - {sector} - {subsector}: {emission_data}")
            except Exception as e:
                logging.error(f"Error fetching emission data for {country} - {sector} - {subsector}: {e}")
                emission_data = None
            result[country][sector][subsector] = emission_data
            # Optional: delay between calls to avoid rate limits
            # time.sleep(0.1)

logging.info("Completed fetching emission data for all combinations.")

# -------------------------------
# Step 4: Write the final nested JSON structure to a file
# -------------------------------
output_filename = "emission_data_all.json"
try:
    with open(output_filename, "w") as outfile:
        json.dump(result, outfile, indent=4)
    logging.info(f"Output written to file '{output_filename}' successfully.")
except Exception as e:
    logging.error(f"Error writing output to file '{output_filename}': {e}")
