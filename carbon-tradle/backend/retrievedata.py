#!/usr/bin/env python3

import requests
import json
import math

# =============================================================================
# 1. DEFINITIONS
# =============================================================================

# Your new parent mapping dictionary
#!/usr/bin/env python3

# 1) TOP-LEVEL SECTORS
ALL_SECTORS = [
    "fluorinated-gases",
    "waste",
    "transportation",
    "fossil-fuel-operations",
    "agriculture",
    "power",
    "forestry-and-land-use",
    "buildings",
    "manufacturing",
    "mineral-extraction"
]

# 2) ALL SUBSECTORS
ALL_SUBSECTORS = [
    "aluminum",
    "bauxite-mining",
    "biological-treatment-of-solid-waste-and-biogenic",
    "cement",
    "chemicals",
    "coal-mining",
    "copper-mining",
    "cropland-fires",
    "crop-residues",
    "domestic-aviation",
    "domestic-shipping",
    "domestic-shipping-ship",
    "domestic-wastewater-treatment-and-discharge",
    "electricity-generation",
    "enteric-fermentation-cattle-operation",
    "enteric-fermentation-cattle-pasture",
    "enteric-fermentation-other",
    "fluorinated-gases",
    "food-beverage-tobacco",
    "forest-land-clearing",
    "forest-land-degradation",
    "forest-land-fires",
    "glass",
    "heat-plants",
    "incineration-and-open-burning-of-waste",
    "industrial-wastewater-treatment-and-discharge",
    "international-aviation",
    "international-shipping",
    "international-shipping-ship",
    "iron-and-steel",
    "iron-mining",
    "lime",
    "manure-applied-to-soils",
    "manure-left-on-pasture-cattle",
    "manure-management-cattle-operation",
    "manure-management-other",
    "net-forest-land",
    "net-shrubgrass",
    "net-wetland",
    "non-residential-onsite-fuel-usage",
    "oil-and-gas-production",
    "oil-and-gas-refining",
    "oil-and-gas-transport",
    "other-agricultural-soil-emissions",
    "other-chemicals",
    "other-energy-use",
    "other-fossil-fuel-operations",
    "other-manufacturing",
    "other-metals",
    "other-mining-quarrying",
    "other-onsite-fuel-usage",
    "other-transport",
    "petrochemical-steam-cracking",
    "pulp-and-paper",
    "railways",
    "removals",
    "residential-onsite-fuel-usage",
    "rice-cultivation",
    "road-transportation",
    "road-transportation-road-segment",
    "rock-quarrying",
    "sand-quarrying",
    "shrubgrass-fires",
    "soil-organic-carbon",
    "solid-fuel-transformation",
    "solid-waste-disposal",
    "synthetic-fertilizer-application",
    "textiles-leather-apparel",
    "water-reservoirs",
    "wetland-fires",
    "wood-and-wood-products"
]

# 3) PARENT MAPPING: SUBSECTOR -> ONE OF THE TEN SECTORS
PARENT_MAPPING = {
    # manufacturing
    "aluminum": "manufacturing",
    "cement": "manufacturing",
    "chemicals": "manufacturing",
    "food-beverage-tobacco": "manufacturing",
    "glass": "manufacturing",
    "iron-and-steel": "manufacturing",
    "other-chemicals": "manufacturing",
    "other-energy-use": "manufacturing",
    "other-manufacturing": "manufacturing",
    "other-metals": "manufacturing",
    "petrochemical-steam-cracking": "manufacturing",
    "pulp-and-paper": "manufacturing",
    "textiles-leather-apparel": "manufacturing",

    # mineral-extraction
    "bauxite-mining": "mineral-extraction",
    "copper-mining": "mineral-extraction",
    "iron-mining": "mineral-extraction",
    "lime": "mineral-extraction",
    "other-mining-quarrying": "mineral-extraction",
    "rock-quarrying": "mineral-extraction",
    "sand-quarrying": "mineral-extraction",

    # power
    "electricity-generation": "power",
    "heat-plants": "power",
    "solid-fuel-transformation": "power",

    # transportation
    "domestic-aviation": "transportation",
    "domestic-shipping": "transportation",
    "domestic-shipping-ship": "transportation",
    "international-aviation": "transportation",
    "international-shipping": "transportation",
    "international-shipping-ship": "transportation",
    "other-transport": "transportation",
    "railways": "transportation",
    "road-transportation": "transportation",
    "road-transportation-road-segment": "transportation",

    # fossil-fuel-operations
    "coal-mining": "fossil-fuel-operations",
    "oil-and-gas-production": "fossil-fuel-operations",
    "oil-and-gas-refining": "fossil-fuel-operations",
    "oil-and-gas-transport": "fossil-fuel-operations",
    "other-fossil-fuel-operations": "fossil-fuel-operations",

    # agriculture
    "cropland-fires": "agriculture",
    "crop-residues": "agriculture",
    "enteric-fermentation-cattle-operation": "agriculture",
    "enteric-fermentation-cattle-pasture": "agriculture",
    "enteric-fermentation-other": "agriculture",
    "manure-applied-to-soils": "agriculture",
    "manure-left-on-pasture-cattle": "agriculture",
    "manure-management-cattle-operation": "agriculture",
    "manure-management-other": "agriculture",
    "other-agricultural-soil-emissions": "agriculture",
    "rice-cultivation": "agriculture",
    "synthetic-fertilizer-application": "agriculture",

    # forestry-and-land-use
    "forest-land-clearing": "forestry-and-land-use",
    "forest-land-degradation": "forestry-and-land-use",
    "forest-land-fires": "forestry-and-land-use",
    "net-forest-land": "forestry-and-land-use",
    "net-shrubgrass": "forestry-and-land-use",
    "net-wetland": "forestry-and-land-use",
    "removals": "forestry-and-land-use",
    "shrubgrass-fires": "forestry-and-land-use",
    "soil-organic-carbon": "forestry-and-land-use",
    "water-reservoirs": "forestry-and-land-use",
    "wetland-fires": "forestry-and-land-use",
    "wood-and-wood-products": "forestry-and-land-use",

    # buildings
    "non-residential-onsite-fuel-usage": "buildings",
    "other-onsite-fuel-usage": "buildings",
    "residential-onsite-fuel-usage": "buildings",

    # waste
    "biological-treatment-of-solid-waste-and-biogenic": "waste",
    "domestic-wastewater-treatment-and-discharge": "waste",
    "incineration-and-open-burning-of-waste": "waste",
    "industrial-wastewater-treatment-and-discharge": "waste",
    "solid-waste-disposal": "waste",

    # fluorinated-gases
    "fluorinated-gases": "fluorinated-gases"
}

def map_subsector_to_sector(subsector: str) -> str:
    """
    Return the top-level sector for the given subsector, or 'unknown' if not found.
    """
    return PARENT_MAPPING.get(subsector, "unknown")


# =============================================================================
# 2. PARAMETERS TO EDIT
# =============================================================================

COUNTRIES = [
    "AFG","ALB","DZA","AND","AGO","ATG","ARG","ARM","AUS","AUT","AZE","BHS","BHR","BGD","BRB",
    "BLR","BEL","BLZ","BEN","BTN","BOL","BIH","BWA","BRA","BRN","BGR","BFA","BDI","KHM","CMR",
    "CAN","CPV","CAF","TCD","CHL","CHN","COL","COM","COK","CRI","CIV","HRV","CUB","CYP",
    "CZE","COD","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH",
    "FJI","FIN","FRA","GAB","GMB","GEO","DEU","GHA","GRC","GRD","GTM","GIN","GNB","GUY","HTI",
    "HND","HUN","ISL","IND","IDN","IRN","IRQ","IRL","ISR","ITA","JAM","JPN","JOR","KAZ","KEN",
    "KIR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MKD","MDG","MWI",
    "MYS","MDV","MLI","MLT","MHL","MRT","MUS","MEX","FSM","MDA","MNG","MNE","MAR","MOZ","MMR",
    "NAM","NRU","NPL","NLD","NZL","NIC","NER","NGA","NIU","PRK","NOR","OMN","PAK","PLW","PAN",
    "PNG","PRY","PER","PHL","POL","PRT","QAT","COG","ROU","RUS","RWA","KNA","LCA","VCT","WSM",
    "STP","SAU","SEN","SRB","SYC","SLE","SGP","SVK","SVN","SLB","SOM","ZAF","KOR","SSD","ESP",
    "LKA","SDN","SUR","SWE","CHE","SYR","TJK","TZA","THA","TLS","TGO","TON","TTO","TUN","TUR",
    "TKM","TUV","UGA","UKR","ARE","GBR","USA","URY","UZB","VUT","VEN","VNM","YEM","ZMB","ZWE"
]

API_TOKEN = None   # e.g. "abc123"
YEAR = 2022
REQUESTED_SECTORS = None
REQUESTED_SUBSECTORS = None
BASE_URL = "https://api.climatetrace.org/v6/assets/emissions"
CHUNK_SIZE = 50
OUTPUT_FILE = "simplified_emissions.json"


# =============================================================================
# 3. FETCH FUNCTION
# =============================================================================

def to_comma(lst):
    """Convert a Python list into a comma-separated string (or None if empty)."""
    if not lst:
        return None
    return ",".join(str(x) for x in lst)

def fetch_emissions(countries=None, sectors=None, subsectors=None, year=None, api_token=None, chunk_size=50):
    """
    Calls /v6/assets/emissions for the given filters and returns a combined list of results.
    
    :param countries: List of 3-letter ISO codes
    :param sectors: List of top-level sectors, or None
    :param subsectors: List of subsectors, or None
    :param year: int (e.g. 2022) or None
    :param api_token: Bearer token or None
    :param chunk_size: How many countries per request
    :return: Combined list of response items (dicts or lists)
    """
    all_results = []

    # Common params
    params_common = {}
    if sectors:
        params_common["sectors"] = to_comma(sectors)
    if subsectors:
        params_common["subsectors"] = to_comma(subsectors)
    if year is not None:
        params_common["years"] = str(year)

    headers = {}
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"

    # If no countries given, do one request
    if not countries:
        resp = requests.get(BASE_URL, headers=headers, params=params_common)
        if resp.status_code == 200:
            data = resp.json()
            return data if isinstance(data, list) else [data]
        else:
            print(f"Error {resp.status_code}: {resp.text}")
            return []

    total_countries = len(countries)
    num_chunks = math.ceil(total_countries / chunk_size)

    for i in range(num_chunks):
        start = i * chunk_size
        end = start + chunk_size
        chunk = countries[start:end]

        params_chunk = dict(params_common)
        params_chunk["countries"] = to_comma(chunk)

        print(f"Requesting chunk {i+1}/{num_chunks} ({len(chunk)} countries)...")
        resp = requests.get(BASE_URL, headers=headers, params=params_chunk)

        if resp.status_code == 200:
            data = resp.json()
            # data might be a dict (e.g., {"DEU": [...]}) or a list
            if isinstance(data, list):
                all_results.extend(data)
            else:
                all_results.append(data)
        else:
            print(f"Error {resp.status_code}: {resp.text}")

    return all_results


# =============================================================================
# 4. SIMPLIFY FUNCTION
# =============================================================================

def simplify_data(raw_responses):
    """
    raw_responses might be multiple dicts like:
      [{ "DEU": [...], "USA": [...] },
       { "CHN": [...], "CAN": [...] }]
    We need to iterate through each dict, each country code, and each record.
    """
    simplified = []

    for item in raw_responses:
        if not isinstance(item, dict):
            # If it's a list or something else, skip or handle as needed
            continue

        for country_code, records_for_country in item.items():
            for rec in records_for_country:
                subsector_str = rec.get("Sector", "")
                emissions_val = rec.get("Emissions", 0.0)

                # Use our new parent_mapping to figure out the top-level sector
                parent_sector = map_subsector_to_sector(subsector_str)

                simplified.append({
                    "sector": parent_sector,
                    "subsector": subsector_str,
                    "emissions": emissions_val,
                    "country": country_code
                })
    return simplified


# =============================================================================
# 5. MAIN EXECUTION
# =============================================================================

if __name__ == "__main__":
    raw_data = fetch_emissions(
        countries=COUNTRIES,
        sectors=REQUESTED_SECTORS,
        subsectors=REQUESTED_SUBSECTORS,
        year=YEAR,
        api_token=API_TOKEN,
        chunk_size=CHUNK_SIZE
    )

    print(f"\nFetched {len(raw_data)} chunk(s) of data.\n")

    simplified_results = simplify_data(raw_data)
    print(f"Total records after simplifying: {len(simplified_results)}")

    # Print a few
    for i, row in enumerate(simplified_results[:10], start=1):
        print(f"{i}. {row}")

    # Save to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(simplified_results, f, indent=2)

    print(f"\nDone! Wrote {len(simplified_results)} simplified records to '{OUTPUT_FILE}'.")
