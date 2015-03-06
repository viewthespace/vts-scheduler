var _ = require('lodash');
var should = require('should');
var Schedule = require('../src/schedule');
var StorageService = require('../src/services/storage-service');
var Promise = require('es6-promise').Promise;
var sinon = require('sinon');
var moment = require('moment');


var schedule, schedule2, schedule3, customSchedule;
var startDate =  moment('01-01-2015', 'MM-DD-YYYY');
var startDateClone = moment(startDate);




beforeEach(function(done) {

  StorageService.delList('test-schedule').then(function () {
    schedule = new Schedule({name: 'test-schedule', people: ['Bob', 'Peter', 'Romulus'], startDate: startDate});
    schedule.sync(function() {
      done();
    });
  });

});




beforeEach(function(done) {

  StorageService.delList('test-schedule-2').then(function(){
    schedule2 = new Schedule({ name: 'test-schedule-2', people: ['Bob', 'Peter', 'Romulus', 'Steve', 'Greg'], startDate: startDate, taskSize: 2, taskLength: 5 });
    schedule2.sync(function() {
      done();
    });
  });
});




beforeEach(function(done) {

  StorageService.delList('test-schedule-3').then(function(){
    schedule3 = new Schedule({ name: 'test-schedule-3', people: ['Bob', 'Peter', 'Romulus', 'Steve', 'Greg'], startDate: startDate, taskSize: 2, taskLength: 2 });
    schedule3.sync(function() {
      done();
    });
  });

});




var CustomSchedule = (function() {

  function CustomSchedule(opts) {
    Schedule.call(this, opts)
  }

  CustomSchedule.prototype = Object.create(Schedule.prototype);
  //CustomSchedule.prototype.constructor = CustomSchedule;

  CustomSchedule.prototype.getPeople = function () {
    return new Promise(function (resolve) {
      resolve(['Shawn', 'Michael'])
    })
  }

  return CustomSchedule

})();



beforeEach(function(done){
  StorageService.delList('custom-schedule23').then(function() {
    customSchedule = new CustomSchedule({name: 'custom-schedule23', stateDate: startDate});
    customSchedule.sync(function() {
      done()
    });
  });

});



afterEach(function(){
  sinon.useFakeTimers(startDateClone.valueOf());
});




describe('whosOnToday', function() {

  it('gives name of who\'s on for schedule 1', function() {
    sinon.useFakeTimers(startDateClone.valueOf());
    schedule.whosOnToday().should.eql(['Bob']);
    sinon.useFakeTimers(moment('01-02-2015', 'MM-DD-YYYY').valueOf());
    schedule.whosOnToday().should.eql(['Peter']);
    sinon.useFakeTimers(moment('01-05-2015', 'MM-DD-YYYY').valueOf());
    schedule.whosOnToday().should.eql(['Romulus']);
    sinon.useFakeTimers(moment('01-06-2015', 'MM-DD-YYYY').valueOf());
    schedule.whosOnToday().should.eql(['Bob']);
  });


  it('gives names of who\'s on for schedule 2', function(){
    sinon.useFakeTimers(startDateClone.valueOf());
    schedule2.whosOnToday().should.eql(['Bob', 'Peter']);
    sinon.useFakeTimers(moment('01-08-2015', 'MM-DD-YYYY').valueOf());
    schedule2.whosOnToday().should.eql(['Romulus', 'Steve']);
    sinon.useFakeTimers(moment('01-14-2015', 'MM-DD-YYYY').valueOf());
    schedule2.whosOnToday().should.eql(['Romulus', 'Steve']);
    sinon.useFakeTimers(moment('01-15-2015', 'MM-DD-YYYY').valueOf());
    schedule2.whosOnToday().should.eql(['Greg', 'Bob']);
    sinon.useFakeTimers(moment('01-16-2015', 'MM-DD-YYYY').valueOf());
    schedule2.whosOnToday().should.eql(['Greg', 'Bob']);
  });
  

  it('gives names of who\'s on for schedule 3', function(){
    sinon.useFakeTimers(startDateClone.valueOf());
    schedule3.whosOnToday().should.eql(['Bob', 'Peter']);
    sinon.useFakeTimers(moment('01-02-2015', 'MM-DD-YYYY').valueOf());
    schedule3.whosOnToday().should.eql(['Bob', 'Peter']);
    sinon.useFakeTimers(moment('01-05-2015', 'MM-DD-YYYY').valueOf());
    schedule3.whosOnToday().should.eql(['Romulus', 'Steve']);
    sinon.useFakeTimers(moment('01-06-2015', 'MM-DD-YYYY').valueOf());
    schedule3.whosOnToday().should.eql(['Romulus', 'Steve']);
    sinon.useFakeTimers(moment('01-07-2015', 'MM-DD-YYYY').valueOf());
    schedule3.whosOnToday().should.eql(['Greg', 'Bob']);
  });

});




describe('on', function(){

  it('executes callback given cron', function(done){
    var clock = sinon.useFakeTimers(moment('01-02-2015', 'MM-DD-YYYY').valueOf());
    schedule.on('0 8 * * *', function(){
      done()
    });
    clock.tick(1000 * 60 * 60 * 24)
  })

});




describe('switch', function(){

  it('allows people to switch places in order', function(done){

    schedule.switch('Bob', 'Peter', function(){

      schedule.order.should.eql([ 'Peter', 'Bob', 'Romulus' ]);

      var savedSchedule = new Schedule({ name: 'test-schedule', people: ['Bob', 'Peter', 'Romulus'], startDate: startDate });
      savedSchedule.sync(function() {
        savedSchedule.order.should.eql([ 'Peter', 'Bob', 'Romulus' ]);
        done();
      });

    });

  })

});




describe('subclassing', function(){

  it('pulls people from a source', function(){
    customSchedule.order.should.eql([ 'Shawn', 'Michael' ]);
    customSchedule.whosOnToday().should.eql(['Shawn']);
  });

});