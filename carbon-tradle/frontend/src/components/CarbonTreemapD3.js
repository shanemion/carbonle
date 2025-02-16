import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

function CarbonNestedTreemapD3({ targetCountry, hideCountryName = false }) {
  const [root, setRoot] = useState(null);

  const width = 1000;
  const height = 600;

  const countryNameToCode = {
    China: 'CHN',
    'United States': 'USA',
    India: 'IND',
    Brazil: 'BRA',
    Russia: 'RUS',
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/file_hierarchical.json');
        const jsonData = await response.json();

        const code = countryNameToCode[targetCountry] || targetCountry.toUpperCase();
        const countryData = jsonData[code];

        if (!countryData) {
          console.warn(`No data for country code: ${code}`);
          return;
        }

        // 1) Build hierarchy
        const hierarchy = d3
          .hierarchy(countryData)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value);

        // 2) Compute treemap layout with increased padding
        d3.treemap()
          .size([width, height])
          .padding(10) // <-- Increase spacing here
          .round(true)(hierarchy);

        setRoot(hierarchy);
      } catch (err) {
        console.error('Error fetching / processing data:', err);
      }
    }
    fetchData();
  }, [targetCountry]);

  if (!root) {
    return <p>Loading treemap for {targetCountry}...</p>;
  }

  const allNodes = root.descendants();
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  return (
    <div style={{ width, margin: '0 auto', padding: '1rem' }}>
      {/* {!hideCountryName ? (
        <h2>Treemap by Sector for {targetCountry}</h2>
      ) : (
        <h2>Treemap by Sector</h2>
      )} */}

      <svg width={width} height={height} style={{ border: '1px solid #ccc' }}>
        {allNodes.map((node, i) => {
          const { x0, y0, x1, y1 } = node;
          const w = x1 - x0;
          const h = y1 - y0;

          return (
            <g key={i}>
              <rect
                x={x0}
                y={y0}
                width={w}
                height={h}
                fill={colorScale(node.depth)}
                stroke="#fff"
              />
              {w > 50 && h > 20 && (
                <text
                  x={x0 + w / 2}
                  y={y0 + h / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={12}
                  fill="#000"
                >
                  {node.data.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default CarbonNestedTreemapD3;
