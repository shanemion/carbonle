// src/components/CarbonTreemapSectors.js
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Treemap, Tooltip } from 'recharts';

// A color palette for top-level children
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

/**
 * Recursively assign 'color' to node and all its descendants.
 */
function assignColorToNodeAndChildren(node, color) {
  node.color = color;
  if (node.children) {
    node.children.forEach((child) => assignColorToNodeAndChildren(child, color));
  }
}

/**
 * A simple cell renderer for Recharts Treemap.
 * - Uses `payload.data.color` if present, else picks from COLORS array.
 * - Draws a colored rectangle plus a label in the center.
 */
function renderCustomizedSectorContent(props) {
  const { x, y, width, height, index, name, value, payload } = props;

  // Use the node's color if present, otherwise fallback
  const fill =
    payload && payload.data && payload.data.color
      ? payload.data.color
      : COLORS[index % COLORS.length];

  // Basic text sizing
  const fontSize = Math.max(6, Math.min(width, height) / 15);

  // Early exit if there's no space to draw
  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" />
      {width > 50 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#000"
          fontSize={fontSize}
        >
          {name} {value ? `(${value.toLocaleString()})` : ''}
        </text>
      )}
    </g>
  );
}

/**
 * CarbonTreemapSectors:
 *  - Shows a single treemap with top-level sectors for `targetCountry`.
 *  - Each top-level sector has a unique color; deeper children inherit the same color.
 *  - No "drill-down" logic; this is just a static sector-level treemap.
 */
function CarbonTreemapSectors({ targetCountry, hideCountryName = false }) {
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    if (!targetCountry) return;

    // Example: If you prefer CSV, fetch CSV here
    // but for demonstration, let's fetch "emissions.csv" and shape data:
    async function fetchData() {
      try {
        const response = await fetch('/data/emissions.csv');
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, dynamicTyping: true });

        // Filter rows for the targetCountry
        const filteredRows = results.data.filter(
          (row) =>
            row.Country &&
            row.Country.toLowerCase() === targetCountry.toLowerCase() &&
            row.Sector
        );

        // Build an array of { name, value } from a 2021 column
        const sectors = filteredRows.map((row) => ({
          name: row.Sector,
          value: Number(row['2021']) || 0,
        }));

        // Root object for Recharts
        let root = { name: targetCountry, children: sectors };

        // Assign a unique color to each top-level child, then recursively to its children
        root.children.forEach((child, idx) => {
          const color = COLORS[idx % COLORS.length];
          assignColorToNodeAndChildren(child, color);
        });

        // Recharts Treemap wants an array at top level
        setTreeData([root]);
      } catch (err) {
        console.error('Error building sector-level treemap:', err);
        setTreeData(null);
      }
    }

    fetchData();
  }, [targetCountry]);

  if (!treeData) {
    return <div style={{ margin: '1rem' }}>Loading sector data...</div>;
  }

  return (
    <div style={{ width: 1000, margin: '0 auto', padding: '1rem' }}>
      {!hideCountryName && <h2>Sector Treemap for {targetCountry}</h2>}
      <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
        <Treemap
          width={1000}
          height={600}
          data={treeData}
          dataKey="value"
          nameKey="name"
          stroke="#fff"
          content={renderCustomizedSectorContent}
        >
          <Tooltip />
        </Treemap>
      </div>
    </div>
  );
}

export default CarbonTreemapSectors;
