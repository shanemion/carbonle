#!/usr/bin/env python3

import json
import math
from collections import defaultdict

# Input file containing a list of records:
# [
#   {
#     "country": "USA",
#     "sector": "power",
#     "subsector": "electricity-generation",
#     "emissions": 1234.56
#   },
#   ...
# ]
INPUT_FILE = "simplified_emissions.json"

# Output files
NET_OUTPUT         = "net_emissions.json"
GROSS_OUTPUT       = "gross_emissions.json"
BREAKDOWN_OUTPUT   = "subsector_breakdown.json"

def load_simplified_emissions(filename):
    """
    Loads the simplified_emissions.json (a list of records).
    Each record typically has:
      {
        "country": <string>,
        "sector": <string>,
        "subsector": <string>,
        "emissions": <float>
      }
    """
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

def calculate_net_emissions(data):
    """
    Returns a dict of net emissions by country.
    Net = sum of all emissions (including negative).
    Example result: { "USA": 123456.78, "DEU": -9999.0, ... }
    """
    net_by_country = defaultdict(float)
    for record in data:
        country = record.get("country", "N/A")
        emissions = record.get("emissions", 0.0)
        net_by_country[country] += emissions
    return dict(net_by_country)

def calculate_gross_emissions(data):
    """
    Returns a dict of gross emissions by country.
    Gross = sum of only positive emissions, ignoring negative or zero values.
    Example result: { "USA": 200000.0, "DEU": 50000.0, ... }
    """
    gross_by_country = defaultdict(float)
    for record in data:
        country = record.get("country", "N/A")
        emissions = record.get("emissions", 0.0)
        if emissions > 0:
            gross_by_country[country] += emissions
    return dict(gross_by_country)

def build_subsector_breakdown(data):
    """
    Returns a nested dict:
      {
        "USA": {
          "power": {
            "electricity-generation": 1234.56,
            "heat-plants": 789.12,
            "sectorTotal": 2023.68
          },
          "transportation": {
            "domestic-aviation": 456.78,
            "road-transportation": 321.0,
            "sectorTotal": 777.78
          }
        },
        "DEU": {
          ...
        }
      }

    In other words, for each country and each sector, we store a dict of
    { subsectorName => emissions }, plus a "sectorTotal" key.
    Summing the individual subsectors (excluding "sectorTotal") yields the net
    emissions for that sector.
    """
    # Nested structure: breakdown[country][sector][subsector] -> float
    breakdown = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))

    # 1) Fill the nested dict
    for record in data:
        country   = record.get("country", "N/A")
        sector    = record.get("sector", "unknown")
        subsector = record.get("subsector", "unknown")
        emissions = record.get("emissions", 0.0)

        breakdown[country][sector][subsector] += emissions

    # 2) Convert into the final format, adding "sectorTotal"
    final_dict = {}
    for country_code, sector_dict in breakdown.items():
        final_dict[country_code] = {}
        for sector_name, subsectors_dict in sector_dict.items():
            # Compute total
            sector_total = sum(subsectors_dict.values())
            # Convert the inner defaultdict to a normal dict
            normal_sub_dict = dict(subsectors_dict)
            # Add the total
            normal_sub_dict["sectorTotal"] = sector_total
            # Assign
            final_dict[country_code][sector_name] = normal_sub_dict

    return final_dict

def save_json(data, filename):
    """ Utility to save data (dict or list) as pretty-printed JSON. """
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    # 1) Load the data
    records = load_simplified_emissions(INPUT_FILE)

    # 2) Net emissions by country
    net_emissions = calculate_net_emissions(records)
    save_json(net_emissions, NET_OUTPUT)
    print(f"Saved net emissions to '{NET_OUTPUT}'")

    # 3) Gross emissions by country
    gross_emissions = calculate_gross_emissions(records)
    save_json(gross_emissions, GROSS_OUTPUT)
    print(f"Saved gross emissions to '{GROSS_OUTPUT}'")

    # 4) Subsector breakdown
    subsector_data = build_subsector_breakdown(records)
    save_json(subsector_data, BREAKDOWN_OUTPUT)
    print(f"Saved subsector breakdown to '{BREAKDOWN_OUTPUT}'")
