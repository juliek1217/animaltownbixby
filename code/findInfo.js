var fail = require('fail')
var console = require('console')
var http = require('http');
var utils = require('./utils/common.js')
//var infoJson = require('./data/info.js')

module.exports.function = function findInfo(keyword) {
  var result = [];
  var data;
  
  keyword = String(keyword);
  
  // totalItems = parseInt(Object.keys(infoJson.item).length);
    let apiUrl = 'https://juliek1217.github.io/animaltown/info.json';
    // API error handling
    try {
      var infoJson = http.getUrl(apiUrl,{format: 'json'});
      totalItems = Object.keys(infoJson.item).length;
    } catch (error) {
      console.log("Error: " + infoJson);
      throw fail.checkedError(infoJson, "Error_api");
    }

  if(keyword == "Adoption" || keyword == "Emergency" || keyword == "Walk"){
    for(var i=0; i<totalItems; i++){

      if(infoJson.item[i].keyword == keyword){
        var imageUrl = [];
        if(infoJson.item[i].descriptionImage){
        for(var j=0; j<parseInt(Object.keys(infoJson.item[i].descriptionImage).length); j++) {
          imageUrl.push(infoJson.item[i].descriptionImage[j].url) 
          }
        }
        
        data = {
          keyword: infoJson.item[i].keyword,
          link: infoJson.item[i].link,
          source: infoJson.item[i].source,
          image: infoJson.item[i].image,
          name: infoJson.item[i].name,
          title: infoJson.item[i].title,
          description: infoJson.item[i].description,
          descriptionImage: imageUrl,
        };
        result.push(data);
      }
    }
  }
  else {throw fail.checkedError("Error_no_service", "Error_no_service")}
  
  if (result == null) { throw fail.checkedError("Error_no_result", "Error_no_result") }

  return result;
}
