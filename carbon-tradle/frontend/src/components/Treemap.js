// src/components/CountryTreemapGrid.js
import React, { useMemo } from 'react';
import { hierarchy, treemap } from 'd3-hierarchy';

// Some color palette for categories
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1',
  '#82ca9d', '#a4de6c', '#d0ed57',
  '#ffc658', '#ff8042', '#ffbb28',
];

/**
 * CountryTreemapGrid
 *  - Expects `countryData` shaped like:
 *    {
 *      name: "CHN",
 *      children: [
 *        { name: "fossil-fuel-operations", value: 1680584537, ... },
 *        { name: "manufacturing", value: 3102656828, ... },
 *        ...
 *      ]
 *    }
 *  - Filters out children with non-positive `value`.
 *  - Uses d3-hierarchy to produce a *squarified* treemap layout,
 *    similar to what you see with stock or market maps.
 */
export default function CountryTreemapGrid({ countryData }) {
  // Pull out name & children safely
  const { name, children = [] } = countryData || {};

  // 1) Filter out children that have value <= 0
  const filteredData = useMemo(() => {
    return children.filter(child => child.value > 0);
  }, [children]);

  // 2) Prepare a small hierarchical object for d3
  //    e.g. { name: "CHN", children: [ { name: "fossil", value: 123 }, ... ] }
  const dataObject = useMemo(() => {
    if (!filteredData.length) return null;
    return { name: name ?? 'Unknown', children: filteredData };
  }, [filteredData, name]);

  // 3) Run the d3 treemap layout
  //    - We fix the layout size to 800x400 in this example.
  //    - You can make it dynamic if you want.
  const treemapNodes = useMemo(() => {
    if (!dataObject) return [];

    // 3a) Create a root hierarchy
    const root = hierarchy(dataObject).sum(d => d.value);

    // 3b) Create a treemap layout function
    //     The default mode is 'd3.treemapSquarify', which tries to create 
    //     nice aspect ratios (like stock market charts).
    treemap()
      .size([800, 400]) // the overall container
      .padding(1)       // small gap between boxes
      .round(true)(root);

    // 3c) Extract final positioned leaves
    //     Each leaf has x0, y0, x1, y1 => we convert them to {x, y, width, height}
    const leaves = root.leaves().map(leaf => ({
      name: leaf.data.name,
      value: leaf.data.value,
      x: leaf.x0,
      y: leaf.y0,
      width: leaf.x1 - leaf.x0,
      height: leaf.y1 - leaf.y0,
    }));

    return leaves;
  }, [dataObject]);

  // If no valid data, show a fallback or empty
  if (!countryData || !countryData.children) {
    return <div style={{margin:'1rem 0'}}>No data passed to CountryTreemapGrid.</div>;
  }
  if (!treemapNodes.length) {
    return <div style={{margin:'1rem 0'}}>No children with positive values.</div>;
  }

  // 4) Render an absolutely-positioned grid of rectangles
  return (
    <div style={{ margin: '1rem 0' }}>
      <h3>Treemap for {name || 'No Data'}</h3>

      {/* The container in which we'll place absolutely-positioned boxes */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 400,
          border: '1px solid #ccc',
          margin: '0 auto',
        }}
      >
        {treemapNodes.map((node, i) => {
          const color = COLORS[i % COLORS.length];
          // Format large values or round small ones
          const displayValue = 
            node.value > 1e5
              ? node.value.toExponential(2)
              : Math.round(node.value);

          return (
            <div
              key={`${node.name}-${i}`}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                backgroundColor: color,
                border: '1px solid #fff',
                overflow: 'hidden',
                cursor: 'default',
              }}
              title={`${node.name}: ${node.value}`}
            >
              {/* If there's enough space, show a label */}
              {node.width > 50 && node.height > 20 && (
                <div
                  style={{
                    fontSize: Math.min(node.width, node.height) / 10,
                    color: '#000',
                    textAlign: 'center',
                    lineHeight: `${node.height}px`,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {node.name} ({displayValue})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
