var _ = require('lodash');
var Promise = require('es6-promise').Promise;
var StorageService = require('./services/storage-service');
var moment = require('moment');
var CronJob = require('cron').CronJob;



/**
 * Schedule that rotates a set of users through a set of days.
 *
 * @class Schedule
 * @constructor
 *
 * @param {Object} opts             Options
 * @param {String} opts.name        The unique name used to store schedule order
 * @param {Date}   opts.startDate   The date the first group started their first task
 * @param {Array}  opts.people      The hardcoded source of people for the task
 * @param {Number} opts.taskSize    The number of people required for the task
 * @param {Number} opts.taskLength  The amount of time in days that task lasts
 *
 */
function Schedule(opts) {
  this.opts = _.defaults(opts, this.DEFAULTS);
  this.opts.startDate = moment(this.opts.startDate)
}


/**
 * Schedule Defaults
 * @public
 */
Schedule.prototype.DEFAULTS = {
  taskSize: 1,
  taskLength: 1
}


/**
 * Syncs schedule order by merging persisted order and people source.
 * @public
 *
 * @param {Function} cb  Function to call when schedule is synced and ready to use.
 */
Schedule.prototype.sync = function(cb) {
  var that = this;
  var promisePeople = this.getPeople();
  var promiseOrder = this.getOrder();
  return Promise.all([promisePeople, promiseOrder]).then(function(values) {
    that.people = values[0];
    that.order = values[1];
    that.setOrder().then(function () {
      try {
        that.calcScheduleHash();
        that.ready = true;
      }catch(e) {
        console.error(e.stack)
      }
      return cb(that);
    }, that.handleErrorr);
  }, that.handleError);
};




/**
 * Syncs schedule order by merging persisted order and people source.
 * @public
 *
 * @param {String}   cron      The cron syntax for frequency
 * @param {Function} cb        Function to call when cron is triggered
 */
Schedule.prototype.on = function(cron, cb) {

  new CronJob(cron, function(){
    cb.call(this)
  }, null, true, 'America/New_York', this)

};




/**
 * Gets order of people from store.
 *
 * @private
 */
Schedule.prototype.getOrder = function() {
  return StorageService.getList(this.opts.name);
};



/**
 * Sets order of people given current list of people in memory.
 *
 * @private
 */
Schedule.prototype.setOrder = function() {
  var differences, i, len, person, toAdd, toRemove;
  differences = _.xor(this.people, this.order);
  toRemove = [];
  toAdd = [];
  for (i = 0, len = differences.length; i < len; i++) {
    person = differences[i];
    if (_.contains(this.order)) {
      this.order = _.without(this.order(person));
    } else {
      this.order.push(person);
    }
  }
  return StorageService.replaceList(this.opts.name, this.order);
};




/**
 * Gets people from options if passed it. Subclasses should override this
 * and return a promise that will resolve people.
 *
 * @private
 */
Schedule.prototype.getPeople = function() {
  var that = this
  return new Promise(function(resolve, reject) {
    if (that.opts.people) {
      return resolve(that.opts.people);
    } else {
      throw new Error('Subclasses of Schedule must implement people');
    }
  });
}




/**
 * Calculates valid task days based on options passed in.
 *
 * @private
 */
Schedule.prototype.days = function() {
  var currentDate, days, endDate;
  var startDate = moment(this.opts.startDate);
  endDate = moment().add('days', 365);
  days = [];
  while (startDate.isBefore(endDate)) {
    if (startDate.isoWeekday() != 6 && startDate.isoWeekday() != 7) {
      days.push(startDate.format('YYYYMMDD'))
    }
    startDate.add('days', 1);
  }
  return days;
};




/**
 *
 *
 * @private
 */
Schedule.prototype.calcScheduleHash = function() {
  var that = this;
  var scheduleHash = this.scheduleHash = {}
  var taskChunks = _.chunk(this.days(), this.opts.taskLength);
  taskChunks.forEach(function(chunk, i){
    var peopleIndex = (i * that.opts.taskSize) % that.people.length;
    var peopleIndexEnd =  peopleIndex + that.opts.taskSize

    var people = that.order.slice(peopleIndex,  peopleIndex + that.opts.taskSize);

    if(peopleIndexEnd > that.order.length){
      people = people.concat(that.order.slice(0, peopleIndexEnd - that.order.length ))
    }

    chunk.forEach(function(day){
      scheduleHash[day] = people
    })
  });
};




/**
 * Syncs schedule order by merging persisted order and people source.
 * @public
 */
Schedule.prototype.whosOnToday = function() {
  return this.scheduleHash[moment().format('YYYYMMDD')];
};




Schedule.prototype.whosOnNext = function() {
  var whosOnToday = this.whosOnToday();
  var users;
  var date = moment();
  while(!users || _.isEqual(whosOnToday, users)){
    users = this.scheduleHash[date.add('days', 1).format('YYYYMMDD')];
  }
  return users;
};


/**
 * Syncs schedule order by merging persisted order and people source.
 * @public
 */
Schedule.prototype.switch = function(personOne, personTwo, cb) {
  var indexOne = this.order.indexOf(personOne);
  var indexTwo = this.order.indexOf(personTwo);
  this.order[indexOne] = personTwo;
  this.order[indexTwo] = personOne;
  this.calcScheduleHash();
  this.setOrder().then(cb, this.handleError)
};




/**
 * Syncs schedule order by merging persisted order and people source.
 * @private
 */
Schedule.prototype.handleError = function(error) {
  return console.error(error.stack)
};




module.exports = Schedule;