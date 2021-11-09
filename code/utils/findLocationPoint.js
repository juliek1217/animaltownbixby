// for mapPunchOut
module.exports.function = function findLocationPoint(location) {

  var point = {
    latitude: location.point.latitude,
    longitude: location.point.longitude
  }

  return {
    point: point,
    address: location.address.centroid.userFriendlyName
  }
}
