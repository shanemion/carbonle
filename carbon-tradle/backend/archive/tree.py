import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Input and output file names.
INPUT_FILE = "filtered_emission_data.json"
OUTPUT_FILE = "treemap_data.json"

def build_treemap_data(country_name, country_data, country_code):
    """
    Builds hierarchical tree data for a given country.

    Parameters:
        country_name (str): The display name for the country (e.g. "Afghanistan")
        country_data (dict): The nested data for the country structured as:
                             { sector: { subsector: { countryCode: [ emission objects ] } } }
        country_code (str): The country code to look up in the emission arrays (e.g. "AFG")
    
    Returns:
        dict: A hierarchical tree with keys "name", "value", and "children".
    """
    tree_children = []

    for sector, subsectors in country_data.items():
        sector_children = []
        for subsector, data_by_code in subsectors.items():
            # Get the list of emission entries for this subsector.
            entries = data_by_code.get(country_code, [])
            # Sum up the emission values for this subsector.
            total_emissions = sum(entry.get("Emissions", 0) for entry in entries)
            # Only include subsector if it has a nonzero total emission.
            if total_emissions > 0:
                sector_children.append({
                    "name": subsector,
                    "value": total_emissions
                })
        # Only include the sector if it has at least one subsector with data.
        if sector_children:
            # Sum sector total from its subsectors.
            sector_total = sum(child["value"] for child in sector_children)
            tree_children.append({
                "name": sector,
                "value": sector_total,
                "children": sector_children
            })

    # Calculate overall total for the country.
    country_total = sum(child["value"] for child in tree_children)
    treemap_data = {
        "name": country_name,
        "value": country_total,
        "children": tree_children
    }
    return treemap_data

def main():
    # Set the country to process.
    # You can change these as needed.
    country_name = "China"
    country_code = "CHN"

    try:
        with open(INPUT_FILE, "r") as infile:
            data = json.load(infile)
        logging.info(f"Loaded filtered emission data from '{INPUT_FILE}'.")
    except Exception as e:
        logging.error(f"Error loading '{INPUT_FILE}': {e}")
        return

    # Check if the country exists in the data.
    if country_name not in data:
        logging.error(f"Country '{country_name}' not found in data.")
        return

    # Build the treemap data for the country.
    treemap_data = build_treemap_data(country_name, data[country_name], country_code)
    logging.info("Built treemap data successfully.")
    
    # Write the treemap data to output file.
    try:
        with open(OUTPUT_FILE, "w") as outfile:
            json.dump(treemap_data, outfile, indent=4)
        logging.info(f"Treemap data written to '{OUTPUT_FILE}'.")
    except Exception as e:
        logging.error(f"Error writing to '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    main()
