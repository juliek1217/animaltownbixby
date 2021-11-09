var console = require('console')
var http = require('http');
var fail = require('fail')
var utils = require('./utils/common.js')
// var playJson = require('./data/play.js')
//var restJson = require('./data/rest.js')

module.exports.function = function findPlay(place, rest, placeException, locationAll, location, locationDivision, currentLocation, currentDivision) {
  var locAll = locationAll;
  var loc = location;
  var locDiv = locationDivision;
  var curLoc = currentLocation;
  var curDiv = currentDivision;

  var result = [];
  var totalItems;
  
  if(String(placeException) == "Cafe") {throw fail.checkedError("Error_cafe", "Error_cafe")}

  // search items as per utterance input
  if(String(rest) == "Restarea") { // 휴게소 반려견 놀이터
  
    // if (parseInt(Object.keys(restJson.item).length) == 0) { throw fail.checkedError("Error_api", "Error_api") }
    // totalItems = Object.keys(restJson.item).length;
    let apiUrl = 'https://juliek1217.github.io/animaltown/rest.json';
    // API error handling
    try {
      var restJson = http.getUrl(apiUrl,{format: 'json'});
      totalItems = Object.keys(restJson.item).length;
    } catch (error) {
      console.log("Error: " + restJson);
      throw fail.checkedError(restJson, "Error_api");
    }

    if(locAll) { // utterance input case1: locAll (전국 리스트)
      if(totalItems > 100) {
        for (var i = 0; i < 100; i++ ) {
          var item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, restJson.item[i], '전국', totalItems, '\n전체 검색 결과 중 100개를 보여드릴게요.');
          result.push(item);
        }
      }
      else {
        for (var i = 0; i < totalItems; i++ ) {
          var item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, restJson.item[i], '전국', totalItems, null);
          result.push(item);
        }
      }
      
    }
    else if(loc) { // utterance input case 2: loc (landmark < 동 < 구 < 시 < 도)
      if (loc.placeCategory == "administrative-region" || loc.placeCategory == "city-town-village" || loc.placeCategory == "street-square"){ // 동 < 구 < 시 < 도 검색
        result = createResultList_Region(place, rest, locAll, loc, locDiv, curLoc, curDiv, restJson.item, totalItems);
      }
      else { // Landmark 검색
       result = createResultList_UsingCoords(place, rest, locAll, loc, locDiv, curLoc, curDiv, restJson.item, totalItems);
      }
    }
    else {  // utterance input case 3: 현재위치 curLoc (no input or 근처 or 여기)
      result = createResultList_UsingCoords(place, rest, locAll, loc, locDiv, curLoc, curDiv, restJson.item, totalItems);
    }
  }  // end of rest
  else if(String(place) == "Play") {

    // if (parseInt(Object.keys(playJson.item).length) == 0) { throw fail.checkedError("Error_api", "Error_api") }
    // totalItems = Object.keys(playJson.item).length;
    let apiUrl = 'https://juliek1217.github.io/animaltown/play.json';
    // API error handling
    try {
      var playJson = http.getUrl(apiUrl,{format: 'json'});
      totalItems = Object.keys(playJson.item).length;
    } catch (error) {
      console.log("Error: " + playJson);
      throw fail.checkedError(playJson, "Error_api");
    }

    if(locAll) { // utterance input case1: locAll (전국 리스트)
      if(totalItems > 100) {
        for (var i = 0; i < 100; i++ ) {
          var item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, playJson.item[i], '전국', totalItems, '\n전체 검색 결과 중 100개를 보여드릴게요.');
          result.push(item);
        }
      }
      else {
        
        for (var i = 0; i < totalItems; i++ ) {
          var item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, playJson.item[i], '전국', totalItems, null);
          result.push(item);
        }
      }
    }
    else if(loc) { // utterance input case 2: loc (landmark < 동 < 구 < 시 < 도)
      if (loc.placeCategory == "administrative-region" || loc.placeCategory == "city-town-village" || loc.placeCategory == "street-square"){ // 동 < 구 < 시 < 도 검색
        result = createResultList_Region(place, rest, locAll, loc, locDiv, curLoc, curDiv, playJson.item, totalItems);
      }
      else { // Landmark 검색
       result = createResultList_UsingCoords(place, rest, locAll, loc, locDiv, curLoc, curDiv, playJson.item, totalItems);
      }
    }
    else {  // utterance input case 3: 현재위치 curLoc (no input or 근처 or 여기)
      result = createResultList_UsingCoords(place, rest, locAll, loc, locDiv, curLoc, curDiv, playJson.item, totalItems);
    }
  }
  else { throw fail.checkedError("Error_no_service", "Error_no_service") }

  if (result.length == 0) { throw fail.checkedError("Error_no_result", "Error_no_result") }
  return result;
}


//=====================================common functions=======================================
/* 
지역명으로 검색 (도 시 동 구 군)
*/
function createResultList_Region(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, totalItems){
  var result = [];
  var itemArr = [];
  // 발화지역
  var dialog_locName = loc.point.userFriendlyName; // 발화인풋-찾는 지역 
  var locality = String(locDiv.locality); // 시
  var subLocalityOne = String(locDiv.subLocalityOne); // 구
  var subLocalityTwo = String(locDiv.subLocalityTwo); // 동

  if (locality == '제주시') { locality = '제주특별자치도';}
  if (dialog_locName == '서울시') { locality = '서울특별시'; }
  else if (dialog_locName == '경기도') { locality = '경기도'; }
  else if (dialog_locName == '강원도') { locality = '강원도'; }
  else if (dialog_locName == '충청남도') { locality = '충청남도'; }
  else if (dialog_locName == '충청북도') { locality = '충청북도'; }
  else if (dialog_locName == '전라북도') { locality = '전라북도'; }
  else if (dialog_locName == '전라남도') { locality = '전라남도'; }
  else if (dialog_locName == '경상북도') { locality = '경상북도'; }
  else if (dialog_locName == '경상남도') { locality = '경상남도'; }


  if(dialog_locName == locality ){ // 시 검색
    createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, null, null);
  }
  else if(dialog_locName == subLocalityOne){ // 구 검색
    createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, subLocalityOne, null);
  }
  else if(dialog_locName == subLocalityTwo){ // 동 검색
    createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, subLocalityOne, subLocalityTwo);
  }
  else { // have to split the dialog_locName => 천안시[서북구]
    const locNameArrLoc = dialog_locName.split(locality);
    const locNameArrOne = dialog_locName.split(subLocalityOne);
    const locNameArrTwo = dialog_locName.split(subLocalityTwo);
    var splitedLocName;

    for(var i=0; i < locNameArrLoc.length; i++){
      if(locNameArrLoc[i] == locality || locNameArrLoc[i] == subLocalityOne || locNameArrLoc[i] == subLocalityTwo ){
        splitedLocName = locNameArrLoc[i];
      }
    }
    if(splitedLocName == null) {
      for(var i=0; i < locNameArrOne.length; i++){
        if(locNameArrOne[i] == locality || locNameArrOne[i] == subLocalityOne || locNameArrOne[i] == subLocalityTwo ){
          splitedLocName = locNameArrOne[i]
        }
      }
    }
    else {
      for(var i=0; i < locNameArrTwo.length; i++){
        if(locNameArrTwo[i] == locality || locNameArrTwo[i] == subLocalityOne || locNameArrTwo[i] == subLocalityTwo ){
          splitedLocName = locNameArrTwo[i]
        }
      }
    }

    if(splitedLocName == locality){ // 시 검색
      createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, null, null);
    }
    else if(splitedLocName == subLocalityOne){
      createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, subLocalityOne, null);
    }
    else if(splitedLocName == subLocalityTwo){
      createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, subLocalityOne, subLocalityTwo);
    }
  }

  // assert the list size is valid(overflow) and get the valid list 
  result = getValidList(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName);
  
  return result;
}

/*
createItemArr
*/
function createResultList_Region_helper(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, totalItems, locality, subLocalityOne, subLocalityTwo){
  if(subLocalityTwo && subLocalityOne && locality){
    for (var i = 0; i < totalItems; i++) {
      if (apiResultArr[i].properties.road.includes(locality) || apiResultArr[i].properties.parcel.includes(locality)) {
        if(apiResultArr[i].properties.road.includes(subLocalityOne) || apiResultArr[i].properties.parcel.includes(subLocalityOne)){
          if(apiResultArr[i].properties.road.includes(subLocalityTwo) || apiResultArr[i].properties.parcel.includes(subLocalityTwo)){
          itemArr.push(apiResultArr[i]);
          }
        }
      }
    }
  }
  else if(subLocalityOne && locality){
    for (var i = 0; i < totalItems; i++) {
      if (apiResultArr[i].properties.road.includes(locality) || apiResultArr[i].properties.parcel.includes(locality)) {
        if(apiResultArr[i].properties.road.includes(subLocalityOne) || apiResultArr[i].properties.parcel.includes(subLocalityOne)){
          itemArr.push(apiResultArr[i]);
        }
      }
    }
  }
  else if(locality){
    for (var i = 0; i < totalItems; i++) {
      if(apiResultArr[i].properties.road.includes(locality) || apiResultArr[i].properties.parcel.includes(locality)){
        itemArr.push(apiResultArr[i]);
      }
    }
  }

  return itemArr;
}


/* 
좌표값에서 10km 이내 지역 검색
*/
function createResultList_UsingCoords(place, rest, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, totalItems){
  var result = [];
  var itemArr = [];
  var radius;
  var kmRange;
  var dialog_locName;
  if(rest){kmRange = 100.0}
  else if(String(place) == "Rest"){kmRange = 20.0}
  else {kmRange = 30.0} // just in case

  // iterate all items in api array to search for places
  if(loc){
    dialog_locName = loc.point.userFriendlyName; // 발화인풋-찾는 지역
    for (var i = 0; i < totalItems; i++) {
      radius = utils.isValidRadius(loc.point.longitude, loc.point.latitude, apiResultArr[i].geometry.coordinates[0], apiResultArr[i].geometry.coordinates[1], kmRange);
      if (radius) { itemArr.push(apiResultArr[i]); }
    }
    result = getValidList(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName+" 근처 반경 "+parseInt(kmRange)+'km 내');
  }
  else {
    for (var i = 0; i < totalItems; i++) {
      radius = utils.isValidRadius(curLoc.longitude, curLoc.latitude, apiResultArr[i].geometry.coordinates[0], apiResultArr[i].geometry.coordinates[1], kmRange);
      if (radius) { itemArr.push(apiResultArr[i]); }
    }
    result = getValidList(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr, '현재위치 '+parseInt(kmRange)+'km 내');
  }

  return result;
}

/* 
get valid number of items: to prevent overflow (list size < 100))
*/
function getValidList(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName) {
  var list = [];
  var item;
  var dialog_itemCount = itemArr.length;
  if(dialog_itemCount > 0){
    if(dialog_itemCount > 100) {
      for (var i = 0; i < dialog_itemCount && i < 100; i++) {
        item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr[i], dialog_locName, dialog_itemCount, '\n전체 검색 결과 중 100개를 보여드릴게요.');
        list.push(item);
      }
    }
    else {
      for (var i = 0; i < itemArr.length; i++) {
        item = mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, itemArr[i], dialog_locName, dialog_itemCount, null);
        list.push(item);
      }
    }
  }
  return list;
}

/* 
Data mapping
*/
function mapData(place, rest, locAll, loc, locDiv, curLoc, curDiv, item, dialog_locName, dialog_itemCount, dialog_exception) {
  var data;
  var infoResult
  // dialog
  var action;
  // map
  var item_coords, curLoc_coords, loc_coords;
  // list
  var icon, category, name, curLoc_distance, loc_distance, load, parcel, input_location_list;
  // details
  var phone, website, cost, days, hours, description;
  
  // map
  item_coords = { longitude: item.geometry.coordinates[0], latitude: item.geometry.coordinates[1] }
  curLoc_coords ={ longitude: curLoc.longitude, latitude: curLoc.latitude }
  curLoc_distance = utils.getDistance(curLoc.longitude, curLoc.latitude, item_coords.longitude, item_coords.latitude).toFixed(2);
  if(loc){
      loc_coords = { longitude: loc.point.longitude, latitude: loc.point.latitude }
      loc_distance = utils.getDistance(loc.point.longitude, loc.point.latitude, item_coords.longitude, item_coords.latitude).toFixed(2);
  }
  // list
  if (String(rest) == "Restarea") {
    action = "Rest";
    icon = "./images/rest_32.png";
    category = '휴게소 반려견 놀이터';
  }
  else if (String(place) == "Play") {
    action = "Play";
    icon = "./images/play_32.png";
    category = '반려견 놀이터';
  }
  name = item.properties.name;
  if(item.properties.road){ load = item.properties.road; }
  if(item.properties.parcel){ parcel = item.properties.parcel; }

  // details
  phone = item.properties.phone;
  website = item.properties.website;
  cost = item.properties.cost;
  days = item.properties.days;
  hours = item.properties.hours;
  description = item.properties.desc;

  if (loc){
    input_location_list = loc.point.userFriendlyName;
    if(input_location_list.length > 10) { input_location_list = "검색지" } // to show only string size of 10
    data = {
      infoResult: infoResult,
      action: action, // dialog
      inputLocationDialog: dialog_locName,
      itemcount: dialog_itemCount,
      exception: dialog_exception,

      point: item_coords, // map
      //myLocation: curLoc_coords,
      searchLocation: loc_coords,
      
      icon: icon, // list
      category: category,
      name: name,
      distanceSorting: loc_distance,
      distance: curLoc_distance,
      distanceLocation: loc_distance,
      inputLocation: input_location_list, // only for location search
      address: load,
      addressOld: parcel,

      phone: phone, // details
      website: website,
      cost: cost,
      days: days,
      hours: hours,
      description: description
    }
  }
  else { // 전국 & 현재위치
    data = {
      infoResult: infoResult,
      action: action, // dialog
      inputLocationDialog: dialog_locName,
      itemcount: dialog_itemCount,
      exception: dialog_exception,

      point: item_coords, // map
      myLocation: curLoc_coords,
      //searchLocation: loc_coords,

      icon: icon, // list
      category: category,
      name: name,
      distanceSorting: curLoc_distance,
      distance: curLoc_distance,
      //distanceLocation: loc_distance,
      //inputLocation: input_location_list, // only for location search
      address: load,
      addressOld: parcel,

      phone: phone, // details
      website: website,
      cost: cost,
      days: days,
      hours: hours,
      description: description
    }
  }
  return data;
}
