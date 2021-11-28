var console = require('console')
var http = require('http')
var fail = require('fail')
var utils = require('./utils/common.js')
//var shelterJson = require('./data/shelter.js')

module.exports.function = function findVet(place, rest, placeException, locationAll, location, locationDivision, currentLocation, currentDivision) {
  var locAll = locationAll;
  var loc = location;
  var locDiv = locationDivision;
  var curLoc = currentLocation;
  var curDiv = currentDivision;

  var result = [];       // final return value
  var totalItems;
  
  var apiEndPoint;
  var apiQuery;
  var apiPage;
  var apiK;
  var apiUrl;
  var apiResultFirstPage;
  var apiResultArr = []; // api result array including all pages
  var pageSize;
  var pageNumItem;
  
  if(String(placeException) == "Cafe") {throw fail.checkedError("Error_cafe", "Error_cafe")}
 
  if(String(place) == "Vet"){
    pageNumItem = 1000;
    apiEndPoint = 'http://api.vworld.kr/req/search?';
    apiQuery = 'service=search&request=search&version=2.0&query=동물병원&type=place&format=json&errorformat=json&size=1000&page=';
    apiPage = '1';
    apiK = '&key='; // removed

    apiUrl = apiEndPoint + apiQuery + apiPage + apiK;
    // API error handling
    try {
      var apiResultFirstPage = http.getUrl(apiUrl,{format: 'json'});
    } catch (error) {
      console.log("Error: " + apiResultFirstPage);
      throw fail.checkedError(apiResultFirstPage, "Error_api");
    }


    //if (apiResultFirstPage.length == 0) { throw fail.checkedError("Error_api", "Error_api") }
    
    totalItems = parseInt(apiResultFirstPage.response.record.total);
    pageSize = parseInt(apiResultFirstPage.response.page.total); // number of pages

    

    if(locAll) { // utterance input case1: locAll (전국 리스트)
      if(totalItems > 100){
        for (var i = 0; i < 100; i++) {
          var item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, apiResultFirstPage.response.result.items[i], '전국', totalItems, '\n전체 검색 결과 중 100개를 보여드릴게요.');
          result.push(item);
        }
      }
      else{
        for (var i = 0; i < totalItems; i++) {
          var item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, apiResultFirstPage.response.result.items[i], '전국', totalItems, null);
          result.push(item);
        }
      }
    }
    else if(loc) { // utterance input case 2: loc (landmark < 동 < 구 < 시 < 도)
      apiResultArr.push(apiResultFirstPage);
      if(pageSize > 1){
        for (var i = 2; i < pageSize + 1; i++) {
          apiUrl = apiEndPoint + apiQuery + i.toString() + apiK;
          apiResultFirstPage = http.getUrl(apiUrl,{format: 'json'});
          apiResultArr.push(apiResultFirstPage);
        }
      }
      if (loc.placeCategory == "administrative-region" || loc.placeCategory == "city-town-village" || loc.placeCategory == "street-square"){ // 동 < 구 < 시 < 도 검색
        result = createResultList_Region(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, pageNumItem);     
      }
      else { // Landmark 검색
        result = createResultList_UsingCoords(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, pageNumItem);
      }
    }
    else {  // utterance input case 3: 현재위치 curLoc (no input or 근처 or 여기)
      apiResultArr.push(apiResultFirstPage);
      if(pageSize > 1){
        for (var i = 2; i < pageSize + 1; i++) {
          apiUrl = apiEndPoint + apiQuery + i.toString() + apiK;
          apiResultFirstPage = http.getUrl(apiUrl,{format: 'json'});
          apiResultArr.push(apiResultFirstPage);
        }
      }
      result = createResultList_UsingCoords(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, pageNumItem);
    }
  } // end of Vet
  else if(String(place) == "Shelter"){
    
    // if (parseInt(Object.keys(shelterJson.item).length) == 0) { throw fail.checkedError("Error_api", "Error_api") }
    // totalItems = parseInt(Object.keys(shelterJson.item).length);
    let apiUrl = 'https://juliek1217.github.io/animaltown/shelter.json';
    // API error handling
    try {
      var shelterJson = http.getUrl(apiUrl,{format: 'json'});
      totalItems = Object.keys(shelterJson.item).length;
    } catch (error) {
      console.log("Error: " + shelterJson);
      throw fail.checkedError(shelterJson, "Error_api");
    }

    if(locAll) { // utterance input case1: locAll (전국 리스트)
      if(totalItems > 100){
        for (var i = 0; i < 100; i++) {
          var item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, shelterJson.item[i], '전국', totalItems, '\n전체 검색 결과 중 100개를 보여드릴게요.');
          result.push(item);
        }
      }
      else{
        for (var i = 0; i < totalItems; i++) {
          var item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, shelterJson.item[i], '전국', totalItems, null);
          result.push(item);
        }
      }
    }
    else if(loc) { // utterance input case 2: loc (landmark < 동 < 구 < 시 < 도)
      if (loc.placeCategory == "administrative-region" || loc.placeCategory == "city-town-village" || loc.placeCategory == "street-square"){ // 동 < 구 < 시 < 도 검색
        result = createResultList_Region(place, locAll, loc, locDiv, curLoc, curDiv, shelterJson.item, totalItems);
      }
      else { // Landmark 검색
        result = createResultList_UsingCoords(place, locAll, loc, locDiv, curLoc, curDiv, shelterJson.item, totalItems);
      }
    }
    else {  // utterance input case 3: 현재위치 curLoc (no input or 근처 or 여기)
      result = createResultList_UsingCoords(place, locAll, loc, locDiv, curLoc, curDiv, shelterJson.item, totalItems);
    }
  }// end of Shelter
  else { throw fail.checkedError("Error_no_service", "Error_no_service") }


  // assert if the result is empty
  if (result.length == 0) { throw fail.checkedError("Error_no_result", "Error_no_result") }

  return result;
}



//=====================================common functions=======================================
/* 
지역명으로 검색 (도 시 동 구 군)
for all places
*/
function createResultList_Region(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, pageNumItem){
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
    createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, null, null);
  }
  else if(dialog_locName == subLocalityOne){ // 구 검색
    createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, subLocalityOne, null);
  }
  else if(dialog_locName == subLocalityTwo){ // 동 검색
    createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, subLocalityOne, subLocalityTwo);
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
      createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, null, null);
    }
    else if(splitedLocName == subLocalityOne){
      createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, subLocalityOne, null);
    }
    else if(splitedLocName == subLocalityTwo){
      createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, subLocalityOne, subLocalityTwo);
    }
  }

  // assert the list size is valid(overflow) and get the valid list 
  result = getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName);
  
  return result;
}


/*
createResultList_Region_helper : create result array in createResultList_Region function
*/
function createResultList_Region_helper(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, itemArr, pageNumItem, locality, subLocalityOne, subLocalityTwo){
  if(String(place) == "Vet"){
    if(subLocalityTwo && subLocalityOne && locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        var j = 0;
        while (j < pageNumItem && apiResultArr[i].response.result.items[j]) {
          if (apiResultArr[i].response.result.items[j].address.road.includes(locality) || apiResultArr[i].response.result.items[j].address.parcel.includes(locality)) {
            if(apiResultArr[i].response.result.items[j].address.road.includes(subLocalityOne) || apiResultArr[i].response.result.items[j].address.parcel.includes(subLocalityOne)){
              if(apiResultArr[i].response.result.items[j].address.road.includes(subLocalityTwo) || apiResultArr[i].response.result.items[j].address.parcel.includes(subLocalityTwo)){
                itemArr.push(apiResultArr[i].response.result.items[j]);
              }
            }
          }
          j++;
        }
      }
    }
    else if(subLocalityOne && locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        var j = 0;
        while (j < pageNumItem && apiResultArr[i].response.result.items[j]) {
          if (apiResultArr[i].response.result.items[j].address.road.includes(locality) || apiResultArr[i].response.result.items[j].address.parcel.includes(locality)) {
            if(apiResultArr[i].response.result.items[j].address.road.includes(subLocalityOne) || apiResultArr[i].response.result.items[j].address.parcel.includes(subLocalityOne)){
              itemArr.push(apiResultArr[i].response.result.items[j]);
            }
          }
          j++;
        }
      }
    }
    else if(locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        var j = 0;
        while (j < pageNumItem && apiResultArr[i].response.result.items[j]) {
          if(apiResultArr[i].response.result.items[j].address.road.includes(locality) || apiResultArr[i].response.result.items[j].address.parcel.includes(locality)){
            itemArr.push(apiResultArr[i].response.result.items[j]);
          }
          j++;
        }
      }
    }
  }
  else if(String(place) == "Shelter"){
    if(subLocalityTwo && subLocalityOne && locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        if (apiResultArr[i].careAddr.includes(locality) || apiResultArr[i].jibunAddr.includes(locality)) {
          if(apiResultArr[i].careAddr.includes(subLocalityOne) || apiResultArr[i].jibunAddr.includes(subLocalityOne)){
            if(apiResultArr[i].careAddr.includes(subLocalityTwo) || apiResultArr[i].jibunAddr.includes(subLocalityTwo)){
            itemArr.push(apiResultArr[i]);
            }
          }
        }
      }
    }
    else if(subLocalityOne && locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        if (apiResultArr[i].careAddr.includes(locality) || apiResultArr[i].jibunAddr.includes(locality)) {
          if(apiResultArr[i].careAddr.includes(subLocalityOne) || apiResultArr[i].jibunAddr.includes(subLocalityOne)){
            itemArr.push(apiResultArr[i]);
          }
        }
      }
    }
    else if(locality){
      for (var i = 0; i < apiResultArr.length; i++) {
        if(apiResultArr[i].careAddr.includes(locality) || apiResultArr[i].jibunAddr.includes(locality)){
          itemArr.push(apiResultArr[i]);
        }
      }
    }
  }

  return itemArr;
}



/* 
타겟 좌표값에서 기준 반경 이내 지역 검색
*/
function createResultList_UsingCoords(place, locAll, loc, locDiv, curLoc, curDiv, apiResultArr, pageNumItem){
  var result = [];
  var itemArr = [];
  var radius;
  var kmRange = 2.0;
  var dialog_locName;

  // iterate all items in api array to search for places
  if(String(place) == "Vet"){
    if(loc){
      dialog_locName = loc.point.userFriendlyName; // 발화인풋-찾는 지역
      for (var i = 0; i < apiResultArr.length; i++) {
        var j = 0;
        while (j < pageNumItem && apiResultArr[i].response.result.items[j]) {
          radius = utils.isValidRadius(loc.point.longitude, loc.point.latitude, apiResultArr[i].response.result.items[j].point.x, apiResultArr[i].response.result.items[j].point.y, kmRange);
          if (radius) {
            itemArr.push(apiResultArr[i].response.result.items[j]);
          }
          j++;
        }
      }
      result = getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName+" 근처 반경 "+parseInt(kmRange)+'km 내');
    }
    else {
      for (var i = 0; i < apiResultArr.length; i++) {
        var j = 0;
        while (j < pageNumItem && apiResultArr[i].response.result.items[j]) {
          radius = utils.isValidRadius(curLoc.longitude, curLoc.latitude, apiResultArr[i].response.result.items[j].point.x, apiResultArr[i].response.result.items[j].point.y, kmRange);
          if (radius) {
            itemArr.push(apiResultArr[i].response.result.items[j]);
          }
          j++;
        }
      }
      result = getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, '현재위치 '+parseInt(kmRange)+'km 내');
    }
  }
  else if(String(place) == "Shelter"){
    if(loc){
      dialog_locName = loc.point.userFriendlyName; // 발화인풋-찾는 지역
      for (var i = 0; i < apiResultArr.length; i++) {
        radius = utils.isValidRadius(loc.point.longitude, loc.point.latitude, apiResultArr[i].lng, apiResultArr[i].lat, kmRange);
        if (radius) { itemArr.push(apiResultArr[i]); }
      }
      result = getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName+" 근처 반경 "+parseInt(kmRange)+'km 내');
    }
    else {
      for (var i = 0; i < apiResultArr.length; i++) {
        radius = utils.isValidRadius(curLoc.longitude, curLoc.latitude, apiResultArr[i].lng, apiResultArr[i].lat, kmRange);
        if (radius) { itemArr.push(apiResultArr[i]); }
      }
      result = getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, '현재위치 '+parseInt(kmRange)+'km 내');
    }
  }

  return result;
}

/* 
get valid number of items: to prevent overflow (list size < 100))
*/
function getValidList(place, locAll, loc, locDiv, curLoc, curDiv, itemArr, dialog_locName) {
  var list = [];
  var item;
  var dialog_itemCount = itemArr.length;
  if(dialog_itemCount > 0){
    if(dialog_itemCount > 100) {
      for (var i = 0; i < dialog_itemCount && i < 100; i++) {
        item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, itemArr[i], dialog_locName, dialog_itemCount, '\n전체 검색 결과 중 100개를 보여드릴게요.');
        list.push(item);
      }
    }
    else {
      for (var i = 0; i < itemArr.length; i++) {
        item = mapData(place, locAll, loc, locDiv, curLoc, curDiv, itemArr[i], dialog_locName, dialog_itemCount, null);
        list.push(item);
      }
    }
  }
  return list;
}

/* 
Data mapping
*/
function mapData(place, locAll, loc, locDiv, curLoc, curDiv, item, dialog_locName, dialog_itemCount, dialog_exception) {
  var action, data, nm, icon, phone, category, input_location_list, dialog_distance, dialog_distance_location, myLocationCoords, searchLocationCoords, addr, addrOld, coords;
  var infoResult=[];
  action = String(place);
  
  if(String(place) == "Vet") {
    icon = "./images/vet_32.png";
    category = item.category;
    nm = item.title;
    coords = { longitude: item.point.x, latitude: item.point.y };
    if(item.address.road){ addr = item.address.road; };
    if(item.address.parcel){ addrOld = item.address.parcel; };
    dialog_distance = utils.getDistance(curLoc.longitude, curLoc.latitude, item.point.x, item.point.y).toFixed(2);
    myLocationCoords ={ longitude: curLoc.longitude, latitude: curLoc.latitude }
    if(loc){
      searchLocationCoords = { longitude: loc.point.longitude, latitude: loc.point.latitude }
      dialog_distance_location = utils.getDistance(loc.point.longitude, loc.point.latitude, item.point.x, item.point.y).toFixed(2);
    }
  }
  else if (String(place) == "Shelter") {
    icon = "./images/shelter_32.png";
    category = '유실유기동물 > 동물보호센터';
    nm = item.careNm;
    coords = { longitude: item.lng, latitude: item.lat };
    dialog_distance = utils.getDistance(curLoc.longitude, curLoc.latitude, coords.longitude, coords.latitude).toFixed(2);
    if(item.careAddr){ addr = item.careAddr; }
    if(item.jibunAddr){ addrOld = item.jibunAddr; }
    myLocationCoords ={ longitude: curLoc.longitude, latitude: curLoc.latitude }
    if(loc){
      searchLocationCoords = { longitude: loc.point.longitude, latitude: loc.point.latitude }
      dialog_distance_location = utils.getDistance(loc.point.longitude, loc.point.latitude, item.lng, item.lat).toFixed(2);
    }
    phone = item.careTel
  }

  if(loc) { // utterance input case 2: loc (landmark < 동 < 구 < 시 < 도)
    input_location_list = loc.point.userFriendlyName;
    if(input_location_list.length > 10) { input_location_list = "검색지" } // to show only string size of 10
    data = {
      infoResult: infoResult,
      action: action, // dialog        
      inputLocationDialog: dialog_locName,
      itemcount: dialog_itemCount,
      exception: dialog_exception,

      point: coords, // map
      //myLocation: myLocationCoords,
      searchLocation: searchLocationCoords,

      icon: icon, // list
      category: category,
      name: nm,
      distanceSorting: dialog_distance_location,
      distance: dialog_distance,
      distanceLocation: dialog_distance_location,
      inputLocation: input_location_list, // only for location search
      address: addr,
      addressOld: addrOld,
        
      phone: phone // detail
    }
  } 
  else { // 전국 & 현재위치
    data = {
      infoResult: infoResult,
      action: action, // dialog
      inputLocationDialog: dialog_locName,
      itemcount: dialog_itemCount,
      exception: dialog_exception,

      point: coords, // map
      myLocation: myLocationCoords,
      //searchLocation: searchLocationCoords,

      icon: icon, // list
      category: category,
      name: nm,
      distanceSorting: dialog_distance,
      distance: dialog_distance,
      //distanceLocation: dialog_distance_location,
      //inputLocation: input_location_list, // only for location search
      address: addr,
      addressOld: addrOld,
      
      phone: phone // details
    }
  }

  return data;
}
