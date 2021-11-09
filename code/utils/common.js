
exports.isValidRadius = isValidRadius;
exports.getDistance = getDistance;

 function isValidRadius(lon, lat, lonChecking, latChecking, kmRange) { // 경도 longitude x coordinate / 위도 latitude y coordinate 
  if ((6371 * Math.acos(Math.cos(lat * Math.PI / 180) * Math.cos(latChecking * Math.PI / 180) * Math.cos(lonChecking * Math.PI / 180 - lon * Math.PI / 180) + Math.sin(lat * Math.PI / 180) * Math.sin(latChecking * Math.PI / 180))) <= kmRange) {
    return true;
  }
  else {return false;}
}


/* loc 좌표에서 다른 위치의 좌표까지 거리 계산 (in km) */
function getDistance(lon, lat, lonChecking, latChecking) {       // 경도 longitude x coordinate / 위도 latitude y coordinate 
  return (6371 * Math.acos(Math.cos(lat * Math.PI/180)*Math.cos(latChecking * Math.PI / 180) * Math.cos(lonChecking * Math.PI / 180 - lon * Math.PI / 180) + Math.sin(lat * Math.PI / 180) * Math.sin(latChecking * Math.PI / 180)))
}

