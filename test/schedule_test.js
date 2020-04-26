var test = require('unit.js');
let chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
const scheduler = require('./../Backend/schedule.js');

let scheduleFileList = ['.\\test\\example-events3.json']
let default_location_file = 'Supporting Documents\Meeting Locations'

let master_schedules = scheduler.parseScheduleFilesTest(scheduleFileList);
//console.log(scheduler.getStartTimeTest(master_schedules[0][0]))
//console.log(scheduler.getEndTimeTest(master_schedules[0][0]))
//console.log(scheduler.getEventDateTest(master_schedules[0][0]))

//console.log(scheduler.naiveScheduleTest(master_schedules, '2020-02-19', '12:00:00', '14:00:00', '00:40:00', '00:05:00'))
//naiveScheduleWithLocation(master_schedules, '2020-02-19T04:30:00',  '2020-02-19T23:30:00', '00:40:00','00:05:00', null)

describe('schedule', function(){
  it('parseScheduleFiles', function(){
    let master_schedules2 = scheduler.parseScheduleFilesTest(scheduleFileList);
    let time_test = scheduler.getStartTimeTest(master_schedules2[0][0])
    let time_test2 = scheduler.getStartTimeTest(master_schedules2[0][1])
    test
      .string(time_test)
      .startsWith("09:30:00")
    ;
    test
      .string(time_test2)
      .startsWith("10:35:00")
    ;
  });
  it('naiveScheduleWithLocation', function(){
    let events = scheduler.naiveScheduleWithLocation(master_schedules, '2020-02-19T04:30:00',  '2020-02-19T23:30:00', '00:40:00','00:05:00', null);
  });
  it('getStartTime', function(){
    let time_test = scheduler.getStartTimeTest(master_schedules[0][0])
    let time_test2 = scheduler.getStartTimeTest(master_schedules[0][1])
    test
      .string(time_test)
      .startsWith("09:30:00")
    ;
    test
      .string(time_test2)
      .startsWith("10:35:00")
    ;
  });
  it('getEndTime', function(){
    let time_test = scheduler.getEndTimeTest(master_schedules[0][0])
    let time_test2 = scheduler.getEndTimeTest(master_schedules[0][1])
    test
      .string(time_test)
      .startsWith("10:20:00")
    ;
    test
      .string(time_test2)
      .startsWith("11:25:00")
    ;
  });
  it('getLocation', function(){
    let test1 = scheduler.getLocationTest(master_schedules[0][0])
    let test2 = scheduler.getLocationTest(master_schedules[0][1])
    test
      .string(test1)
      .startsWith("Olin 303")
    ;
    test
      .string(test2)
      .startsWith("White 411")
    ;
  });
  it('getEventDate', function(){
    let test1 = scheduler.getEventDateTest(master_schedules[0][0])
    let test2 = scheduler.getEventDateTest(master_schedules[0][1])
    test
      .string(test1)
      .startsWith("2020-02-19")
    ;
    test
      .string(test2)
      .startsWith("2020-02-19")
    ;
  });
  it('getTime', function(){
    let time_test = scheduler.getTimeTest(master_schedules[0][0].start.dateTime)
    let time_test2 = scheduler.getTimeTest(master_schedules[0][1].start.dateTime)
    test
      .string(time_test)
      .startsWith("09:30:00")
    ;
    test
      .string(time_test2)
      .startsWith("10:35:00")
    ;
  });
  it('getDate', function(){
    let test1 = scheduler.getDateTest(master_schedules[0][0].start.dateTime)
    let test2 = scheduler.getDateTest(master_schedules[0][1].start.dateTime)
    test
      .string(test1)
      .startsWith("2020-02-19")
    ;
    test
      .string(test2)
      .startsWith("2020-02-19")
    ;
  });
  it('time_diff', function(){
    let time1 = "00:00:00";
    let time2 = "00:00:01";
    let time3 = "00:01:00";
    let time4 = "01:00:00";
    let time5 = "23:59:59";
    let time6 = "00:00:60";
    expect(scheduler.time_diffTest(time1,time2)).to.eql(-1);
    expect(scheduler.time_diffTest(time2,time1)).to.eql(1);
    expect(scheduler.time_diffTest(time3,time1)).to.eql(60);
    expect(scheduler.time_diffTest(time4,time1)).to.eql(3600);
    expect(scheduler.time_diffTest(time5,time1)).to.eql(86399);
    expect(scheduler.time_diffTest(time6,time1)).to.eql(60);
  });
  it('earlier', function(){
    let time1 = "00:00:00";
    let time2 = "00:00:01";
    let time3 = "00:00:01";
    assert(scheduler.earlierTest(time1,time2));
    assert(!scheduler.earlierTest(time2,time1));
    assert(!scheduler.earlierTest(time3,time1));
    assert(scheduler.earlierTest(time1,time1));
  });

  it('time_add', function(){
    let time1 = "00:00:00";
    let time2 = "00:00:01";
    let time3 = "00:01:00";
    let time4 = "01:00:00";
    let time5 = "23:59:59";
    let time6 = "00:00:60";
    let test1 = scheduler.time_addTest(time1,time2);
    let test2 = scheduler.time_addTest(time2,time1);
    let test3 = scheduler.time_addTest(time3,time2);
    let test4 = scheduler.time_addTest(time4,time3);
    assert(!scheduler.time_addTest(time5,time2));
    let test5 = scheduler.time_addTest(time6,time2);
    test
      .string(test1)
      .startsWith("00:00:01")
    ;
    test
      .string(test2)
      .startsWith("00:00:01")
    ;
    test
      .string(test3)
      .startsWith("00:01:01")
    ;
    test
      .string(test4)
      .startsWith("01:01:00")
    ;
    test
      .string(test5)
      .startsWith("00:01:01")
    ;
  });
  it('date_diff', function(){
    let date1 = "2020-01-19";
    let date2 = "2020-02-19";
    let date3 = "2021-01-19";
    let date4 = "2020-03-20";
    let date5 = "2020-01-20";
    let date6 = "2020-02-18";
    expect(scheduler.date_diffTest(date1,date5)).to.eql(-1);
    expect(scheduler.date_diffTest(date5,date1)).to.eql(1);
    expect(scheduler.date_diffTest(date1,date1)).to.eql(0);
    expect(scheduler.date_diffTest(date2,date1)).to.eql(31);
    expect(scheduler.date_diffTest(date6,date1)).to.eql(30);
    expect(scheduler.date_diffTest(date3,date1)).to.eql(366);
    expect(scheduler.date_diffTest(date4,date1)).to.eql(61);
    expect(scheduler.date_diffTest(date1,date2)).to.eql(-31);
    expect(scheduler.date_diffTest(date1,date6)).to.eql(-30);
    expect(scheduler.date_diffTest(date1,date3)).to.eql(-366);
    expect(scheduler.date_diffTest(date1,date4)).to.eql(-61);
  });
  it('date_inc', function(){
    let date1 = scheduler.date_incTest("2020-01-19");
    let date2 = scheduler.date_incTest("2020-02-29");
    let date3 = scheduler.date_incTest("2020-12-31");
    let date4 = scheduler.date_incTest("2020-09-30");
    let date5 = scheduler.date_incTest("2020-01-09");
    test
      .string(date1)
      .startsWith("2020-01-20")
    ;
    test
      .string(date2)
      .startsWith("2020-03-01")
    ;
    test
      .string(date3)
      .startsWith("2021-01-01")
    ;
    test
      .string(date4)
      .startsWith("2020-10-01")
    ;
    test
      .string(date5)
      .startsWith("2020-01-10")
    ;
  });
});