var console = require('console')
var http = require('http')
var fail = require('fail')

var Key_ChangeAddress = "" // removed

module.exports.function = function mapPunchOut (point) {
  //ex) geo:37.554998,126.970577?q=서울역
  var address = changeAddress(point);
  var result = "geo:"+point.latitude+","+point.longitude + "?q=" + address
  
  return result;
}

function changeAddress(point){
  // API error handling
  try {
     var response = http.getUrl("http://apis.vworld.kr/coord2jibun.do?x="+point.longitude+"&y="+point.latitude+"&apiKey="+Key_ChangeAddress, { format: 'xmljs' });
  } 
  catch (error) {
    console.log("Error: " + response);
    throw fail.checkedError(response, "Error_api");
  }
  return response.result.ADDR;
}



