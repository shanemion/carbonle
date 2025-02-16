export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
  

export function getDirectionArrow(guessCoords, targetCoords) {
  const dLon = (targetCoords.lon - guessCoords.lon) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(targetCoords.lat * Math.PI / 180);
  const x =
    Math.cos(guessCoords.lat * Math.PI / 180) *
      Math.sin(targetCoords.lat * Math.PI / 180) -
    Math.sin(guessCoords.lat * Math.PI / 180) *
      Math.cos(targetCoords.lat * Math.PI / 180) *
      Math.cos(dLon);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  if (bearing >= 337.5 || bearing < 22.5) return "↑";
  else if (bearing < 67.5) return "↗";
  else if (bearing < 112.5) return "→";
  else if (bearing < 157.5) return "↘";
  else if (bearing < 202.5) return "↓";
  else if (bearing < 247.5) return "↙";
  else if (bearing < 292.5) return "←";
  else return "↖";
}

export function getAccuracyBoard(accuracy) {
  const numBoxes = 5;
  const scaled = accuracy * numBoxes;
  const numGreen = Math.floor(scaled);
  const remainder = scaled - numGreen;
  const numYellow = remainder >= 0.5 ? 1 : 0;
  const numEmpty = numBoxes - numGreen - numYellow;
  return "🟩".repeat(numGreen) + "🟨".repeat(numYellow) + "⬜".repeat(numEmpty);
}

export function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
