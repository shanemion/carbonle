// src/components/CarbonTreemap.js
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Treemap, Tooltip } from 'recharts';

// Define a color palette for the cells.
const COLORS = [
  '#8884d8',
  '#83a6ed',
  '#8dd1e1',
  '#82ca9d',
  '#a4de6c',
  '#d0ed57',
  '#ffc658',
  '#ff8042',
  '#ffbb28',
];

// Custom renderer for each cell in the treemap.
const renderCustomizedContent = (props) => {
  const { x, y, width, height, index, name, value } = props;
  const fill = COLORS[index % COLORS.length];

  // Increase the minimum font size to improve legibility
  const fontSize = Math.max(8, Math.min(width, height) / 10);

  // Only show text if the rectangle is large enough
  const showText = width > 50 && height > 20;

  return (
    <g>
      {/* Draw the colored rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#fff"
        fill={fill}
      />

      {/* Render plain black text if the rectangle is big enough */}
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000"
          fontSize={fontSize}
        >
          {name} ({value})
        </text>
      )}
    </g>
  );
};



function CarbonTreemap({ targetCountry, hideCountryName = false }) {
  const [allSectors, setAllSectors] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/emissions.csv');
        const csvText = await response.text();
        console.log('Loaded CSV data:', csvText);

        const results = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
        });

        // Filter rows for the given country with a defined Sector
        const filteredRows = results.data.filter(
          (row) =>
            row.Country &&
            row.Country.toLowerCase() === targetCountry.toLowerCase() &&
            row.Sector
        );

        // Map rows to an array of sector objects using the 2021 column
        const sectors = filteredRows.map((row) => ({
          name: row.Sector,
          value: Number(row['2021']) || 0,
        }));

        setAllSectors(sectors);

        // Initialize each sector as selected except "Total excluding LUCF" & "Total including LUCF"
        const initialSelections = {};
        sectors.forEach((sector) => {
          initialSelections[sector.name] = !(
            sector.name === 'Total excluding LUCF' ||
            sector.name === 'Total including LUCF'
          );
        });
        setSelectedSectors(initialSelections);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    }

    fetchData();
  }, [targetCountry]);

  // Filter sectors based on checkbox selections
  const filteredSectors = allSectors.filter(
    (sector) => selectedSectors[sector.name]
  );

  // Build the hierarchical data for the treemap
  const treeData = [
    {
      name: targetCountry,
      children:
        filteredSectors.length > 0
          ? filteredSectors
          : [{ name: 'Placeholder Sector', value: 100 }],
    },
  ];

  // Handler for checkbox state changes
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedSectors((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  return (
  <div style={{ width: '1000px', margin: '0 auto', padding: '1rem' }}>

    {hideCountryName ? (
            <h2>
              Climate Watch Data for {targetCountry}
            </h2>
        ) : (
            <h2>Climate Watch Data</h2>
        )}
    

    {/* Treemap Section */}
    <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
      <Treemap
        width={1000}
        height={600}
        data={treeData}
        dataKey="value"
        nameKey="name"
        stroke="#fff"
        content={renderCustomizedContent}
      >
        <Tooltip />
      </Treemap>
    </div>

    {/* Now the checkbox section BELOW the treemap */}
    <div style={{ marginTop: '1rem' }}>
      <h3>Select Sectors</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {Object.keys(selectedSectors).length > 0 ? (
          Object.keys(selectedSectors).map((sectorName) => (
            <label key={sectorName} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name={sectorName}
                checked={selectedSectors[sectorName]}
                onChange={handleCheckboxChange}
                style={{ marginRight: '4px' }}
              />
              {sectorName}
            </label>
          ))
        ) : (
          <p>Loading sectors...</p>
        )}
      </div>
    </div>
  </div>
  );
}

export default CarbonTreemap;

