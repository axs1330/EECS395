const fs = require('fs');

let scheduleFileList = ['example-events2.json']
/*
let rawdata = fs.readFileSync('example-events2.json');
let student = JSON.parse(rawdata);
console.log(student[0].start.dateTime);

let month_days = [31,29,31,30,31,31,30,31,30,31] 
console.log(getStartTime(student[0].start.dateTime)) */

let master_schedules = parseScheduleFiles(scheduleFileList)
console.log(getStartTime(master_schedules[0][0]))
console.log(getEndTime(master_schedules[0][0]))
console.log(getEventDate(master_schedules[0][0]))

console.log(naiveSchedule(master_schedules, '2020-02-19', '12:00:00', '14:00:00', '00:40:00', '00:05:00'))

function parseScheduleFiles(scheduleFileList){
    let master_schedules = []
    for(let i = 0; i < scheduleFileList.length; i++){
        let filename = scheduleFileList[i];

        let rawdata = fs.readFileSync(filename);
        let single_schedule = JSON.parse(rawdata);
        master_schedules.push(single_schedule)
    }
    return(master_schedules)
}



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
    let best_start_time = "00:00:00"
    let best_utility = -10000000
    let trial_time_start = "00:00:00"
    while(time_add(trial_time_start, event_length) != false){
        let trial_time_end = time_add(trial_time_start, event_length)
        console.log("Considering: " + trial_time_start + " to " + trial_time_end)
        let closest_previous = "00:00:00"
        let closest_after = "23:59:59"
        let conflict_flag = false;
        for(var i = 0; i < schedules.length; i++){//bad SW practice TODO: fix
            let current_schedule = schedules[i];
            for(var j = 0; j < current_schedule.length; j++){
                let current_event = current_schedule[j]
                let current_event_start = getStartTime(current_event)
                let current_event_end = getEndTime(current_event)
                if(getEventDate(current_event) != day){
                    continue
                }
                if(time_diff(trial_time_start, current_event_start) < 0){//our event starts earlier than scheduled event
                    if(time_diff(trial_time_end, current_event_start) > 0){//our event also ends later than schduled event's start
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                }
                if(time_diff(trial_time_start, current_event_start) > 0){//out event starts later than schuduled event
                    if(time_diff(trial_time_start, current_event_end) > 0){//our event event starts later than scheduled end
                        //console.log("end conflict: " + current_event_end)
                        //console.log(time_diff(trial_time_end, current_event_end))
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                }
                if(conflict_flag){
                    break;
                }
                if(earlier(closest_previous, current_event_start)){
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
        }else{
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
        trial_time_start = time_add(trial_time_start, inteval)
    }
    return(best_start_time)
}

function getStartTime(event){
    //input is jason event
    return(getTime(event.start.dateTime))
}
function getEndTime(event){
    return(getTime(event.end.dateTime))
}
function getEventDate(event){
    return(getDate(event.start.dateTime))
}

function getTime(dateTime){//TODO BAD NAMING!!!!
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
   let hour1 = parseInt(time1.substring(0,2))
   let hour2 = parseInt(time2.substring(0,2))
   diff += (hour1 - hour2) * 3600
   let minute1 = parseInt(time1.substring(3,5))
   let minute2 = parseInt(time2.substring(3,5))
   diff += (minute1 - minute2) * 60
   let second1 = parseInt(time1.substring(6))
   let second2 = parseInt(time2.substring(6))
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
   let second1 = parseInt(time.substring(6))
   let second2 = parseInt(increment.substring(6))
   let totalSecond = second1 + second2
   let minute1 = parseInt(time.substring(3,5))
   let minute2 = parseInt(increment.substring(3,5))
   let totalminute = minute1 + minute2
   if (totalSecond >= 60){
       totalminute += Math.floor(totalSecond/60)
       totalSecond = totalSecond%60
   }
   let hour1 = parseInt(time.substring(0,2))
   let hour2 = parseInt(increment.substring(0,2))
   let totalHours = hour1+hour2
   if (totalminute >= 60){
    totalHours += Math.floor(totalminute / 60)
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