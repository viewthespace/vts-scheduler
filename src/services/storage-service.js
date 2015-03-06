var redis = require('redis');
var urlParser = require('url');
var Promise = require('es6-promise').Promise;




function StorageService() {
  if(!process.env.REDIS_URL){
    throw new Error('REDIS_URL needs to be set');
  }
  var parsedUrl = urlParser.parse(process.env.REDIS_URL);
  this.client = redis.createClient(parsedUrl.port, parsedUrl.hostname);
}




StorageService.prototype.replaceList = function(key, list, cb) {
  var that = this;
  return new Promise(function(resolve, reject) {
    var multi = that.client.multi();
    multi.del(key);
    list.forEach(function(item){
      multi.rpush(key, item);
    })
    multi.exec(function(err) {
      if (err) {
        throw new Error(err);
      } else {
        resolve();
      }
    });
  });
};




StorageService.prototype.getList = function(key, cb) {
  var that = this;
  return new Promise(function(resolve, reject) {
    that.client.lrange(key, 0, -1, function(err, list) {
      if (err) {
        reject(err)
      } else {
        resolve(list);
      }
    });
  });
};




StorageService.prototype.delList = function(key, cb) {
  var that = this;
  return new Promise(function(resolve, reject) {
    that.client.del(key, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve();
      }
    });
  });
};




module.exports = new StorageService();


