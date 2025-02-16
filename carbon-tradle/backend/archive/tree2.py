import csv
import json
import logging

# Configure logging to output informational messages.
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# File paths and country settings.
INPUT_CSV = "a.csv"            # Path to your CSV file
OUTPUT_JSON = "treemap_data_flourinated_csv.json"      # Path for the hierarchical JSON output
COUNTRY_CODE = "CHN"                   # ISO3 country code to filter by
COUNTRY_NAME = "China"           # Display name for the country

def load_csv_data(filename, delimiter="\t"):
    """Loads CSV data using DictReader with the given delimiter."""
    rows = []
    with open(filename, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        for row in reader:
            rows.append(row)
    logging.info(f"Loaded {len(rows)} rows from '{filename}'.")
    return rows

def filter_country_data(rows, country_code):
    """Filter rows for which the iso3_country column matches the given country code."""
    filtered = [row for row in rows if row.get("iso3_country", "").strip() == country_code]
    logging.info(f"Filtered down to {len(filtered)} rows for country '{country_code}'.")
    return filtered

def aggregate_emissions(rows):
    """
    Groups rows by sector and subsector.
    Sums the 'emissions_quantity' values (converted to float) for each group.
    Returns a nested dictionary: { sector: { subsector: total_emissions } }.
    """
    sectors = {}
    for row in rows:
        sector = row.get("sector", "").strip()
        subsector = row.get("subsector", "").strip()
        try:
            emissions = float(row.get("emissions_quantity", 0))
        except (ValueError, TypeError):
            emissions = 0.0

        # Skip rows with missing sector/subsector info.
        if not sector or not subsector:
            continue

        if sector not in sectors:
            sectors[sector] = {}
        if subsector not in sectors[sector]:
            sectors[sector][subsector] = 0.0

        sectors[sector][subsector] += emissions
    return sectors

def build_hierarchical_tree(country_name, aggregated_data):
    """
    Constructs a hierarchical dictionary suitable for a treemap.
    The structure is:
        {
            "name": country_name,
            "value": <total emissions>,
            "children": [
                { "name": sector,
                  "value": <sector total>,
                  "children": [
                      { "name": subsector, "value": <subsector total> },
                      ...
                  ]
                },
                ...
            ]
        }
    Only sectors and subsectors with a total emission > 0 are included.
    """
    tree = {
        "name": country_name,
        "value": 0,
        "children": []
    }
    for sector, subsectors in aggregated_data.items():
        # Build a list of subsector nodes that have nonzero emissions.
        children = []
        for subsector, emission_sum in subsectors.items():
            if emission_sum > 0:
                children.append({
                    "name": subsector,
                    "value": emission_sum
                })
        if children:
            sector_total = sum(child["value"] for child in children)
            tree["children"].append({
                "name": sector,
                "value": sector_total,
                "children": children
            })
            tree["value"] += sector_total
    return tree

def main():
    # Load CSV data.
    rows = load_csv_data(INPUT_CSV, delimiter="\t")

    # Filter rows for the target country.
    country_rows = filter_country_data(rows, COUNTRY_CODE)

    # Aggregate emissions by sector and subsector.
    aggregated_data = aggregate_emissions(country_rows)

    # Build the hierarchical tree structure.
    treemap_data = build_hierarchical_tree(COUNTRY_NAME, aggregated_data)
    logging.info("Built hierarchical treemap data successfully.")

    # Write the treemap data to a JSON file.
    try:
        with open(OUTPUT_JSON, "w", encoding="utf-8") as outfile:
            json.dump(treemap_data, outfile, indent=4)
        logging.info(f"Treemap data written to '{OUTPUT_JSON}'.")
    except Exception as e:
        logging.error(f"Error writing to '{OUTPUT_JSON}': {e}")

if __name__ == "__main__":
    main()
