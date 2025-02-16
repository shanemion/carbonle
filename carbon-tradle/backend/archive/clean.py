import json
import logging

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

input_filename = "emission_data_all.json"
output_filename = "filtered_emission_data_all.json"

def filter_emission_list(emission_list):
    """
    Filters a list of emission objects by removing entries where both AssetCount and Emissions are 0.
    """
    return [
        entry
        for entry in emission_list
        if not (entry.get("AssetCount", 0) == 0 and entry.get("Emissions", 0) == 0)
    ]

def filter_nested_data(data):
    """
    Assumes data is structured as:
      {
          "CountryName": {
              "Sector": {
                  "Subsector": {
                      "CountryCode": [ list of emission objects ]
                  },
                  ...
              },
              ...
          },
          ...
      }
    Iterates over all emission lists and filters them.
    """
    for country, sectors in data.items():
        logging.debug(f"Processing country: {country}")
        for sector, subsectors in sectors.items():
            logging.debug(f"  Processing sector: {sector}")
            for subsector, country_codes in subsectors.items():
                logging.debug(f"    Processing subsector: {subsector}")
                for code, emissions in country_codes.items():
                    original_count = len(emissions)
                    filtered_emissions = filter_emission_list(emissions)
                    new_count = len(filtered_emissions)
                    logging.debug(f"      Country code {code}: {original_count} entries -> {new_count} entries after filtering")
                    country_codes[code] = filtered_emissions
    return data

def main():
    # Load the original emission data
    try:
        with open(input_filename, "r") as infile:
            data = json.load(infile)
        logging.info(f"Loaded data from '{input_filename}'.")
    except Exception as e:
        logging.error(f"Error reading '{input_filename}': {e}")
        return

    # Filter out emission entries where AssetCount and Emissions are 0
    filtered_data = filter_nested_data(data)

    # Write the filtered data to a new file
    try:
        with open(output_filename, "w") as outfile:
            json.dump(filtered_data, outfile, indent=4)
        logging.info(f"Filtered data written to '{output_filename}' successfully.")
    except Exception as e:
        logging.error(f"Error writing to '{output_filename}': {e}")

if __name__ == "__main__":
    main()
