// src/components/CarbonTreemapNest2.js
import React, { useState, useEffect } from 'react';
import { Treemap, Tooltip } from 'recharts';

/**
 * A palette for each “level” of nesting.
 * - At root level (0), we use LEVEL_COLORS[0].
 * - Drilling down 1 level => LEVEL_COLORS[1], etc.
 */
const LEVEL_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffbb28',
  '#ffc658',
  '#ff8042',
];

/**
 * Recursively set `node.color = color` for this node and all descendants.
 */
function colorEntireSubtree(node, color) {
  node.color = color;
  if (node.children) {
    node.children.forEach((child) => {
      colorEntireSubtree(child, color);
    });
  }
}

/**
 * A custom cell renderer for the nested treemap.
 * - We rely on node.data.color as the fill color.
 * - We provide “click to drill down” if it has children.
 */
function renderCustomizedNestContent(props) {
  const {
    x,
    y,
    width,
    height,
    name,
    value,
    payload,
    onClick,
  } = props;

  if (!payload || !payload.data) {
    return null; // skip if payload is missing
  }

  const fill = payload.data.color || '#ccc';
  const fontSize = Math.max(6, Math.min(width, height) / 15);
  const hasChildren = !!(payload.children && payload.children.length > 0);

  return (
    <g
      onClick={() => {
        if (onClick && hasChildren) {
          onClick(payload); // pass the node’s data to the click handler
        }
      }}
      style={{ cursor: hasChildren ? 'pointer' : 'default' }}
    >
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
 * CarbonTreemapNest2:
 *  - Shows a nested treemap for `targetCountry` from file_hierarchical.json.
 *  - At each drill-down level, the entire subtree is forced to one color,
 *    overriding any higher-level colors.
 */
function CarbonTreemapNest2({ targetCountry, hideCountryName = false }) {
  // The loaded JSON object, e.g. { CHN: {...}, USA: {...}, etc. }
  const [countryData, setCountryData] = useState(null);

  // The current node we’re displaying (starts as the entire country).
  const [currentNode, setCurrentNode] = useState(null);

  // Stack of ancestors (breadcrumb) to allow “Back” navigation.
  const [breadcrumb, setBreadcrumb] = useState([]);

  // Which drill level we’re on (0 = root, 1 = child, etc.)
  const [level, setLevel] = useState(0);

  // Fetch the hierarchical JSON on mount.
  useEffect(() => {
    async function fetchData() {
      try {
        // Adjust the path to your real file location
        const response = await fetch('/data/file_hierarchical.json');
        const data = await response.json();
        setCountryData(data);
      } catch (error) {
        console.error('Error fetching nested data:', error);
      }
    }
    fetchData();
  }, []);

  // Whenever countryData or targetCountry changes, set up the root node
  useEffect(() => {
    if (!countryData || !targetCountry) {
      setCurrentNode(null);
      setBreadcrumb([]);
      setLevel(0);
      return;
    }

    // Convert name -> code, if needed
    const nameToCode = {
      China: 'CHN',
      'United States': 'USA',
      India: 'IND',
      Brazil: 'BRA',
      Russia: 'RUS',
    };
    const code = nameToCode[targetCountry] || targetCountry.toUpperCase();

    const root = countryData[code];
    if (root) {
      // Clone so we can override color
      const cloned = JSON.parse(JSON.stringify(root));
      // color the entire root level with LEVEL_COLORS[0]
      colorEntireSubtree(cloned, LEVEL_COLORS[0]);

      setCurrentNode(cloned);
      setBreadcrumb([]);
      setLevel(0);
    } else {
      // If we can’t find that code, just clear
      setCurrentNode(null);
      setBreadcrumb([]);
      setLevel(0);
    }
  }, [countryData, targetCountry]);

  /**
   * Drill down handler: 
   *  - Save the current node in breadcrumb.
   *  - Increase the level => pick next color.
   *  - color the entire child subtree with that color, set as currentNode.
   */
  const handleDrillDown = (payload) => {
    if (!payload || !payload.children || payload.children.length === 0) return;

    setBreadcrumb((prev) => [...prev, currentNode]);
    const nextLevel = level + 1;
    setLevel(nextLevel);

    const clonedChild = JSON.parse(JSON.stringify(payload));
    const colorIndex = nextLevel % LEVEL_COLORS.length;
    colorEntireSubtree(clonedChild, LEVEL_COLORS[colorIndex]);

    setCurrentNode(clonedChild);
  };

  // Step back one level
  const handleBack = () => {
    if (breadcrumb.length === 0) return;

    const prevLevel = level - 1 >= 0 ? level - 1 : 0;
    setLevel(prevLevel);

    const newBreadcrumb = [...breadcrumb];
    const previousNode = newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);
    setCurrentNode(previousNode);
  };

  if (!currentNode) {
    return (
      <div>
        {targetCountry ? `Loading nested data for ${targetCountry}...` : 'Select a country!'}
      </div>
    );
  }

  // Recharts Treemap expects an array
  const dataArray = [currentNode];

  return (
    <div style={{ width: 1000, margin: '0 auto', padding: '1rem' }}>
      {!hideCountryName && (
        <h2>Nested Treemap (Single Color per Level) for {targetCountry}</h2>
      )}

      {breadcrumb.length > 0 && (
        <button onClick={handleBack} style={{ marginBottom: '1rem' }}>
          Back
        </button>
      )}

      <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
        <Treemap
          width={1000}
          height={600}
          data={dataArray}
          dataKey="value"
          nameKey="name"
          content={(props) =>
            renderCustomizedNestContent({ ...props, onClick: handleDrillDown })
          }
        >
          <Tooltip />
        </Treemap>
      </div>
    </div>
  );
}

export default CarbonTreemapNest2;
