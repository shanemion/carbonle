import React, { useState, useEffect } from 'react';
import { Treemap, Tooltip } from 'recharts';

// Define specific colors for known sectors
const sectorColors = {
  Energy: '#4287f5',
  Industrial: '#42f54e',
  Agriculture: '#f5a442',
  Waste: '#f54242',
  'Land-Use Change and Forestry': '#9942f5',
  'International transport': '#f542f2',
  Other: '#42f5f2',
};

const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d',
  '#a4de6c', '#d0ed57', '#ffc658', '#ff8042', '#ffbb28',
];

const renderCustomizedContent = (props) => {
  const { x, y, width, height, index, name, payload, onClick } = props;

  const fill =
    sectorColors[name] ||
    (payload?.data?.color ? payload.data.color : COLORS[index % COLORS.length]);

  const fontSize = Math.max(6, Math.min(width, height) / 15);
  const hasChildren = !!(payload?.children && payload.children.length > 0);

  return (
    <g
      onClick={() => {
        if (onClick && payload) {
          onClick(payload);
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
          {name}
        </text>
      )}
    </g>
  );
};

function CarbonTreemapNest({ targetCountry, hideCountryName = false }) {
  const [emissionsData, setEmissionsData] = useState(null);
  const [nestedTreeData, setNestedTreeData] = useState(null);
  const [flatTreeData, setFlatTreeData] = useState(null);
  const [currentTree, setCurrentTree] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  
  // Common sectors list
  const [allSectors, setAllSectors] = useState([]);
  
  // Separate states for nested and flat filters, but they'll be synced
  const [selectedSectorsNested, setSelectedSectorsNested] = useState({});
  const [selectedSectorsFlat, setSelectedSectorsFlat] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/file_hierarchical.json');
        const data = await response.json();
        setEmissionsData(data);
      } catch (error) {
        console.error('Error fetching JSON data:', error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (emissionsData && targetCountry) {
        const countryNameToCode = {
            Afghanistan: 'AFG',
            Angola: 'AGO',
            Albania: 'ALB',
            Andorra: 'AND',
            Argentina: 'ARG',
            Armenia: 'ARM',
            'Antigua and Barbuda': 'ATG',
            Australia: 'AUS',
            Austria: 'AUT',
            Azerbaijan: 'AZE',
            Burundi: 'BDI',
            Belgium: 'BEL',
            Benin: 'BEN',
            'Burkina Faso': 'BFA',
            Bangladesh: 'BGD',
            Bulgaria: 'BGR',
            Bahrain: 'BHR',
            Bahamas: 'BHS',
            'Bosnia and Herzegovina': 'BIH',
            Belarus: 'BLR',
            Belize: 'BLZ',
            Bolivia: 'BOL',
            Brazil: 'BRA',
            Barbados: 'BRB',
            Brunei: 'BRN',
            Bhutan: 'BTN',
            Botswana: 'BWA',
            'Central African Republic': 'CAF',
            Canada: 'CAN',
            Chile: 'CHL',
            China: 'CHN',
            'Ivory Coast': 'CIV',
            Cameroon: 'CMR',
            'Democratic Republic of the Congo': 'COD',
            Colombia: 'COL',
            Comoros: 'COM',
            'Cape Verde': 'CPV',
            'Costa Rica': 'CRI',
            Cuba: 'CUB',
            Cyprus: 'CYP',
            'Czech Republic': 'CZE',
            Djibouti: 'DJI',
            Dominica: 'DMA',
            Denmark: 'DNK',
            'Dominican Republic': 'DOM',
            Algeria: 'DZA',
            Croatia: 'HRV',
            Cambodia: 'KHM',
            Chad: 'TCD',
            Germany: 'DEU',
            Ecuador: 'ECU',
            Egypt: 'EGY',
            Eritrea: 'ERI',
            Estonia: 'EST',
            Ethiopia: 'ETH',
            Finland: 'FIN',
            Fiji: 'FJI',
            France: 'FRA',
            Gabon: 'GAB',
            Georgia: 'GEO',
            Ghana: 'GHA',
            Guinea: 'GIN',
            Gambia: 'GMB',
            'Guinea-Bissau': 'GNB',
            'Equatorial Guinea': 'GNQ',
            Greece: 'GRC',
            Grenada: 'GRD',
            Guatemala: 'GTM',
            Guyana: 'GUY',
            Honduras: 'HND',
            Haiti: 'HTI',
            Hungary: 'HUN',
            Indonesia: 'IDN',
            India: 'IND',
            Ireland: 'IRL',
            Iran: 'IRN',
            Iraq: 'IRQ',
            Iceland: 'ISL',
            Israel: 'ISR',
            Italy: 'ITA',
            Jamaica: 'JAM',
            Jordan: 'JOR',
            Japan: 'JPN',
            Kazakhstan: 'KAZ',
            Kenya: 'KEN',
            Kyrgyzstan: 'KGZ',
            Kiribati: 'KIR',
            Kuwait: 'KWT',
            Laos: 'LAO',
            Lebanon: 'LBN',
            Liberia: 'LBR',
            Libya: 'LBY',
            Liechtenstein: 'LIE',
            Lesotho: 'LSO',
            Lithuania: 'LTU',
            Luxembourg: 'LUX',
            Latvia: 'LVA',
            'El Salvador': 'SLV',
            Eswatini: 'SWZ',
            'Republic of the Congo': 'COG',
            Micronesia: 'FSM',
            'Saint Kitts and Nevis': 'KNA',
            'Saint Lucia': 'LCA',
            Morocco: 'MAR',
            Moldova: 'MDA',
            Madagascar: 'MDG',
            Maldives: 'MDV',
            Mexico: 'MEX',
            'North Macedonia': 'MKD',
            Mali: 'MLI',
            Malta: 'MLT',
            Myanmar: 'MMR',
            Montenegro: 'MNE',
            Mongolia: 'MNG',
            Mozambique: 'MOZ',
            Mauritania: 'MRT',
            Mauritius: 'MUS',
            Malawi: 'MWI',
            Malaysia: 'MYS',
            Namibia: 'NAM',
            Niger: 'NER',
            Nigeria: 'NGA',
            Nicaragua: 'NIC',
            Niue: 'NIU',
            Netherlands: 'NLD',
            Norway: 'NOR',
            Nepal: 'NPL',
            Nauru: 'NRU',
            'New Zealand': 'NZL',
            Oman: 'OMN',
            Pakistan: 'PAK',
            Panama: 'PAN',
            Peru: 'PER',
            Philippines: 'PHL',
            Palau: 'PLW',
            'Papua New Guinea': 'PNG',
            Poland: 'POL',
            'North Korea': 'PRK',
            Portugal: 'PRT',
            Paraguay: 'PRY',
            Qatar: 'QAT',
            Romania: 'ROU',
            Russia: 'RUS',
            Rwanda: 'RWA',
            'Saudi Arabia': 'SAU',
            'São Tomé and Príncipe': 'STP',
            'Saint Vincent and the Grenadines': 'VCT',
            Samoa: 'WSM',
            'United Arab Emirates': 'ARE',
            Switzerland: 'CHE',
            Spain: 'ESP',
            'United Kingdom': 'GBR',
            'South Korea': 'KOR',
            'Sri Lanka': 'LKA',
            Sudan: 'SDN',
            Senegal: 'SEN',
            Singapore: 'SGP',
            'Solomon Islands': 'SLB',
            'Sierra Leone': 'SLE',
            Somalia: 'SOM',
            Serbia: 'SRB',
            'South Sudan': 'SSD',
            Suriname: 'SUR',
            Slovakia: 'SVK',
            Slovenia: 'SVN',
            Sweden: 'SWE',
            Seychelles: 'SYC',
            Syria: 'SYR',
            Togo: 'TGO',
            Thailand: 'THA',
            Tajikistan: 'TJK',
            Turkmenistan: 'TKM',
            'Timor-Leste': 'TLS',
            Tonga: 'TON',
            'Trinidad and Tobago': 'TTO',
            Tunisia: 'TUN',
            Turkey: 'TUR',
            Tuvalu: 'TUV',
            Tanzania: 'TZA',
            Uganda: 'UGA',
            Ukraine: 'UKR',
            Uruguay: 'URY',
            'United States': 'USA',
            Uzbekistan: 'UZB',
            Venezuela: 'VEN',
            Vietnam: 'VNM',
            Vanuatu: 'VUT',
            Yemen: 'YEM',
            'South Africa': 'ZAF',
            Zambia: 'ZMB',
            Zimbabwe: 'ZWE'
        };
        

      const code = countryNameToCode[targetCountry] || targetCountry.toUpperCase();
      const countryTree = emissionsData[code];

      if (countryTree?.children?.length > 0) {
        const sortedChildren = [...countryTree.children].sort((a, b) => b.value - a.value);
        
        const coloredChildren = sortedChildren.map((child, index) => {
          const color = sectorColors[child.name] || COLORS[index % COLORS.length];
          const assignColor = (node, color) => {
            node.color = color;
            if (node.children) {
              node.children.forEach((c) => assignColor(c, color));
            }
          };
          assignColor(child, color);
          return child;
        });

        const nestedData = {
          name: countryTree.name,
          children: coloredChildren,
        };
        setNestedTreeData(nestedData);

        const flatData = coloredChildren.map((sector) => ({
          name: sector.name,
          value: sector.value,
          color: sector.color,
        }));
        setFlatTreeData([{ name: 'Sectors', children: flatData }]);

        setCurrentTree(nestedData);
        setBreadcrumb([]);

        const sectorNames = coloredChildren.map((child) => child.name);
        setAllSectors(sectorNames);

        // Initialize both filter sets with the same values
        const initialSelections = {};
        sectorNames.forEach((name) => {
          initialSelections[name] = !(
            name === 'Total excluding LUCF' || name === 'Total including LUCF'
          );
        });
        setSelectedSectorsNested(initialSelections);
        setSelectedSectorsFlat(initialSelections);
      }
    }
  }, [targetCountry, emissionsData]);

  const handleNodeClick = (node) => {
    if (node.children && node.children.length > 0) {
      setBreadcrumb((prev) => [...prev, currentTree]);
      setCurrentTree(node);
    }
  };

  const handleBack = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = [...breadcrumb];
      const previousTree = newBreadcrumb.pop();
      setBreadcrumb(newBreadcrumb);
      setCurrentTree(previousTree);
    }
  };

  // Synchronized checkbox handlers
  const handleNestedCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedSectorsNested((prev) => ({ ...prev, [name]: checked }));
    setSelectedSectorsFlat((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFlatCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedSectorsFlat((prev) => ({ ...prev, [name]: checked }));
    setSelectedSectorsNested((prev) => ({ ...prev, [name]: checked }));
  };

  // Filter both nested and flat data based on their respective filters
  let filteredNestedData = null;
  if (currentTree) {
    const filterTree = (node) => {
      if (!node.children) return node;
      
      const filteredChildren = node.children
        .filter(child => selectedSectorsNested[child.name] !== false)
        .map(filterTree);
      
      return {
        ...node,
        children: filteredChildren,
      };
    };
    
    filteredNestedData = filterTree(currentTree);
  }

  let filteredFlatData = null;
  if (flatTreeData && flatTreeData.length > 0) {
    filteredFlatData = [{
      name: 'Sectors',
      children: flatTreeData[0].children.filter(
        child => selectedSectorsFlat[child.name] === true
      ),
    }];
  }

  const fullWidth = 1000;
  const fullHeight = 500;

  return (
    <div style={{ width: fullWidth, margin: '0 auto', padding: '1rem' }}>
     
        {hideCountryName ? (
            <h2></h2>
        ) : (
            <h2>Climate Trace Data</h2>
        )}
        {/* <h2>Climate Trace data</h2> */}
      

      {breadcrumb.length > 0 && (
        <button onClick={handleBack} style={{ marginBottom: '1rem' }}>
          Back
        </button>
      )}


      {/* Flat Treemap Section */}
      <div style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
        <h3>Flat Treemap</h3>
        <div style={{ marginBottom: '1rem' }}>
          {/* <h4>Flat Treemap Filters</h4> */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {allSectors.map((sectorName) => (
              <label key={`flat-${sectorName}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name={sectorName}
                  checked={!!selectedSectorsFlat[sectorName]}
                  onChange={handleFlatCheckboxChange}
                  style={{ marginRight: '4px' }}
                />
                {sectorName}
              </label>
            ))}
          </div>
        </div>
        {filteredFlatData ? (
          <Treemap
            width={fullWidth}
            height={fullHeight}
            gap={2}
            data={filteredFlatData}
            dataKey="value"
            nameKey="name"
            stroke="#fff"
            content={renderCustomizedContent}
          >
            <Tooltip />
          </Treemap>
        ) : (
          <p>Loading flat chart...</p>
        )}
      </div>

      {/* Nested Treemap Section */}
      <div style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '2rem' }}>
        <h3>Nested Treemap</h3>
        <div style={{ marginBottom: '1rem' }}>
          {/* <h4>Nested Treemap Filters</h4> */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {allSectors.map((sectorName) => (
              <label key={`nested-${sectorName}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name={sectorName}
                  checked={!!selectedSectorsNested[sectorName]}
                  onChange={handleNestedCheckboxChange}
                  style={{ marginRight: '4px' }}
                />
                {sectorName}
              </label>
            ))}
          </div>
        </div>
        {filteredNestedData ? (
          <Treemap
            width={fullWidth}
            height={fullHeight}
            gap={2}
            data={[filteredNestedData]}
            dataKey="value"
            nameKey="name"
            stroke="#fff"
            content={(props) => renderCustomizedContent({ ...props, onClick: handleNodeClick })}
          >
            <Tooltip />
          </Treemap>
        ) : (
          <p>Loading nested chart...</p>
        )}
      </div>

    </div>
  );
}

export default CarbonTreemapNest;