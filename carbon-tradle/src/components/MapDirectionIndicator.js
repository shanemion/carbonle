import React from 'react';

function MapDirectionIndicator({ distance, direction, proximity }) {
  return (
    <div>
      <p>Distance: {distance} km</p>
      <p>Direction: {direction}</p>
      <p>Proximity: {proximity}%</p>
    </div>
  );
}

export default MapDirectionIndicator;
