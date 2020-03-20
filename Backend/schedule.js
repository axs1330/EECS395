'use strict';

const fs = require('fs');
   
let rawdata = fs.readFileSync('example-events2.json');
let student = JSON.parse(rawdata);
console.log(student[0].start.dateTime);

let month_days = [31,29,31,30,31,31,30,31,30,31] 
console.log(getStartTime(student[0].start.dateTime))

function naiveSchedule(schedules, day, start, end, event_length, inteval) {
    /*
    Params:
    Schedules: an array of parsed schedules 
    day: formated as "2020-02-19"
    Start: string formating such as "2020-02-19T09:30:00-05:00"
    End: Same
    Inteval: Search inteval for the for loop
    TODO: currently not considering start and end, 
    */
    best_start_time = "00:00:00"
    best_utility = -10000000
    trial_time_start = "00:00:00"
    while(time_add(trial_time_start, inteval) != false){
        trial_time_end = time
        console.log("Considering: " + trial_time_start)
        closest_previous = "00:00:00"
        closest_after = "23:59:59"
        conflict_flag = false;
        for(var i = 0; i < schedules.length; i++){//bad SW practice TODO: fix
            current_schedule = schedules[i];
            for(var j = 0; j < current_schedule.length; j++){
                current_event = current_schedule[j]
                current_event_start = getStartTime(current_event)
                current_event_end = getEndTime(current_event)
                if(time_diff(trial_time_start,current_event_start) < 0){
                    conflict_flag = true
                    break;
                }
                if(time_diff(trial_time_end, current_event_end) > 0){
                    conflict_flag = true;
                    break;
                }
                if(conflict_flag){
                    break;
                }
                if(earlier(closest_previous,current_event_start)){
                    closest_previous = current_event_start
                }
                if(earlier(current_event_end, closest_after)){
                    closest_after = current_event_end
                }
            }
            if(conflict_flag)
                break;
        }
        if(conflict_flag){
            console.log("Conflict Exists :(")
        }
        else{
            slot_utility = -1*(time_diff(trial_time_start, closest_previous) + time_diff(closest_after, trial_time_end))
            if(slot_utility > best_utility){
                best_utility = slot_utility
                best_start_time = trial_time_start
            }
            console.log("No conflict")
            console.log("closest previous event at : " + closest_previous)
            console.log("closest after evernt at : " + closest_after) 
            console.log("Slot utility: " + slot_utility)
        }
    }
    return(best_start_time)
}
function getStartTime(event){//TODO: test
    //input is jason event
    return(getTime(event.start.dateTime))
}
function getEndTime(event){//TODO: test
    return(getTime(event.end.dateTime))
}

function getTime(dateTime){
    /*
    Params:
    dateTime: in google API format a string "2020-02-19T09:30:00-05:00"
    */
   return(dateTime.substring(11,19))
}
function getDate(dateTime){
    /*
    dateTime: in google API format a string "2020-02-19T09:30:00-05:00"
    */
   return(dateTime.substring(0,10))
}
function time_diff(time1, time2){
    /*
    Params:
    time1: in google API format a string "09:30:00"
    returns time1 - time2 in seconds. Positive if time1 is later
    */
   let diff = 0
   hour1 = parseInt(time1.substring(0,2))
   hour2 = parseInt(time2.substring(0,2))
   diff += (hour1 - hour2) * 3600
   minute1 = parseInt(time1.substring(3,5))
   minute2 = parseInt(time2.substring(3,5))
   diff += (minute1 - minute2) * 60
   second1 = parseInt(time1.substring(6))
   second2 = parseInt(time2.substring(6))
   diff += second1 - second2
   return diff
}
function earlier(time1, time2){
    if(time_diff(time1, time2) > 0){
        return false
    }
    return true
}

function time_add(time, increment){
    /* 
    Params: 
    2 times without date
    return: the first time pushed ahead by increment
    returns false if carries over 24 hours
    */
   let finalTime = ""
   second1 = parseInt(time.substring(6))
   second2 = parseInt(increment.substring(6))
   let totalSecond = second1 + second2
   minute1 = parseInt(time.substring(3,5))
   minute2 = parseInt(increment.substring(3,5))
   let totalminute = minute1 + minute2
   if (totalSecond > 60){
       totalminute += totalSecond/60
       totalSecond = totalSecond%60
   }
   hour1 = parseInt(time.substring(0,2))
   hour2 = parseInt(increment.substring(0,2))
   let totalHours = hour1+hour2
   if (totalminute > 60){
    totalhour += totalminute / 60
    totalminute = totalminute % 60
   }
   if(totalHours >= 24){
       return false
   }
   if(totalHours < 10)
    finalTime = "0" + totalHours + ":";
   else
    finalTime = totalHours + ":";

   if(totalminute < 10)
    finalTime = finalTime + "0" + totalminute + ":";
   else
    finalTime = finalTime + totalminute + ":";

   if(totalSecond < 10)
    finalTime = finalTime + "0" + totalSecond;
   else
    finalTime = finalTime + totalSecond;
   return finalTime
}